"""Render the Lucide list-filter mark into Chrome's required PNG sizes.
Run with Python 3 and Pillow. No extension runtime dependencies.
Icon geometry: https://lucide.dev/icons/list-filter (ISC, see icons/LICENSE-lucide.txt).
"""
from pathlib import Path
from urllib.parse import quote
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / 'extension' / 'icons'
# Lucide's 24px list-filter glyph, placed within the existing brand tile.
LINES = ((3, 6, 21, 6), (7, 12, 17, 12), (10, 18, 14, 18))
SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="28" fill="#c2b9ff"/>
  <g transform="translate(22 22) scale(3.5)" fill="none" stroke="#29243f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 6h18"/>
    <path d="M7 12h10"/>
    <path d="M10 18h4"/>
  </g>
</svg>
'''
ICONS.mkdir(exist_ok=True)
(ICONS / 'content-lens.svg').write_text(SVG)
SCALE = 8
image = Image.new('RGBA', (128 * SCALE, 128 * SCALE))
draw = ImageDraw.Draw(image)
purple, ink = '#c2b9ff', '#29243f'
def box(values):
    return tuple(round(value * SCALE) for value in values)
draw.rounded_rectangle(box((4, 4, 124, 124)), radius=28*SCALE, fill=purple)
for x1, y1, x2, y2 in LINES:
    points = [(22 + 3.5*x1, 22 + 3.5*y1), (22 + 3.5*x2, 22 + 3.5*y2)]
    draw.line([box(point) for point in points], fill=ink, width=7*SCALE)
    for x, y in points:
        draw.ellipse(box((x-3.5, y-3.5, x+3.5, y+3.5)), fill=ink)
for size in (16, 24, 32, 48, 64, 128):
    image.resize((size, size), Image.Resampling.LANCZOS).save(ICONS / f'icon-{size}.png')
# Keep the injected page toolbar identical without exposing extension resources.
styles = ROOT / 'extension' / 'styles.js'
s = styles.read_text()
start = s.index('.mark {'); end = s.index('\n', start)
uri = 'data:image/svg+xml,' + quote(SVG.strip(), safe='')
s = s[:start] + '.mark { display:block; flex:0 0 24px; width:24px; height:24px; background:url("' + uri + '") center/contain no-repeat; }' + s[end:]
styles.write_text(s)
print('Generated Lucide filter SVG, six PNG sizes, and inline toolbar mark.')

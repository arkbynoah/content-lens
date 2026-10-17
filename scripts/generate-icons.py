"""Render the Content Lens vector mark into Chrome's required PNG sizes.
Run with Python 3 and Pillow. No extension runtime dependencies.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / 'extension' / 'icons'
SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="30" fill="#c2b9ff"/>
  <g fill="none" stroke="#29243f" stroke-linecap="round">
    <circle cx="56" cy="54" r="28" stroke-width="9"/>
    <path d="M77 75 98 96" stroke-width="11"/>
    <path d="M44 48H68M44 60H59" stroke-width="7"/>
  </g>
</svg>
'''
ICONS.mkdir(exist_ok=True)
(ICONS / 'content-lens.svg').write_text(SVG)
# Supersample the same geometry to keep curves clean at toolbar sizes.
SCALE = 8
image = Image.new('RGBA', (128 * SCALE, 128 * SCALE))
draw = ImageDraw.Draw(image)
purple, ink = '#c2b9ff', '#29243f'
def box(values):
    return tuple(round(value * SCALE) for value in values)
def line(points, width):
    draw.line([box(point) for point in points], fill=ink, width=round(width * SCALE))
    radius = width / 2
    for x, y in points:
        draw.ellipse(box((x-radius, y-radius, x+radius, y+radius)), fill=ink)
draw.rounded_rectangle(box((4, 4, 124, 124)), radius=30*SCALE, fill=purple)
# Center the circle stroke on the vector radius.
draw.ellipse(box((23.5, 21.5, 88.5, 86.5)), fill=ink)
draw.ellipse(box((32.5, 30.5, 79.5, 77.5)), fill=purple)
line([(77, 75), (98, 96)], 11)
line([(44, 48), (68, 48)], 7)
line([(44, 60), (59, 60)], 7)
for size in (16, 24, 32, 48, 64, 128):
    image.resize((size, size), Image.Resampling.LANCZOS).save(ICONS / f'icon-{size}.png')
print('Generated SVG source and six PNG icon sizes.')

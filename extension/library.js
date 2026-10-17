(() => {
  'use strict';
  const core = globalThis.ContentLensCore, api = globalThis.browser || globalThis.chrome;
  const $ = id => document.getElementById(id), size = 24;
  let data = {}, page = 1, editing = null;
  const node = (tag, text, cls) => { const el = document.createElement(tag); el.textContent = text || ''; if (cls) el.className = cls; return el; };
  function options(id, values, first) { $(id).replaceChildren(...[['', first], ...values.map(x => [x, x])].map(([value, text]) => { const option = node('option', text); option.value = value; return option; })); }
  options('format', core.formats, 'All presentations'); options('structure', core.structures, 'All structures');
  options('edit-format', core.formats, 'Not tagged'); options('edit-structure', core.structures, 'Not tagged');
  function records() { return Object.entries(data).filter(([key, value]) => key.startsWith('library:') && core.canonicalPost(value?.url) && typeof value.scope === 'string').map(([, value]) => value); }
  function collections() {
    const previous = $('collection').value || decodeURIComponent(location.hash.slice(1));
    const scopes = new Map(records().map(post => [post.scope, post.label || post.scope]));
    options('collection', [], 'All indexed collections');
    for (const [key, label] of scopes) { const option = node('option', label + (key.includes('tiktok.com') ? ' · TikTok' : ' · Instagram')); option.value = key; $('collection').append(option); }
    if (scopes.has(previous)) $('collection').value = previous;
  }
  function render() {
    const all = records().filter(post => !$('collection').value || post.scope === $('collection').value);
    const unique = [...new Map(all.map(post => [core.metricKey(post.url, 'views'), post])).values()].map(post => core.withRememberedMetrics(post, data));
    const selected = core.selectPosts(unique.map(post => ({ ...post, caption: [post.creator, post.caption].filter(Boolean).join(' · ') })), data,
      { metric: $('metric').value, type: $('type').value, format: $('format').value, structure: $('structure').value, search: $('query').value, hints: !!$('hints').value });
    const pages = Math.max(1, Math.ceil(selected.length / size)); page = Math.max(1, Math.min(pages, page));
    $('page').value = page; $('page').max = pages; $('pages').textContent = 'of ' + pages;
    $('previous').disabled = page === 1; $('next').disabled = page === pages;
    const metric = $('metric').value, known = selected.filter(post => post[metric] != null).length;
    $('status').textContent = selected.length + ' matches · ' + unique.length + ' indexed' + (metric === 'order' ? '' : ' · ' + known + ' with ' + metric + ' (last 24h)');
    $('hint-note').hidden = !$('hints').value;
    $('empty').hidden = !!selected.length;
    $('empty').textContent = unique.length ? 'No matches. Clear a filter, search another phrase, or include caption suggestions. Categories require tags or a caption clue.' : 'Nothing indexed here yet. Visit a profile or saved collection with Content Lens enabled. Posts are remembered as you browse.';
    $('results').replaceChildren(...selected.slice((page - 1) * size, page * size).map(card));
  }
  function card(post) {
    const article = node('article', '', 'card'), cover = node('a', 'Open post ↗', 'cover'); cover.href = post.url; cover.target = '_blank'; cover.rel = 'noopener noreferrer';
    // Only stored HTTPS thumbnail URLs from the platforms' media hosts may be loaded.
    try { const url = new URL(post.thumbnail); if (url.protocol === 'https:' && /(^|\.)(cdninstagram\.com|fbcdn\.net|tiktokcdn\.com|tiktokcdn-us\.com|tiktokcdn-eu\.com|byteoversea\.com)$/.test(url.hostname)) {
      cover.textContent = '';
      const img = document.createElement('img'); img.src = url.href; img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; img.addEventListener('error', () => { img.remove(); cover.textContent = 'Open post ↗'; }); cover.append(img);
    } } catch { /* Expired or missing thumbnails do not prevent browsing. */ }
    const body = node('div', '', 'card-body'), tag = data['tag:' + post.url] || {}, hint = $('hints').value ? core.captionHints(post.caption) : {};
    body.append(node('div', post.type + ' · ' + (post.url.includes('instagram.com') ? 'Instagram' : 'TikTok'), 'meta'), node('p', post.caption || 'No caption available', 'caption'));
    body.append(node('p', [tag.format || (hint.format ? hint.format + ' (suggested)' : ''), tag.structure || (hint.structure ? hint.structure + ' (suggested)' : '')].filter(Boolean).join(' · ') || 'Not categorized', 'labels'));
    const metric = $('metric').value;
    if (metric !== 'order') body.append(node('p', post[metric] == null ? 'No ' + metric + ' count available' : '≈ ' + post[metric].toLocaleString() + ' ' + metric, 'meta'));
    const actions = node('div', '', 'card-actions'), open = node('a', 'Open post ↗'); open.href = post.url; open.target = '_blank'; open.rel = 'noopener noreferrer';
    const edit = node('button', 'Edit tags'); edit.onclick = () => { editing = post; $('edit-format').value = tag.format || ''; $('edit-structure').value = tag.structure || ''; $('notes').value = tag.notes || ''; $('error').textContent = ''; $('editor').showModal(); };
    actions.append(open, edit); body.append(actions); article.append(cover, body); return article;
  }
  $('save').onclick = async event => {
    event.preventDefault(); if (!editing) return; $('save').disabled = true;
    try { const key = 'tag:' + editing.url, tag = core.cleanTag({ format: $('edit-format').value, structure: $('edit-structure').value, notes: $('notes').value }); await api.storage.local.set({ [key]: tag }); data[key] = tag; $('editor').close(); render(); }
    catch { $('error').textContent = 'Could not save. Try again.'; } finally { $('save').disabled = false; }
  };
  for (const id of ['collection', 'type', 'format', 'structure', 'metric', 'hints']) $(id).onchange = () => { page = 1; render(); };
  $('query').oninput = () => { page = 1; render(); };
  $('page').onchange = () => { page = Math.max(1, Number.parseInt($('page').value, 10) || 1); render(); };
  $('previous').onclick = () => { page--; render(); }; $('next').onclick = () => { page++; render(); };
  $('reset').onclick = () => { for (const id of ['type', 'format', 'structure', 'query', 'hints']) $(id).value = ''; $('metric').value = 'order'; page = 1; render(); };
  api.storage.local.get(null).then(value => { data = value; collections(); render(); }).catch(() => { $('status').textContent = 'Could not read the local index. Reload this page.'; });
  api.storage.onChanged.addListener((changes, area) => { if (area !== 'local') return; for (const [key, change] of Object.entries(changes)) { if (change.newValue === undefined) delete data[key]; else data[key] = change.newValue; } collections(); render(); });
})();

(() => {
  'use strict';
  if (document.getElementById('content-lens-root')) return;
  const core = globalThis.ContentLensCore, adapters = globalThis.ContentLensAdapters, grids = globalThis.ContentLensGrid;
  const api = globalThis.browser || globalThis.chrome;
  const grid = new grids.NativeGrid(document);
  const host = document.createElement('div'); host.id = 'content-lens-root';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style'); style.textContent = globalThis.ContentLensStyles; shadow.append(style);
  const el = (tag, text, cls) => { const node = document.createElement(tag); if (text) node.textContent = text; if (cls) node.className = cls; return node; };
  const button = (text, action) => { const node = el('button', text); node.type = 'button'; node.addEventListener('click', action); return node; };
  function select(options, name) { const node = el('select'); node.setAttribute('aria-label', name); for (const [value, text] of options) { const option = el('option', text); option.value = value; node.append(option); } return node; }
  function label(text, input) { const node = el('label', text); node.append(input); return node; }
  let model = null, tags = {}, route = location.pathname, timer = null, loading = false, tagMode = false, editPost = null;
  const routePreferences = new Map();
  const badgeHosts = new Set();
  const shell = el('section', '', 'shell'); shell.setAttribute('aria-label', 'Content Lens');
  const bar = el('div', '', 'bar');
  const brand = el('span', '', 'brand'); brand.append(el('span', '↕', 'mark'), el('span', 'Content Lens'));
  const sort = select([['order', 'Original'], ['views:desc', 'Views'], ['likes:desc', 'Likes'], ['comments:desc', 'Comments']], 'Sort posts on this page'); sort.hidden = true;
  const sortGroup = el('div', '', 'segments'); sortGroup.setAttribute('role', 'group'); sortGroup.setAttribute('aria-label', 'Sort native posts');
  const metricButtons = new Map();
  for (const option of sort.options) {
    const control = button(option.textContent, () => { sort.value = option.value; scan(); });
    control.dataset.metric = option.value.split(':')[0]; control.setAttribute('aria-pressed', String(option.value === 'order'));
    metricButtons.set(option.value, control); sortGroup.append(control);
  }
  const directionControl = select([['desc', 'High → low'], ['asc', 'Low → high']], 'Sort direction'); directionControl.className = 'direction';
  const more = button('Load more posts ↓', loadMore); more.className = 'load-more';
  const tagsButton = button('Filters', () => { filters.hidden = !filters.hidden; tagsButton.setAttribute('aria-expanded', String(!filters.hidden)); });
  tagsButton.setAttribute('aria-expanded', 'false'); tagsButton.setAttribute('aria-controls', 'filters');
  const reset = button('Reset', () => { sort.value = 'order'; directionControl.value = 'desc'; format.value = ''; structure.value = ''; search.value = ''; tagMode = false; editPost = null; editor.hidden = true; tagButton.textContent = 'Tag posts'; scan(); }); reset.className = 'quiet';
  const count = el('span', '', 'count'); count.setAttribute('role', 'status');
  const coverage = button('Metric availability ⓘ', () => { metricsPanel.hidden = !metricsPanel.hidden; coverage.setAttribute('aria-expanded', String(!metricsPanel.hidden)); }); coverage.className = 'text-button'; coverage.setAttribute('aria-expanded', 'false'); coverage.setAttribute('aria-controls', 'metrics');
  bar.append(brand, sort, sortGroup, directionControl, tagsButton, reset);
  const statusRow = el('div', '', 'status-row'); statusRow.append(count, coverage, more);
  const metricsPanel = el('div', '', 'panel metrics'); metricsPanel.id = 'metrics'; metricsPanel.hidden = true;
  const metricRows = el('div', '', 'metric-rows');
  metricsPanel.append(el('strong', 'What can I sort?'), metricRows, el('p', 'Counts come from the loaded page, including Instagram’s hover overlays. Unavailable counts stay last; rounded counts may tie.'), el('p', 'Followers gained, saves, shares, reach, and watch time are not connected in this version. Creator insights support is a separate integration.'));
  const note = el('div', '', 'note'); note.hidden = true; note.setAttribute('role', 'status');
  const filters = el('div', '', 'panel filters'); filters.id = 'filters'; filters.hidden = true;
  const filterHeading = el('div', '', 'panel-heading'); filterHeading.append(el('strong', 'Find a type of video'), el('span', 'Your manual tags · saved on this device', 'muted'));
  const fields = el('div', '', 'fields');
  const format = select([['', 'All presentations'], ...core.formats.map(x => [x, x])], 'Filter presentation tags');
  const structure = select([['', 'All structures'], ...core.structures.map(x => [x, x])], 'Filter structure tags');
  const search = el('input'); search.type = 'search'; search.placeholder = 'Search your notes'; search.setAttribute('aria-label', 'Search notes and available captions');
  const tagButton = button('Tag posts', () => { tagMode = !tagMode; tagButton.textContent = tagMode ? 'Done tagging' : 'Tag posts'; tagButton.setAttribute('aria-pressed', String(tagMode)); scan(); });
  const backup = el('a', 'Back up tags ↗'); backup.href = api.runtime.getURL('options.html'); backup.target = '_blank'; backup.rel = 'noopener';
  fields.append(label('Presentation', format), label('Structure', structure), label('Search notes or captions', search));
  const filterActions = el('div', '', 'panel-actions');
  const clearFilters = button('Clear filters', () => { format.value = ''; structure.value = ''; search.value = ''; scan(); }); clearFilters.className = 'quiet';
  filterActions.append(tagButton, clearFilters, backup); filters.append(filterHeading, fields, filterActions);
  const editor = el('div', '', 'panel editor'); editor.hidden = true;
  const presentation = select([['', 'Not tagged'], ...core.formats.map(x => [x, x])], 'Presentation for selected reel');
  const narrative = select([['', 'Not tagged'], ...core.structures.map(x => [x, x])], 'Structure for selected reel');
  const notes = el('textarea'); notes.maxLength = 2000; notes.setAttribute('aria-label', 'Notes for selected reel');
  const save = button('Save', async () => {
    if (!editPost) return;
    save.disabled = true;
    try { const key = 'tag:' + editPost.url; const value = core.cleanTag({ format: presentation.value, structure: narrative.value, notes: notes.value }); await api.storage.local.set({ [key]: value }); tags[key] = value; editor.hidden = true; editPost = null; scan(); }
    catch { showNote('Could not save tags. Reload the page and try again.'); }
    finally { save.disabled = false; }
  });
  editor.append(label('Presentation', presentation), label('Structure', narrative), label('Notes', notes), save, button('Cancel', () => { editor.hidden = true; editPost = null; }));
  shell.append(bar, statusRow, note, metricsPanel, filters, editor); shadow.append(shell);
  shadow.addEventListener('keydown', event => { if (event.key === 'Escape') { editor.hidden = true; filters.hidden = true; metricsPanel.hidden = true; tagsButton.setAttribute('aria-expanded', 'false'); coverage.setAttribute('aria-expanded', 'false'); tagMode = false; tagButton.textContent = 'Tag posts'; syncBadges(); tagsButton.focus(); } });
  for (const control of [sort, directionControl, format, structure]) control.addEventListener('change', scan);
  search.addEventListener('input', schedule);
  function showNote(text) { note.textContent = text; note.hidden = !text; }
  function scan() {
    clearTimeout(timer); timer = null;
    if (route !== location.pathname) {
      routePreferences.set(route, { sort: sort.value, direction: directionControl.value, format: format.value, structure: structure.value, search: search.value });
      route = location.pathname;
      const previous = routePreferences.get(route);
      sort.value = previous?.sort || 'order'; directionControl.value = previous?.direction || 'desc'; format.value = previous?.format || ''; structure.value = previous?.structure || ''; search.value = previous?.search || ''; tagMode = false; loading = false;
      editor.hidden = true; editPost = null; host.remove();
    }
    grid.reset();
    const posts = adapters.readTiles(document, location.href);
    model = grids.discover(posts);
    if (!model) { host.remove(); clearBadges(); return; }
    if (host.nextSibling !== model.container) model.container.before(host);
    const available = Object.fromEntries(['views', 'likes', 'comments'].map(key => [key, posts.filter(post => post[key] != null).length]));
    const metric = sort.value.split(':')[0], direction = directionControl.value;
    for (const [value, control] of metricButtons) {
      control.setAttribute('aria-pressed', String(sort.value === value));
      const key = value.split(':')[0];
      control.title = key === 'order' ? 'Restore the profile’s original order, including pinned posts' : available[key] + ' of ' + posts.length + ' loaded posts have ' + key + ' counts';
    }
    directionControl.disabled = metric === 'order' || !available[metric];
    metricRows.replaceChildren(...Object.entries(available).map(([key, total]) => { const row = el('div', '', 'metric-row'); row.append(el('span', key[0].toUpperCase() + key.slice(1)), el('span', total ? total + ' of ' + posts.length + ' posts' : 'Not exposed on this page')); return row; }));
    const selected = core.selectPosts(model.posts, tags, { metric, direction, format: format.value, structure: structure.value, search: search.value });
    const active = metric !== 'order' || format.value || structure.value || search.value.trim();
    if (active) grid.apply(model, selected);
    const known = posts.filter(post => post[metric] != null).length;
    count.textContent = selected.length === posts.length ? `${posts.length} posts loaded` : `${selected.length} / ${posts.length} shown`;
    const numFilters = Number(!!format.value) + Number(!!structure.value) + Number(!!search.value.trim());
    reset.hidden = !active && !tagMode; clearFilters.hidden = !numFilters;
    tagsButton.textContent = numFilters ? 'Filters · ' + numFilters : 'Filters';
    coverage.textContent = metric === 'order' ? 'Metric availability ⓘ' : known + '/' + posts.length + ' with ' + metric + ' ⓘ';
    if (metric !== 'order' && !known) showNote('No ' + metric + ' counts are exposed on these tiles yet. Try hovering over posts or choose another metric. Original order is preserved.');
    else if (metric !== 'order' && known < posts.length) showNote((posts.length - known) + (posts.length - known === 1 ? ' post has' : ' posts have') + ' unavailable ' + metric + ' counts and ' + (posts.length - known === 1 ? 'appears' : 'appear') + ' last. Load more to include older posts.');
    else if (!selected.length) showNote('No matching tags. Use “Tag posts” to label videos, or Reset to show everything.');
    else if (metric !== 'order') showNote('');
    else showNote('');
    tagButton.setAttribute('aria-pressed', String(tagMode));
    syncBadges();
  }
  function schedule() { if (!timer) timer = setTimeout(scan, 350); }
  function clearBadges() { for (const node of badgeHosts) { node.parentElement?.removeAttribute('data-cl-ranked'); node.remove(); } badgeHosts.clear(); }
  function syncBadges() {
    clearBadges();
    const metric = sort.value.split(':')[0];
    if (!model || (!tagMode && metric === 'order')) return;
    const ranked = core.selectPosts(model.posts, tags, { metric, direction: directionControl.value, format: format.value, structure: structure.value, search: search.value });
    for (const [index, post] of ranked.entries()) {
      const badge = document.createElement('span'); badge.dataset.clTag = '';
      badge.style.cssText = 'position:absolute;left:6px;top:6px;z-index:40;pointer-events:none;';
      const root = badge.attachShadow({ mode: 'open' });
      const style = el('style'); style.textContent = 'span,button{font:600 11px system-ui;color:#fff;background:#202020e8;border:1px solid #ffffff70;border-radius:6px;padding:5px 8px;font:600 11px/1.3 system-ui}button{cursor:pointer;pointer-events:auto;margin-left:4px}button:focus-visible{outline:2px solid #bcb3ff;outline-offset:2px}';
      root.append(style);
      if (metric !== 'order') {
        const value = post[metric];
        const formatted = value == null ? 'Unavailable' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
        const rank = el('span', (value == null ? '—' : index + 1) + ' · ' + formatted + ' ' + metric);
        rank.title = value == null ? 'No ' + metric + ' count exposed' : value.toLocaleString('en') + ' ' + metric + ' (page count; may be rounded)'; root.append(rank);
      }
      if (tagMode) {
      const edit = button('Tag', event => {
        event.preventDefault(); event.stopPropagation(); editPost = post;
        const saved = tags['tag:' + post.url] || {};
        presentation.value = saved.format || ''; narrative.value = saved.structure || ''; notes.value = saved.notes || '';
        editor.hidden = false; host.scrollIntoView({ block: 'start', behavior: 'smooth' }); presentation.focus({ preventScroll: true });
      });
      root.append(edit); } post.anchor.setAttribute('data-cl-ranked', ''); post.anchor.append(badge); badgeHosts.add(badge);
    }
  }
  async function loadMore() {
    if (loading || !model) return;
    loading = true; more.disabled = true; more.textContent = 'Loading…';
    const start = model.posts.length, initialRoute = route;
    model.container.scrollIntoView({ block: 'end', behavior: 'smooth' });
    await new Promise(resolve => setTimeout(resolve, 2200));
    if (route === initialRoute) {
      scan(); host.scrollIntoView({ block: 'start', behavior: 'smooth' });
      if (model && model.posts.length <= start) showNote('No additional posts loaded. The page may be at its end; scroll manually if Instagram is still loading.');
    }
    loading = false; more.disabled = false; more.textContent = 'Load more posts ↓';
  }
  const observer = new MutationObserver(records => {
    if (records.some(record => !host.contains(record.target) && !record.target.parentElement?.closest?.('[data-cl-tag]') &&
      (record.type === 'characterData' || [...record.addedNodes, ...record.removedNodes].some(node => node !== host && !(node.nodeType === 1 && node.hasAttribute('data-cl-tag')))))) schedule();
  });
  observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  window.addEventListener('resize', schedule);
  setInterval(() => { if (route !== location.pathname || !host.isConnected) schedule(); }, 1000);
  api.storage.local.get(null).then(data => { tags = data; scan(); }).catch(() => scan());
  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const [key, change] of Object.entries(changes)) if (key.startsWith('tag:')) { if (change.newValue) tags[key] = change.newValue; else delete tags[key]; }
    scan();
  });
  scan();
})();

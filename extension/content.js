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
  let model = null, tags = {}, route = adapters.contextKey(document, location.href), timer = null, tagMode = false, editPost = null;
  const routePreferences = new Map();
  let metricWriteTimer = null, pendingMetrics = {}, storageReady = false;
  const cacheNote = el('div', '', 'note'); cacheNote.hidden = true;
  const badgeHosts = new Set();
  let indexing = null;
  const indexPositions = new Map();
  const shell = el('section', '', 'shell'); shell.setAttribute('aria-label', 'Content Lens');
  const bar = el('div', '', 'bar');
  const brand = el('span', '', 'brand'); brand.append(el('span', '↕', 'mark'), el('span', 'Content Lens'));
  const sort = select([['order', 'Original'], ['views:desc', 'Views'], ['likes:desc', 'Likes'], ['comments:desc', 'Comments']], 'Sort posts on this page'); sort.hidden = true;
  const sortGroup = el('div', '', 'segments'); sortGroup.setAttribute('role', 'group'); sortGroup.setAttribute('aria-label', 'Sort native posts');
  const metricButtons = new Map();
  for (const option of sort.options) {
    const control = button(option.textContent, () => { if (control.getAttribute('aria-disabled') === 'true') {
      metricsPanel.hidden = false; coverage.setAttribute('aria-expanded', 'true');
      showNote(option.textContent + ' counts are not available for these loaded posts. Use caption, post-type, or tag filters.'); return;
    } sort.value = option.value; scan(); });
    control.dataset.metric = option.value.split(':')[0]; control.setAttribute('aria-pressed', String(option.value === 'order'));
    metricButtons.set(option.value, control); sortGroup.append(control);
  }
  const directionControl = select([['desc', 'High → low'], ['asc', 'Low → high']], 'Sort direction'); directionControl.className = 'direction';
  const tagsButton = button('Filters', () => { filters.hidden = !filters.hidden; tagsButton.setAttribute('aria-expanded', String(!filters.hidden)); });
  tagsButton.setAttribute('aria-expanded', 'false'); tagsButton.setAttribute('aria-controls', 'filters');
  const reset = button('Reset', () => { sort.value = 'order'; directionControl.value = 'desc'; format.value = ''; structure.value = ''; postType.value = ''; search.value = ''; hintMode.value = ''; tagMode = false; editPost = null; editor.hidden = true; tagButton.textContent = 'Tag posts'; scan(); }); reset.className = 'quiet';
  const count = el('span', '', 'count'); count.setAttribute('role', 'status');
  const coverage = button('', () => { metricsPanel.hidden = !metricsPanel.hidden; coverage.setAttribute('aria-expanded', String(!metricsPanel.hidden)); }); coverage.className = 'text-button'; coverage.setAttribute('aria-expanded', 'false'); coverage.setAttribute('aria-controls', 'metrics');
  const coverageText = el('span', 'Metric availability');
  const infoIcon = el('span', 'i', 'info-icon'); infoIcon.setAttribute('aria-hidden', 'true'); coverage.append(coverageText, infoIcon);
  bar.append(brand, sort, sortGroup, directionControl, tagsButton, reset);
  const statusRow = el('div', '', 'status-row'); const library = el('a', 'Browse collection ↗', 'library-link'); library.target = '_blank'; library.rel = 'noopener';
  const indexButton = button('Index collection', startIndexing); indexButton.className = 'text-button';
  library.addEventListener('click', event => { event.preventDefault(); openExtensionPage('open-library'); });
  statusRow.append(count, coverage, indexButton, library);
  const indexProgress = el('div', '', 'index-progress'); indexProgress.hidden = true;
  const progressText = el('span');
  indexProgress.append(progressText, button('Stop indexing', () => finishIndexing('Indexing stopped.')));
  shadow.append(indexProgress);
  const metricsPanel = el('div', '', 'panel metrics'); metricsPanel.id = 'metrics'; metricsPanel.hidden = true;
  const metricRows = el('div', '', 'metric-rows');
  metricsPanel.append(el('strong', 'What can I sort?'), metricRows, el('p', 'Counts come from this page or were read while browsing within the last 24 hours. Remembered counts are marked ≈ and may have changed. Saved collections often omit metrics; visiting a creator’s Reels grid can make those counts available here.'), el('p', 'Followers gained, saves, shares, reach, and watch time are not connected in this version. Creator insights support is a separate integration.'));
  const note = el('div', '', 'note'); note.hidden = true; note.setAttribute('role', 'status');
  const filters = el('div', '', 'panel filters'); filters.id = 'filters'; filters.hidden = true;
  const filterHeading = el('div', '', 'panel-heading'); filterHeading.append(el('strong', 'Filter posts'), el('span', 'Manual tags · caption suggestions are optional', 'muted'));
  const fields = el('div', '', 'fields');
  const format = select([['', 'All presentations'], ...core.formats.map(x => [x, x])], 'Filter presentation tags');
  const structure = select([['', 'All structures'], ...core.structures.map(x => [x, x])], 'Filter structure tags');
  const postType = select([['', 'All post types'], ['video', 'Videos / Reels'], ['carousel', 'Carousels / photo sets'], ['photo', 'Photos']], 'Filter post type');
  const search = el('input'); search.type = 'search'; search.placeholder = 'Search captions or your notes'; search.setAttribute('aria-label', 'Search notes and available captions');
  const tagButton = button('Tag posts', () => {
    tagMode = !tagMode;
    if (tagMode) { format.value = ''; structure.value = ''; search.value = ''; }
    tagButton.textContent = tagMode ? 'Done tagging' : 'Tag posts'; tagButton.setAttribute('aria-pressed', String(tagMode)); scan();
  });
  const backup = el('a', 'Back up tags ↗'); backup.href = api.runtime.getURL('options.html'); backup.target = '_blank'; backup.rel = 'noopener';
  backup.addEventListener('click', event => { event.preventDefault(); openExtensionPage('open-options'); });
  fields.append(label('Post type', postType), label('Presentation tags', format), label('Structure tags', structure), label('Search notes or captions', search));
  const filterActions = el('div', '', 'panel-actions');
  const clearFilters = button('Clear filters', () => { format.value = ''; structure.value = ''; postType.value = ''; search.value = ''; scan(); }); clearFilters.className = 'quiet';
  const hintMode = select([['', 'Manual tags only'], ['yes', 'Include caption suggestions']], 'Category matching');
  const categoryField = label('Category matching', hintMode); categoryField.className = 'category-field';
  const actionButtons = el('div', '', 'filter-buttons'); actionButtons.append(tagButton, clearFilters, backup);
  filterActions.append(categoryField, actionButtons); filters.append(filterHeading, fields, filterActions);
  const resultHelp = el('p', '', 'result-help'); resultHelp.hidden = true;
  const emptyHost = el('div'); emptyHost.dataset.clEmpty = '';
  const emptyRoot = emptyHost.attachShadow({ mode: 'open' });
  const emptyStyle = el('style'); emptyStyle.textContent = globalThis.ContentLensStyles;
  const emptyBox = el('section', '', 'empty-results'); emptyBox.setAttribute('role', 'status');
  const emptyTitle = el('strong'), emptyText = el('p'), emptyActions = el('div', '', 'empty-actions');
  const useHints = button('Try caption suggestions', () => { hintMode.value = 'yes'; scan(); });
  const clearCategories = button('Clear category filters', () => { format.value = ''; structure.value = ''; scan(); });
  const tagEmpty = button('Tag loaded posts', () => { format.value = ''; structure.value = ''; search.value = ''; tagMode = true; tagButton.textContent = 'Done tagging'; scan(); });
  emptyActions.append(clearCategories, useHints, tagEmpty, button('Clear all filters', () => clearFilters.click()), button('Browse indexed posts ↗', () => openExtensionPage('open-library')));
  emptyBox.append(emptyTitle, emptyText, emptyActions); emptyRoot.append(emptyStyle, emptyBox);
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
  shell.append(bar, statusRow, note, cacheNote, metricsPanel, filters, editor, resultHelp); shadow.append(shell);
  shadow.addEventListener('keydown', event => { if (event.key === 'Escape') { editor.hidden = true; filters.hidden = true; metricsPanel.hidden = true; tagsButton.setAttribute('aria-expanded', 'false'); coverage.setAttribute('aria-expanded', 'false'); tagMode = false; tagButton.textContent = 'Tag posts'; syncBadges(); tagsButton.focus(); } });
  for (const control of [sort, directionControl, format, structure, postType, hintMode]) control.addEventListener('change', scan);
  search.addEventListener('input', schedule);
  async function openExtensionPage(type) {
    try { const result = await api.runtime.sendMessage({ type, scope: route }); if (!result?.ok) throw new Error(); }
    catch { showNote('Could not open the library. Reload this page after updating Content Lens, or open it from the extension popup.'); }
  }
  function showNote(text) { note.textContent = text; note.hidden = !text; }
  function scan() {
    clearTimeout(timer); timer = null;
    try { library.href = api.runtime.getURL('library.html') + '#' + encodeURIComponent(adapters.contextKey(document, location.href)); }
    catch {
      grid.reset(); clearBadges(); observer.disconnect(); clearInterval(routeTimer); clearTimeout(metricWriteTimer);
      if (indexing) { clearTimeout(indexing.timer); indexing = null; indexProgress.hidden = true; }
      showNote('Content Lens was updated. Refresh this Instagram or TikTok page to reconnect the controls.');
      return;
    }
    if (route !== adapters.contextKey(document, location.href)) {
      if (indexing) finishIndexing('Indexing stopped because the page changed.', false);
      routePreferences.set(route, { sort: sort.value, direction: directionControl.value, format: format.value, structure: structure.value, type: postType.value, search: search.value, hints: hintMode.value === 'yes' });
      route = adapters.contextKey(document, location.href);
      const previous = routePreferences.get(route);
      sort.value = previous?.sort || 'order'; directionControl.value = previous?.direction || 'desc'; format.value = previous?.format || ''; structure.value = previous?.structure || ''; postType.value = previous?.type || ''; search.value = previous?.search || ''; hintMode.value = previous?.hints ? 'yes' : ''; tagMode = false;
      editor.hidden = true; editPost = null; host.remove();
    }
    grid.reset();
    const currentPosts = adapters.readTiles(document, location.href);
    rememberMetrics([...adapters.readEmbeddedMetrics(document, location.href), ...currentPosts]);
    rememberPosts(currentPosts);
    indexButton.hidden = !core.scopeFor(location.href);
    indexButton.disabled = !!indexing;
    const posts = currentPosts.map(post => core.withRememberedMetrics(post, tags));
    model = grids.discover(posts);
    if (!model) { host.remove(); clearBadges(); return; }
    if (host.nextSibling !== model.container) model.container.before(host);
    const available = Object.fromEntries(['views', 'likes', 'comments'].map(key => [key, posts.filter(post => post[key] != null).length]));
    if (sort.value !== 'order' && !available[sort.value.split(':')[0]]) sort.value = 'order';
    const metric = sort.value.split(':')[0], direction = directionControl.value;
    for (const [value, control] of metricButtons) {
      control.setAttribute('aria-pressed', String(sort.value === value));
      const key = value.split(':')[0];
      control.setAttribute('aria-disabled', String(key !== 'order' && !available[key]));
      control.title = key === 'order' ? 'Restore the profile’s original order, including pinned posts' : available[key] + ' of ' + posts.length + ' loaded posts have ' + key + ' counts';
    }
    directionControl.disabled = metric === 'order' || !available[metric];
    metricRows.replaceChildren(...Object.entries(available).map(([key, total]) => { const row = el('div', '', 'metric-row'); row.append(el('span', key[0].toUpperCase() + key.slice(1)), el('span', total ? total + ' of ' + posts.length + ' posts' : 'Not exposed on this page')); return row; }));
    const selected = core.selectPosts(model.posts, tags, { metric, direction, format: format.value, structure: structure.value, type: postType.value, search: search.value, hints: hintMode.value === 'yes' });
    const active = metric !== 'order' || format.value || structure.value || postType.value || search.value.trim();
    const filtering = !!(format.value || structure.value || postType.value || search.value.trim());
    const categoryActive = !!(format.value || structure.value);
    const categoryMatches = core.selectPosts(model.posts, tags, { format: format.value, structure: structure.value, hints: hintMode.value === 'yes' }).length;
    const captions = posts.filter(post => post.caption?.trim()).length;
    emptyTitle.textContent = categoryActive && !categoryMatches ? (hintMode.value ? 'No matching category tags or caption clues' : 'No posts match these manual tags yet') : 'No posts match these filters';
    emptyText.textContent = categoryActive && !categoryMatches
      ? 'Presentation and structure use saved labels' + (hintMode.value ? ' or caption clues' : '') + ', not automatic video analysis. Scrolling cannot classify untagged videos. Tag posts or clear the category filters to search captions.'
      : 'Search, post type, and category filters apply together. ' + captions + ' of ' + posts.length + ' loaded posts have caption text. Try a shorter phrase or remove a filter. Previously indexed posts are available in Browse collection.';
    clearCategories.hidden = !categoryActive; tagEmpty.hidden = !categoryActive;
    useHints.hidden = !categoryActive || !!hintMode.value || !core.selectPosts(model.posts, tags, { format: format.value, structure: structure.value, type: postType.value, search: search.value, hints: true }).length;
    for (const [control, key, title] of [[format, 'format', 'All presentations'], [structure, 'structure', 'All structures']]) {
      for (const option of control.options) {
        const matches = option.value ? core.selectPosts(model.posts, tags, { [key]: option.value, hints: hintMode.value === 'yes' }).length : posts.length;
        option.textContent = option.value ? option.value + ' · ' + matches + (hintMode.value ? ' matches' : ' tagged') : title;
      }
    }
    if (active && !indexing) grid.apply(model, selected, { filtering, empty: emptyHost, filterKey: JSON.stringify([metric, direction, format.value, structure.value, postType.value, search.value, hintMode.value]) });
    resultHelp.hidden = !filtering || !!indexing || !selected.length;
    resultHelp.textContent = 'Filtered results scroll in the area below. These are loaded posts only. Browse collection searches your index; Index collection can discover older posts.';
    const known = posts.filter(post => post[metric] != null).length;
    count.textContent = selected.length === posts.length ? `${posts.length} posts loaded` : `${selected.length} / ${posts.length} shown`;
    const numFilters = Number(!!format.value) + Number(!!structure.value) + Number(!!postType.value) + Number(!!search.value.trim());
    reset.hidden = !active && !tagMode; clearFilters.hidden = !numFilters;
    tagsButton.textContent = numFilters ? 'Filters · ' + numFilters : 'Filters';
    coverageText.textContent = metric === 'order' ? 'Metric availability' : known + '/' + posts.length + ' with ' + metric;
    if (!selected.length) showNote('No matching loaded posts. See the explanation and filter controls below.');
    else if (metric !== 'order' && !known) showNote('No ' + metric + ' counts are exposed on these tiles yet. Try hovering over posts or choose another metric. Original order is preserved.');
    else if (metric !== 'order' && known < posts.length) showNote((posts.length - known) + (posts.length - known === 1 ? ' post has' : ' posts have') + ' unavailable ' + metric + ' counts and ' + (posts.length - known === 1 ? 'appears' : 'appear') + ' last. Scroll to include older posts.');
    else if (hintMode.value && (format.value || structure.value)) showNote('Includes caption suggestions, not video analysis. Manual tags take priority; unclassified posts stay out of category results.');
    else if (metric !== 'order') showNote('');
    else if (!available.views && !available.likes && !available.comments) showNote('This collection does not expose counts. Filter by post type, captions, or your tags. Counts read on other pages can be reused here for 24 hours.');
    else showNote('');
    const remembered = metric === 'order' ? 0 : posts.filter(post => post.remembered.includes(metric)).length;
    cacheNote.textContent = remembered ? remembered + ' counts remembered from browsing within 24 hours (≈); they may have changed.' : '';
    cacheNote.hidden = !remembered;
    tagButton.setAttribute('aria-pressed', String(tagMode));
    if (!indexing) syncBadges();
  }
  function startIndexing() {
    if (indexing || !model) return;
    indexing = { route, x: window.scrollX, y: window.scrollY, started: Date.now(), idle: 0, count: 0, steps: 0, lastY: -1, timer: null };
    indexProgress.hidden = false; clearBadges(); grid.reset();
    progressText.textContent = 'Indexing this collection… You can stop at any time.';
    scan();
    if (indexPositions.has(route)) window.scrollTo({ top: indexPositions.get(route), behavior: 'instant' });
    indexStep();
  }
  function indexStep() {
    const job = indexing;
    if (!job) return;
    if (adapters.contextKey(document, location.href) !== job.route) { finishIndexing('Page changed.', false); return; }
    scan();
    const total = Object.values(tags).filter(value => value?.scope === job.route && value?.url).length;
    job.idle = total > job.count || Math.abs(window.scrollY - job.lastY) > 2 ? 0 : job.idle + 1; job.lastY = window.scrollY; job.count = total; job.steps++;
    progressText.textContent = total + ' posts indexed · scanning loaded pages…';
    if (Date.now() - job.started > 120000 || job.steps >= 100) { finishIndexing('Indexing paused after two minutes. You can run another pass for older posts.'); return; }
    if (job.idle >= 8) { indexPositions.delete(job.route); job.finished = true; finishIndexing('No more posts appeared. Indexed posts are ready to browse; the platform may have more.'); return; }
    window.scrollBy({ top: Math.max(400, window.innerHeight * 0.85), behavior: 'instant' });
    job.timer = setTimeout(indexStep, 1200);
  }
  function finishIndexing(message, restore = true) {
    const job = indexing; if (!job) return;
    clearTimeout(job.timer);
    if (!job.finished && restore) indexPositions.set(job.route, window.scrollY);
    indexing = null; indexProgress.hidden = true; indexButton.disabled = false;
    if (restore) { scan(); window.scrollTo({ left: job.x, top: job.y, behavior: 'instant' }); showNote(message + ' Open Browse collection to search them.'); }
  }
  function rememberPosts(posts) {
    if (!storageReady || !posts.length || !core.scopeFor(location.href)) return;
    const name = document.querySelector('main h1, main h2, main h3')?.textContent?.trim() || document.title.replace(/ • Instagram$/, '');
    const existing = Object.values(tags).filter(value => value?.scope === route && value?.url);
    let next = existing.reduce((max, value) => Math.max(max, value.order + 1), 0);
    for (const post of posts) {
      const key = core.libraryKey(route, post.url), previous = tags[key];
      const record = core.libraryRecord({ ...post, order: previous?.order ?? next++ }, route, name, previous);
      if (JSON.stringify(previous) === JSON.stringify(record)) continue;
      tags[key] = record; pendingMetrics[key] = record;
    }
    flushRecords();
  }
  function flushRecords() {
    if (Object.keys(pendingMetrics).length && !metricWriteTimer) metricWriteTimer = setTimeout(async () => {
      metricWriteTimer = null; const changes = pendingMetrics; pendingMetrics = {};
      try { await api.storage.local.set(changes); }
      catch { showNote('Local storage is full or unavailable. Some posts could not be indexed. Back up your tags in extension settings.'); }
    }, 750);
  }
  function rememberMetrics(posts) {
    if (!storageReady) return;
    const now = Date.now();
    for (const post of posts) for (const metric of ['views', 'likes', 'comments']) {
      const value = post[metric], key = core.metricKey(post.url, metric);
      if (!key || !Number.isSafeInteger(value) || value < 0) continue;
      const previous = tags[key];
      if (previous?.value === value && now - previous.seenAt < 900000) continue;
      tags[key] = { value, seenAt: now }; pendingMetrics[key] = tags[key];
    }
    flushRecords();
  }
  function schedule() { if (!timer) timer = setTimeout(scan, 350); }
  function clearBadges() { for (const node of badgeHosts) { node.parentElement?.removeAttribute('data-cl-ranked'); node.remove(); } badgeHosts.clear(); }
  function syncBadges() {
    clearBadges();
    const metric = sort.value.split(':')[0];
    if (!model || (!tagMode && metric === 'order')) return;
    const ranked = core.selectPosts(model.posts, tags, { metric, direction: directionControl.value, format: format.value, structure: structure.value, type: postType.value, search: search.value, hints: hintMode.value === 'yes' });
    for (const [index, post] of ranked.entries()) {
      const badge = document.createElement('span'); badge.dataset.clTag = '';
      badge.style.cssText = 'position:absolute;left:6px;top:6px;z-index:40;pointer-events:none;';
      const root = badge.attachShadow({ mode: 'open' });
      const style = el('style'); style.textContent = 'span,button{font:600 11px system-ui;color:#fff;background:#202020e8;border:1px solid #ffffff70;border-radius:6px;padding:5px 8px;font:600 11px/1.3 system-ui}button{cursor:pointer;pointer-events:auto;margin-left:4px}button:focus-visible{outline:2px solid #bcb3ff;outline-offset:2px}';
      root.append(style);
      if (metric !== 'order' && post[metric] != null) {
        const value = post[metric];
        const formatted = value == null ? 'Unavailable' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
        const rank = el('span', (post.remembered?.includes(metric) ? '≈ ' : '') + (value == null ? '—' : index + 1) + ' · ' + formatted + ' ' + metric);
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
  const observer = new MutationObserver(records => {
    if (records.some(record => !host.contains(record.target) && !record.target.parentElement?.closest?.('[data-cl-tag]') &&
      (record.type === 'characterData' || [...record.addedNodes, ...record.removedNodes].some(node => node !== host && !(node.nodeType === 1 && (node.hasAttribute('data-cl-tag') || node.hasAttribute('data-cl-empty'))))))) schedule();
  });
  observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule();
  });
  const routeTimer = setInterval(() => { if (route !== adapters.contextKey(document, location.href) || !host.isConnected) schedule(); }, 1000);
  api.storage.local.get(null).then(data => {
    const expired = Object.keys(data).filter(key => key.startsWith('metric:') && (!data[key]?.seenAt || Date.now() - data[key].seenAt >= 86400000));
    for (const key of expired) delete data[key];
    if (expired.length) api.storage.local.remove(expired).catch(() => {});
    tags = data; storageReady = true; scan();
  }).catch(() => scan());
  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const [key, change] of Object.entries(changes)) if (key.startsWith('tag:') || key.startsWith('metric:')) { if (change.newValue) tags[key] = change.newValue; else delete tags[key]; }
    scan();
  });
  scan();
})();

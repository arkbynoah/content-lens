(function (root) {
  'use strict';
  const css = `
    [data-cl-ranked] { position:relative!important; }
[data-cl-grid] { display:grid !important; grid-template-columns:repeat(var(--cl-columns,3),minmax(0,1fr)) !important; gap:3px !important; align-items:start !important; align-content:start !important; min-height:var(--cl-min-height,0px) !important; }
    [data-cl-row] { display:contents !important; }
    [data-cl-cell] { order:var(--cl-order,0) !important; width:auto !important; min-width:0 !important; max-width:none !important; margin:0 !important; flex:none !important; }
    [data-cl-hidden] { display:none !important; }
    [data-cl-grid] > :not([data-cl-row]):not([data-cl-cell]) { grid-column:1 / -1; order:999999 !important; }
  `;
  function discover(posts) {
    if (posts.length < 2) return null;
    let container = posts[0].anchor.parentElement;
    while (container && !posts.every(post => container.contains(post.anchor))) container = container.parentElement;
    if (!container || ['BODY', 'HTML', 'MAIN'].includes(container.tagName)) return null;
    const branches = new Map();
    for (const post of posts) {
      let branch = post.anchor;
      while (branch.parentElement !== container) branch = branch.parentElement;
      if (!branches.has(branch)) branches.set(branch, []);
      branches.get(branch).push(post);
    }
    const rows = [], entries = [];
    let columns = 1;
    const rowBased = [...branches.values()].some(group => group.length > 1);
    for (const [branch, members] of branches) {
      if (!rowBased) { entries.push({ ...members[0], cell: branch }); continue; }
      rows.push(branch);
      const cells = new Set();
      for (const post of members) {
        let cell = post.anchor;
        while (cell.parentElement !== branch) cell = cell.parentElement;
        if (cells.has(cell)) return null;
        cells.add(cell); entries.push({ ...post, cell });
      }
      columns = Math.max(columns, members.length);
    }
    if (!rows.length) {
      const firstTop = Math.round(entries[0].cell.getBoundingClientRect().top);
      columns = entries.filter(post => Math.abs(post.cell.getBoundingClientRect().top - firstTop) < 4).length || 3;
    }
    if (columns > 8) return null;
    return { container, rows, posts: entries, columns };
  }
  class NativeGrid {
    constructor(document) {
      this.marked = new Set();
      this.style = document.createElement('style'); this.style.textContent = css;
      this.style.id = 'content-lens-grid-style'; document.head.append(this.style);
    }
    mark(node, name) { node.setAttribute(name, ''); this.marked.add(node); }
    apply(model, ordered) {
      const height = model.container.getBoundingClientRect().height;
      this.reset(); this.mark(model.container, 'data-cl-grid');
      model.container.style.setProperty('--cl-columns', model.columns);
      // Keep the native loading sentinel below its original position when filtering.
      if (ordered.length < model.posts.length) model.container.style.setProperty('--cl-min-height', height + 'px');
      for (const row of model.rows) this.mark(row, 'data-cl-row');
      const ranks = new Map(ordered.map((post, index) => [post.url, index]));
      for (const post of model.posts) {
        this.mark(post.cell, 'data-cl-cell');
        if (!ranks.has(post.url)) this.mark(post.cell, 'data-cl-hidden');
        post.cell.style.setProperty('--cl-order', ranks.get(post.url) ?? 999999);
      }
    }
    reset() {
      for (const node of this.marked) {
        for (const attr of ['data-cl-grid', 'data-cl-row', 'data-cl-cell', 'data-cl-hidden']) node.removeAttribute(attr);
        node.style.removeProperty('--cl-min-height'); node.style.removeProperty('--cl-columns'); node.style.removeProperty('--cl-order');
      }
      this.marked.clear();
    }
    destroy() { this.reset(); this.style.remove(); }
  }
  const api = { discover, NativeGrid };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ContentLensGrid = api;
})(globalThis);

(function (root) {
  'use strict';
  const css = `
    [data-cl-ranked] { position:relative!important; }
[data-cl-grid] { display:grid !important; grid-template-columns:repeat(var(--cl-columns,3),minmax(0,1fr)) !important; gap:3px !important; align-items:start !important; align-content:start !important; }
    [data-cl-filtered] { height:var(--cl-result-height,70vh)!important; min-height:0!important; max-height:100vh!important; overflow-y:auto!important; overscroll-behavior-y:contain; overflow-anchor:none; scrollbar-gutter:stable; }
    [data-cl-empty] { grid-column:1 / -1!important; order:-1!important; align-self:stretch; }
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
      this.resultSizes = new WeakMap(); this.scrollStates = new WeakMap(); this.empty = null;
      this.style = document.createElement('style'); this.style.textContent = css;
      this.style.id = 'content-lens-grid-style'; document.head.append(this.style);
    }
    mark(node, name) { node.setAttribute(name, ''); this.marked.add(node); }
    apply(model, ordered, { filtering = ordered.length < model.posts.length, empty = null, filterKey = '' } = {}) {
      this.reset(); this.mark(model.container, 'data-cl-grid');
      model.container.style.setProperty('--cl-columns', model.columns);
      // A stable, viewport-sized result pane avoids both unbounded blank space and
      // repeatedly moving the site's loading boundary as matches arrive/disappear.
      if (filtering) {
        let height = this.resultSizes.get(model.container);
        if (!height) {
          const viewport = model.container.ownerDocument.defaultView.innerHeight;
          const top = Math.max(0, model.container.getBoundingClientRect().top);
          height = Math.max(320, Math.min(viewport, viewport - top + 160));
          this.resultSizes.set(model.container, height);
        }
        this.mark(model.container, 'data-cl-filtered');
        model.container.style.setProperty('--cl-result-height', height + 'px');
        if (!ordered.length && empty) {
          empty.style.height = Math.min(height, model.container.ownerDocument.defaultView.innerHeight) + 'px';
          this.empty = empty; model.container.append(empty);
        }
      } else this.resultSizes.delete(model.container);
      for (const row of model.rows) this.mark(row, 'data-cl-row');
      const ranks = new Map(ordered.map((post, index) => [post.url, index]));
      for (const post of model.posts) {
        this.mark(post.cell, 'data-cl-cell');
        if (!ranks.has(post.url)) this.mark(post.cell, 'data-cl-hidden');
        post.cell.style.setProperty('--cl-order', ranks.get(post.url) ?? 999999);
      }
      if (filtering) {
        const previous = this.scrollStates.get(model.container);
        model.container.scrollTop = previous?.key === filterKey ? previous.top : 0;
        this.scrollStates.set(model.container, { key: filterKey, top: model.container.scrollTop });
      }
    }
    reset() {
      this.empty?.remove(); this.empty = null;
      for (const node of this.marked) {
        if (node.hasAttribute('data-cl-filtered')) {
          const previous = this.scrollStates.get(node);
          if (previous) previous.top = node.scrollTop;
        }
        for (const attr of ['data-cl-grid', 'data-cl-row', 'data-cl-cell', 'data-cl-hidden', 'data-cl-filtered']) node.removeAttribute(attr);
        node.style.removeProperty('--cl-result-height'); node.style.removeProperty('--cl-min-height'); node.style.removeProperty('--cl-columns'); node.style.removeProperty('--cl-order');
      }
      this.marked.clear();
    }
    destroy() { this.reset(); this.style.remove(); }
  }
  const api = { discover, NativeGrid };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ContentLensGrid = api;
})(globalThis);

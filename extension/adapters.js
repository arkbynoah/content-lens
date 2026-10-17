(function (root) {
  'use strict';
  const core = typeof module !== 'undefined' && module.exports ? require('./core.js') : root.ContentLensCore;
  function metricCount(tile, metric) {
    const words = { views: /^(?:views?|plays?|view count)(?: icon)?$/i, likes: /^(?:likes?|like count)(?: icon)?$/i, comments: /^(?:comments?|comment count)(?: icon)?$/i }[metric];
    const explicit = tile.querySelector(`[data-e2e="${metric === 'views' ? 'video-views' : metric === 'likes' ? 'like-count' : 'comment-count'}"]`);
    if (explicit) { const value = core.parseCount(explicit.textContent); if (value != null) return value; }
    // Instagram's current hover overlay uses unlabeled CSS sprite icons.
    // Match the observed icon pair, never assume any two numbers are likes/comments.
    if (metric === 'likes' || metric === 'comments') {
      for (const list of tile.querySelectorAll('ul')) {
        if (list.closest('[data-sf-action], [data-eden-pill]')) continue;
        const items = [...list.children];
        if (items.length !== 2 || items.some(item => item.tagName !== 'LI')) continue;
        if (!items[0].querySelector('span.xlsotpv') || !items[1].querySelector('span.x100pdo0')) continue;
        const value = core.parseCount(items[metric === 'likes' ? 0 : 1].textContent);
        if (value != null) return value;
      }
    }
    for (const icon of tile.querySelectorAll('[aria-label], svg title')) {
      const label = icon.getAttribute('aria-label') || icon.textContent;
      const full = label.match(/^([\d,.]+\s*[KMB]?)\s+(views?|plays?|likes?|comments?)$/i);
      if (full && words.test(full[2])) { const value = core.parseCount(full[1]); if (value != null) return value; }
      if (!words.test(label)) continue;
      // The live Instagram tile has an SVG title and a count in a sibling wrapper.
      let region = icon.parentElement;
      for (let depth = 0; region && tile.contains(region) && depth < 4; depth++, region = region.parentElement) {
        const counts = [...region.querySelectorAll('span, div')].filter(node => !node.children.length && !node.closest('svg, button, [data-sf-action], [data-eden-pill]'))
          .map(node => core.parseCount(node.textContent)).filter(value => value != null);
        if (counts.length === 1) return counts[0];
      }
    }
    return null;
  }
  function readTiles(document, rawUrl) {
    const scope = core.scopeFor(rawUrl);
    if (!scope) return [];
    const result = new Map();
    for (const anchor of (document.querySelector('main') || document).querySelectorAll('a[href]')) {
      if (anchor.closest('[role="dialog"], #content-lens-root, nav, header')) continue;
      const url = core.canonicalPost(anchor.getAttribute('href'), rawUrl);
      if (!url || (scope.platform === 'Instagram') !== url.includes('www.instagram.com')) continue;
      const tile = scope.platform === 'TikTok' ? anchor.closest('[data-e2e="user-post-item"]') || anchor : anchor;
      const views = metricCount(tile, 'views');
      const media = [...tile.querySelectorAll('img,video,[style]')].find(node =>
        node.tagName === 'VIDEO' || (node.tagName === 'IMG' && !/^(?:chrome|moz)-extension:/.test(node.getAttribute('src') || '')) || /background-image\s*:/.test(node.getAttribute('style') || ''));
      if (!media && views == null) continue;
      if (!anchor.getClientRects().length && !anchor.closest('[data-cl-hidden]')) continue;
      result.set(url, { url, anchor, tile, views, likes: metricCount(tile, 'likes'), comments: metricCount(tile, 'comments'),
        caption: (media?.getAttribute('alt') || anchor.getAttribute('title') || '').slice(0, 1500), order: result.size });
    }
    return [...result.values()];
  }
  const api = { readTiles, metricCount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ContentLensAdapters = api;
})(globalThis);

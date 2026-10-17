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
  function contextKey(document, rawUrl) {
    const scope = core.scopeFor(rawUrl);
    if (!scope) return new URL(rawUrl).pathname;
    const tab = scope.platform === 'TikTok' ? [...document.querySelectorAll('[role="tab"][aria-selected="true"]')]
      .find(node => /^(Videos|Favorites|Liked|Reposts)$/i.test(node.textContent.trim()))?.textContent.trim() || '' : '';
    return scope.key + '|' + tab;
  }
  function postType(tile, url) {
    const labels = [...tile.querySelectorAll('[aria-label],svg title')].map(n => n.getAttribute('aria-label') || n.textContent).join(' ');
    if (/carousel/i.test(labels)) return 'carousel';
    if (/\/(?:reel|video)\//.test(url) || /\bclip\b/i.test(labels)) return 'video';
    if (/\/photo\//.test(url)) return 'carousel';
    return 'photo';
  }
  function readTiles(document, rawUrl) {
    const scope = core.scopeFor(rawUrl);
    if (!scope) return [];
    const result = new Map();
    const ttCards = '[data-e2e="favorites-item"], [data-e2e="user-post-item"], [data-e2e="user-liked-item"]';
    const root = document.querySelector('main') || document;
    const anchors = scope.platform === 'TikTok' ? [...document.querySelectorAll(ttCards)].flatMap(card => [...card.querySelectorAll('a[href]')]) : root.querySelectorAll('a[href]');
    for (const anchor of anchors) {
      if (anchor.closest('[role="dialog"], #content-lens-root, nav, header, [aria-hidden="true"], [hidden]')) continue;
      const url = core.canonicalPost(anchor.getAttribute('href'), rawUrl);
      if (!url || (scope.platform === 'Instagram') !== url.includes('www.instagram.com')) continue;
      const tile = scope.platform === 'TikTok' ? anchor.closest(ttCards) || anchor : anchor;
      const views = metricCount(tile, 'views');
      const media = [...tile.querySelectorAll('img,video,[style]')].find(node =>
        node.tagName === 'VIDEO' || (node.tagName === 'IMG' && !/^(?:chrome|moz)-extension:/.test(node.getAttribute('src') || '')) || /background-image\s*:/.test(node.getAttribute('style') || ''));
      if (!media && views == null) continue;
      if (!anchor.getClientRects().length && !anchor.closest('[data-cl-hidden]')) continue;
      result.set(url, { url, anchor, tile, views, likes: metricCount(tile, 'likes'), comments: metricCount(tile, 'comments'),
        thumbnail: media?.currentSrc || media?.getAttribute('src') || media?.getAttribute('poster') || (media?.style.backgroundImage || '').match(/^url\(["']?(https:[^"')]+)["']?\)$/)?.[1] || '',
        creator: new URL(anchor.href, rawUrl).pathname.split('/').filter(Boolean)[0].replace(/^@/, '').replace(/^(?:p|reel)$/, ''),
        type: postType(tile, url), caption: (media?.getAttribute('alt') || tile.querySelector('img[alt]')?.getAttribute('alt') || anchor.getAttribute('title') || anchor.getAttribute('aria-label') || '').slice(0, 1500), order: result.size });
    }
    return [...result.values()];
  }
  const embeddedCache = new WeakMap();
  function readEmbeddedMetrics(document, rawUrl) {
    if (!new URL(rawUrl).hostname.endsWith('instagram.com')) return [];
    const records = new Map();
    for (const script of document.querySelectorAll('script[type="application/json"]')) {
      const text = script.textContent;
      if (text.length > 5000000 || !text.includes('like_count') && !text.includes('view_count')) continue;
      let saved = embeddedCache.get(script);
      if (!saved || saved.length !== text.length) {
        const posts = []; let visited = 0;
        const walk = (value, depth = 0) => {
          if (!value || typeof value !== 'object' || depth > 80 || ++visited > 100000) return;
          if (typeof value.code === 'string' && /^[\w-]+$/.test(value.code)) {
            const post = { url: 'https://www.instagram.com/reel/' + value.code + '/' };
            for (const [metric, field] of [['views', 'view_count'], ['likes', 'like_count'], ['comments', 'comment_count']]) {
              post[metric] = Number.isSafeInteger(value[field]) && value[field] >= 0 ? value[field] : null;
            }
            if (['views', 'likes', 'comments'].some(key => post[key] != null)) posts.push(post);
          }
          for (const child of Object.values(value)) walk(child, depth + 1);
        };
        try { walk(JSON.parse(text)); } catch { /* Unrelated or incomplete script. */ }
        saved = { length: text.length, posts }; embeddedCache.set(script, saved);
      }
      for (const post of saved.posts) records.set(post.url, post);
    }
    return [...records.values()];
  }
  const api = { readTiles, readEmbeddedMetrics, metricCount, contextKey, postType };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ContentLensAdapters = api;
})(globalThis);

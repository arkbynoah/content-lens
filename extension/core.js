(function (root) {
  'use strict';
  const formats = ['Talking head', 'B-roll + text', 'Voiceover', 'Interview', 'Mixed'];
  const structures = ['Storytelling', 'Tutorial', 'List', 'Commentary', 'Other'];

  // English UI counts only. Refuse ambiguous/localized numbers instead of inventing metrics.
  function parseCount(value) {
    if (typeof value !== 'string') return null;
    const match = value.trim().match(/^(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?\s*([KMB])?$/i);
    if (!match) return null;
    if (match[2] && !match[3]) return null;
    const amount = Number((match[1] + (match[2] || '')).replaceAll(',', ''));
    const result = amount * ({ K: 1e3, M: 1e6, B: 1e9 }[(match[3] || '').toUpperCase()] || 1);
    return Number.isSafeInteger(Math.round(result)) ? Math.round(result) : null;
  }

  function canonicalPost(raw, base) {
    try {
      const url = new URL(raw, base);
      if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
      if (['www.instagram.com', 'instagram.com'].includes(url.hostname)) {
        const match = url.pathname.match(/^\/(?:[^/]+\/)?(reel|p)\/([\w-]+)\/?$/);
        if (match) return `https://www.instagram.com/${match[1]}/${match[2]}/`;
      }
      if (['www.tiktok.com', 'tiktok.com'].includes(url.hostname)) {
        const match = url.pathname.match(/^\/@([\w.-]+)\/(video|photo)\/(\d+)\/?$/);
        if (match) return `https://www.tiktok.com/@${match[1]}/${match[2]}/${match[3]}`;
      }
    } catch { /* Not a post link. */ }
    return null;
  }

  function scopeFor(raw) {
    const url = new URL(raw);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (url.hostname === 'www.tiktok.com' && /^\/@[\w.-]+(?:\/(?:liked|favorites)(?:\/[^/]+)?|\/collection\/[^/]+)?$/.test(path)) {
      return { key: url.origin + path, platform: 'TikTok', label: path.slice(1) };
    }
    const parts = path.split('/').filter(Boolean);
    const reserved = ['reel', 'reels', 'p', 'explore', 'direct', 'accounts', 'stories', 'about', 'legal'];
    if (url.hostname === 'www.instagram.com' && parts.length && !reserved.includes(parts[0]) &&
        (parts.length === 1 || ['reels', 'saved', 'tagged'].includes(parts[1]))) {
      return { key: url.origin + path, platform: 'Instagram', label: '@' + parts[0] + (parts[1] ? ' / ' + parts[1] : '') };
    }
    return null;
  }

  function selectPosts(posts, tags, { metric = 'views', direction = 'desc', search = '', format = '', structure = '', type = '' } = {}) {
    const query = search.trim().toLowerCase();
    return posts.filter(post => {
      const tag = tags['tag:' + post.url] || {};
      return (!type || post.type === type) && (!format || tag.format === format) && (!structure || tag.structure === structure) &&
        (!query || [post.caption, post.url, tag.notes, tag.format, tag.structure].join(' ').toLowerCase().includes(query));
    }).sort((a, b) => {
      if (metric === 'order') return a.order - b.order;
      const av = a[metric], bv = b[metric];
      if (av == null && bv == null) return a.order - b.order;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (direction === 'asc' ? av - bv : bv - av) || a.order - b.order;
    });
  }

  function metricKey(raw, metric) {
    const url = canonicalPost(raw);
    if (!url || !['views', 'likes', 'comments'].includes(metric)) return null;
    const parsed = new URL(url), parts = parsed.pathname.split('/').filter(Boolean);
    return 'metric:' + (parsed.hostname.includes('instagram') ? 'ig:' : 'tt:') + parts.at(-1) + ':' + metric;
  }
  function withRememberedMetrics(post, storage, now = Date.now()) {
    const result = { ...post, remembered: [] };
    for (const metric of ['views', 'likes', 'comments']) {
      const saved = storage[metricKey(post.url, metric)];
      if (post[metric] == null && saved && Number.isSafeInteger(saved.value) && saved.value >= 0 &&
          Number.isFinite(saved.seenAt) && saved.seenAt <= now && now - saved.seenAt < 86400000) {
        result[metric] = saved.value; result.remembered.push(metric);
      }
    }
    return result;
  }

  function cleanTag(tag) {
    if (!tag || typeof tag !== 'object' || Array.isArray(tag)) throw new Error('Invalid tag record.');
    if (tag.format && !formats.includes(tag.format)) throw new Error('Unknown video format.');
    if (tag.structure && !structures.includes(tag.structure)) throw new Error('Unknown video structure.');
    if (tag.notes != null && (typeof tag.notes !== 'string' || tag.notes.length > 2000)) throw new Error('Invalid notes.');
    return { format: tag.format || '', structure: tag.structure || '', notes: tag.notes || '' };
  }

  function validateBackup(data) {
    if (!data || data.app !== 'content-lens' || data.version !== 1 || !Array.isArray(data.tags) || data.tags.length > 10000) {
      throw new Error('Choose a Content Lens version 1 backup (up to 10,000 posts).');
    }
    const result = {};
    for (const entry of data.tags) {
      const url = canonicalPost(entry?.url);
      if (!url) throw new Error('Backup contains an invalid post link.');
      result['tag:' + url] = cleanTag(entry);
    }
    return result;
  }

  function makeBackup(storage) {
    return { app: 'content-lens', version: 1, exportedAt: new Date().toISOString(), tags: Object.entries(storage)
      .filter(([key]) => key.startsWith('tag:') && canonicalPost(key.slice(4)))
      .map(([key, tag]) => ({ url: key.slice(4), ...cleanTag(tag) })) };
  }

  const api = { formats, structures, parseCount, canonicalPost, scopeFor, selectPosts, metricKey, withRememberedMetrics, cleanTag, validateBackup, makeBackup };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ContentLensCore = api;
})(globalThis);

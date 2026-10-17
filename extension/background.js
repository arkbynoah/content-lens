'use strict';
const api = globalThis.browser || globalThis.chrome;
api.runtime.onMessage.addListener((message, sender, reply) => {
  if (sender.id !== api.runtime.id || !sender.tab) return;
  let source;
  try { source = new URL(sender.url); } catch { return; }
  if (source.protocol !== 'https:' || !['www.instagram.com', 'www.tiktok.com'].includes(source.hostname)) return;
  if (!['open-library', 'open-options'].includes(message?.type)) return;
  const path = message.type === 'open-options' ? 'options.html' : 'library.html#' + encodeURIComponent(typeof message.scope === 'string' ? message.scope.slice(0, 2000) : '');
  api.tabs.create({ url: api.runtime.getURL(path) }).then(() => reply({ ok: true })).catch(() => reply({ ok: false }));
  return true;
});

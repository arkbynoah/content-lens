const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../extension/core.js');

test('display counts parse correctly without extracting digits from captions', () => {
  for (const [input, expected] of [['0', 0], ['1,234', 1234], ['12.5K', 12500], ['2.1M', 2100000], [' 3B ', 3000000000]]) {
    assert.equal(core.parseCount(input), expected, input);
  }
  for (const input of ['', '12 tips', '1,2K', '1.234', '3 comments', 'Hidden', '-3', '2026 fitness tips', null]) {
    assert.equal(core.parseCount(input), null, String(input));
  }
});

test('post identity survives tracking links, rejects unsafe and unrelated URLs', () => {
  assert.equal(core.canonicalPost('/reel/abc_123/?igsh=track', 'https://www.instagram.com/a/reels/'), 'https://www.instagram.com/reel/abc_123/');
  assert.equal(core.canonicalPost('https://instagram.com/creator/reel/abc/'), 'https://www.instagram.com/reel/abc/');
  assert.equal(core.canonicalPost('https://www.tiktok.com/@creator/video/123?tracking=1'), 'https://www.tiktok.com/@creator/video/123');
  for (const input of ['javascript:alert(1)', 'https://instagram.com.evil.test/reel/abc/', 'https://www.instagram.com/explore/', 'https://user:pass@instagram.com/reel/a/', 'https://instagram.com:444/reel/a/', 'https://example.com/reel/a/']) assert.equal(core.canonicalPost(input), null);
});

test('null counts stay last in both directions, zero is a real count, ties preserve collection order', () => {
  const posts = [{ url: 'unknown', views: null, order: 0 }, { url: 'high', views: 5000, order: 1 }, { url: 'zero', views: 0, order: 2 }, { url: 'tie', views: 5000, order: 3 }];
  assert.deepEqual(core.selectPosts(posts, {}).map(p => p.url), ['high', 'tie', 'zero', 'unknown']);
  assert.deepEqual(core.selectPosts(posts, {}, { direction: 'asc' }).map(p => p.url), ['zero', 'high', 'tie', 'unknown']);
  assert.deepEqual(posts.map(p => p.url), ['unknown', 'high', 'zero', 'tie']);
});

test('presentation and structure combine, and notes are searchable', () => {
  const posts = [{ url: 'one', caption: 'A story', order: 0 }, { url: 'two', caption: 'A tutorial', order: 1 }];
  const tags = { 'tag:one': { format: 'Talking head', structure: 'Storytelling', notes: 'Strong opening hook' }, 'tag:two': { format: 'Talking head', structure: 'Tutorial' } };
  assert.deepEqual(core.selectPosts(posts, tags, { format: 'Talking head', structure: 'Storytelling', search: 'HOOK' }).map(p => p.url), ['one']);
  assert.equal(core.selectPosts(posts, tags, { format: 'B-roll + text' }).length, 0);
});

test('backups round trip only portable tag data and reject corrupt records atomically', () => {
  const url = 'https://www.instagram.com/reel/a/';
  const tags = { ['tag:' + url]: { format: 'B-roll + text', structure: 'Storytelling', notes: 'Try this hook' } };
  const backup = core.makeBackup({ ...tags, unrelated: 'not exported' });
  assert.deepEqual(core.validateBackup(JSON.parse(JSON.stringify(backup))), tags);
  for (const bad of [{}, { ...backup, version: 2 }, { ...backup, tags: [{ url: 'javascript:alert(1)' }] }, { ...backup, tags: [{ url, format: 'Invented' }] }, { ...backup, tags: [{ url, notes: 123 }] }, { ...backup, tags: [null] }]) assert.throws(() => core.validateBackup(bad));
});

test('profile routes are isolated from feed, individual posts, and other platforms', () => {
  assert.equal(core.scopeFor('https://www.instagram.com/creator/reels/').label, '@creator / reels');
  assert.equal(core.scopeFor('https://www.tiktok.com/@creator').platform, 'TikTok');
  for (const url of ['https://www.instagram.com/', 'https://www.instagram.com/reel/abc/', 'https://www.instagram.com/direct/inbox/', 'https://www.tiktok.com/foryou', 'https://www.tiktok.com/@creator/video/123', 'https://example.com/creator']) assert.equal(core.scopeFor(url), null);
});

test('extension manifest loads existing files and requests only the intended sites and storage', () => {
  const base = path.join(__dirname, '../extension');
  const manifest = JSON.parse(fs.readFileSync(path.join(base, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://www.instagram.com/*', 'https://www.tiktok.com/*']);
  for (const file of [...manifest.content_scripts[0].js, manifest.action.default_popup, manifest.options_ui.page]) assert.ok(fs.existsSync(path.join(base, file)), file);
});

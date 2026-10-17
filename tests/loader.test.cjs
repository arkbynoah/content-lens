const test = require('node:test');
const assert = require('node:assert/strict');
const { collect } = require('../extension/loader.js');
const defaults = { wait: async () => {}, active: () => true, progress: () => {} };
test('collects batches and stops after repeated lack of new post IDs', async () => {
  let rounds = 0, ids = ['a'], reported = [];
  const result = await collect({ ...defaults, sample: () => ids, step: () => { rounds++; if(rounds < 4) ids.push(String(rounds)); }, progress: n => reported.push(n) });
  assert.deepEqual(result, { reason: 'idle', count: 4 });
  assert.equal(rounds, 6);
  assert.equal(reported.at(-1), 4);
});
test('stop or route change interrupts within one poll without another scroll', async () => {
  let active = true, scrolls = 0;
  const result = await collect({ ...defaults, sample: () => ['a'], step: () => scrolls++, active: () => active, wait: async () => { active = false; } });
  assert.equal(result.reason, 'stopped');
  assert.equal(scrolls, 1);
});
test('virtualized tiles with equal counts but new URLs count as progress', async () => {
  let rounds = 0;
  const result = await collect({ ...defaults, sample: () => ['post-' + rounds], step: () => rounds++, maxRounds: 4 });
  assert.deepEqual(result, { reason: 'limit', count: 5 });
});
test('late batches get a full wait window and duplicate IDs do not count twice', async () => {
  let polls = 0, ids = ['a'];
  const result = await collect({ ...defaults, sample: () => ids, step: () => {}, wait: async () => { if (++polls === 11) ids = ['a','b','b']; }, maxRounds: 2 });
  assert.deepEqual(result, { reason: 'limit', count: 2 });
});
test('scroll failures propagate for UI cleanup', async () => {
  await assert.rejects(collect({ ...defaults, sample: () => [], step: () => { throw Error('detached'); } }), /detached/);
});

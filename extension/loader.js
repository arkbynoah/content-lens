(function (root) {
  'use strict';
  async function collect({ sample, step, wait, active, progress, maxRounds = 60, idleLimit = 3 }) {
    const seen = new Set(sample());
    let idle = 0, missingPolls = 0;
    for (let round = 0; round < maxRounds; round++) {
      if (!active()) return { reason: 'stopped', count: seen.size };
      await step();
      let added = false;
      for (let tick = 0; tick < 12; tick++) {
        await wait(250);
        if (!active()) return { reason: 'stopped', count: seen.size };
        const current = new Set(sample());
        missingPolls = [...seen].some(id => !current.has(id)) ? missingPolls + 1 : 0;
        // A native virtualized grid cannot retain every previously seen tile.
        // Do not keep scrolling while promising a complete sortable collection.
        if (missingPolls >= 3) return { reason: 'virtualized', count: current.size };
        for (const id of current) if (!seen.has(id)) { seen.add(id); added = true; }
        progress(seen.size);
      }
      idle = added ? 0 : idle + 1;
      if (idle >= idleLimit) return { reason: 'idle', count: seen.size };
    }
    return { reason: 'limit', count: seen.size };
  }
  const api = { collect };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ContentLensLoader = api;
})(globalThis);

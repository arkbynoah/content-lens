(() => {
  const api = globalThis.browser || globalThis.chrome;
  const core = globalThis.ContentLensCore;
  const $ = id => document.getElementById(id);
  let pending = null;
  const message = (text, error = false) => { $('status').textContent = text; $('status').className = error ? 'error' : ''; };
  async function count() {
    const data = await api.storage.local.get(null);
    const size = core.makeBackup(data).tags.length;
    $('count').textContent = `${size} tagged posts ready to back up.`;
  }
  $('export').addEventListener('click', async () => {
    try {
      const data = core.makeBackup(await api.storage.local.get(null));
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `content-lens-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      message('Backup download started. Keep it alongside a copy of the extension folder.');
    } catch (error) { message(error.message, true); }
  });
  $('file').addEventListener('change', async () => {
    pending = null; $('import').disabled = true; $('preview').textContent = 'Select a backup to preview it.';
    const file = $('file').files[0]; if (!file) return;
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('Backup must be smaller than 8 MB.');
      const imported = core.validateBackup(JSON.parse(await file.text()));
      if ($('file').files[0] !== file) return;
      const existing = await api.storage.local.get(Object.keys(imported));
      if ($('file').files[0] !== file) return;
      pending = imported;
      $('preview').textContent = `${Object.keys(imported).length} posts to import; ${Object.keys(existing).length} existing records will be replaced.`;
      $('import').disabled = !Object.keys(imported).length; message('Backup validated. Select Import tags to restore.');
    } catch (error) { message(error.message, true); }
  });
  $('import').addEventListener('click', async () => {
    if (!pending) return;
    $('import').disabled = true;
    try { await api.storage.local.set(pending); pending = null; await count(); message('Tags restored. Open your profile and filter by your saved tags.'); }
    catch (error) { message(error.message, true); $('import').disabled = false; }
  });
  count().catch(error => message(error.message, true));
})();

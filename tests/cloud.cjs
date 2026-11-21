const assert = require('node:assert/strict');
const { makeApp, event } = require('./smoke.cjs');
const { startBackend } = require('./helpers.cjs');
const output = [];
function check(name, fn) { fn(); output.push(name); }
async function until(fn) {
  for (let n = 0; n < 500; n++) { if (fn()) return; await new Promise(resolve => setTimeout(resolve, 10)); }
  throw new Error('Timed out waiting for account state');
}
function deferred() { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; }
const sample = { title: 'Bài / thử 🎵', bpm: 100, text: '# bpm 100\nQ W E' };
(async () => {
  const backend = await startBackend();
  const client = backend.client();
  let networkFailure = false, holdNextSongs = null, held = false;
  const browserFetch = async (url, options) => {
    if (networkFailure) throw new Error('Offline');
    const response = await client.browserFetch(url, options);
    if (holdNextSongs && new URL(url).searchParams.get('action') === 'songs' && options.method === 'GET') {
      const barrier = holdNextSongs; holdNextSongs = null; held = true;
      await barrier.promise;
    }
    return response;
  };
  const app = makeApp(undefined, { fetch: browserFetch, localSongs: [sample] });
  const { $, w } = app;
  try {
    await until(() => w.__cloud.snapshot().ready);
    $('accountBtn').click(); $('registerModeBtn').click();
    $('accountUsername').value = 'student'; $('accountPassword').value = 'password123'; $('accountConfirm').value = 'different';
    event(w, $('accountForm'), 'submit');
    check('Registration asks only for username/password and checks confirmation', () => {
      assert.match($('accountMessage').textContent, /chưa khớp/); assert.equal(w.document.querySelector('input[type=email]'), null);
    });
    $('accountConfirm').value = 'password123'; event(w, $('accountForm'), 'submit');
    await until(() => !$('accountDialog').open && !w.__cloud.snapshot().busy);
    const studentUid = w.__cloud.snapshot().user.uid;
    check('Registration calls the real backend and keeps guest songs separate', () => {
      assert.equal($('accountName').textContent, 'student'); assert.equal($('logoutBtn').hidden, false);
      assert.equal($('accountPassword').value, ''); assert.equal(w.__cloud.snapshot().songs.length, 0);
      assert.equal(JSON.parse(w.localStorage.getItem('phongnhacsky.songs')).length, 1);
    });
    $('importLocalBtn').click(); await until(() => w.__cloud.snapshot().songs.length === 1 && !w.__cloud.snapshot().busy);
    check('Import copies local songs into SQLite and preserves the guest copy', () => {
      assert.ok($('songs').textContent.includes(sample.title)); assert.equal(JSON.parse(w.localStorage.getItem('phongnhacsky.songs')).length, 1);
    });
    $('titleIn').value = 'Bài riêng mới'; $('saveBtn').click();
    await until(() => w.__cloud.snapshot().songs.length === 2 && !w.__cloud.snapshot().busy);
    check('Account saves go to the database without adding to guest storage', () => assert.equal(JSON.parse(w.localStorage.getItem('phongnhacsky.songs')).length, 1));
    $('logoutBtn').click(); await until(() => !w.__cloud.snapshot().user && !w.__cloud.snapshot().busy);
    check('Logout resets the editor and hides private songs', () => {
      assert.equal($('accountBtn').hidden, false); assert.ok(!$('songs').textContent.includes('Bài riêng mới')); assert.notEqual($('songTitle').textContent, 'Bài riêng mới');
    });
    $('accountBtn').click(); $('accountUsername').value = 'student'; $('accountPassword').value = 'wrong'; event(w, $('accountForm'), 'submit');
    await until(() => $('accountMessage').textContent.includes('chưa đúng'));
    check('Wrong passwords show a Vietnamese error and are cleared', () => assert.equal($('accountPassword').value, ''));
    $('accountPassword').value = 'password123'; event(w, $('accountForm'), 'submit');
    await until(() => !$('accountDialog').open && !w.__cloud.snapshot().busy);
    check('Signing back in restores both songs from SQLite', () => assert.equal(w.__cloud.snapshot().songs.length, 2));
    const bob = backend.client();
    const registered = await bob.raw('register', 'POST', { username: 'other_student', password: 'password123' });
    const bobUid = registered.data.user.uid;
    const delay = deferred(); holdNextSongs = delay; held = false;
    const refreshing = w.__cloud.refresh(); await until(() => held);
    client.cookie = bob.cookie;
    w.dispatchEvent(new w.StorageEvent('storage', { key: 'phongnhacsky.session-change', newValue: 'changed' }));
    await until(() => w.__cloud.snapshot().user?.uid === bobUid && !w.__cloud.snapshot().loading);
    delay.resolve(); await refreshing;
    check('Late responses from an old account cannot populate the newly signed-in library', () => {
      assert.equal(w.__cloud.snapshot().user.uid, bobUid); assert.equal(w.__cloud.snapshot().songs.length, 0); assert.ok(!$('songs').textContent.includes('Bài riêng mới'));
    });
    // Đổi cookie nhưng chưa thông báo cho tab: API phải chặn ghi sai chủ.
    await client.raw('login', 'POST', { username: 'student', password: 'password123' });
    await assert.rejects(w.__cloud.save(sample), /Tài khoản đã thay đổi/);
    await until(() => w.__cloud.snapshot().user?.uid === studentUid && !w.__cloud.snapshot().busy);
    check('A stale tab recovers its current session after the server rejects a wrong-owner write', () => assert.equal(w.__cloud.snapshot().songs.length, 2));
    networkFailure = true;
    await w.__cloud.refresh();
    await assert.rejects(w.__cloud.save(sample), /tải lại thư viện/);
    check('Network errors preserve the account and block writes until refresh succeeds', () => {
      assert.equal(w.__cloud.snapshot().user.uid, studentUid); assert.match(w.__cloud.snapshot().error, /Kết nối/);
    });
    networkFailure = false; await w.__cloud.refresh();
    const privateSong = w.__cloud.snapshot().songs.find(song => song.title === 'Bài riêng mới');
    await w.__cloud.remove(privateSong.id);
    check('Delete updates the database and account library', () => assert.equal(w.__cloud.snapshot().songs.length, 1));
    await w.__cloud.signOut();
    assert.deepEqual(app.errors, []);
  } finally { app.dom.window.close(); await backend.close(); }
  const fallback = makeApp(undefined, { fetch: async () => ({ status: 404, ok: false, json: async () => ({}) }) });
  await until(() => fallback.w.__cloud.snapshot().ready);
  check('Static-only hosting falls back to guest storage without enabling fake accounts', () => {
    assert.equal(fallback.w.__cloud.snapshot().configured, false); fallback.$('accountBtn').click();
    assert.equal(fallback.$('accountSubmit').disabled, true); assert.equal(fallback.$('saveBtn').disabled, false);
  });
  fallback.dom.window.close();
  console.log(output.map((name, i) => `${i + 1}. PASS ${name}`).join('\n'));
  console.log(`\n${output.length} frontend/account checks passed against the HTTP backend and real SQLite.`);
})().catch(error => { console.error(error); process.exitCode = 1; });

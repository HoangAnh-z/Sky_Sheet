(function () {
  'use strict';
  function message(error) { return error && error.message || 'Thao tác chưa thành công. Hãy thử lại.'; }
  function validSong(song) {
    return song && typeof song.title === 'string' && song.title.trim().length > 0 && song.title.trim().length <= 80 &&
      typeof song.text === 'string' && song.text.trim().length > 0 && song.text.length <= 200000 &&
      Number.isInteger(song.bpm) && song.bpm >= 50 && song.bpm <= 220;
  }
  window.SkyCloud = function (options) {
    options = options || {};
    var fetcher = options.fetch || window.fetch.bind(window);
    var endpoint = options.endpoint || new URL('api/account', document.baseURI).href;
    var state = { configured: options.enabled !== false, ready: options.enabled === false, user: null, songs: [], loading: false, busy: false, error: '' };
    var listeners = [], generation = 0, started;
    function snapshot() { return Object.assign({}, state, { songs: state.songs.map(function (song) { return Object.assign({}, song); }) }); }
    function emit() { listeners.forEach(function (fn) { fn(snapshot()); }); }
    function sameSession(session) { return state.user && state.user.uid === session.uid && generation === session.version; }
    function setUser(user) { generation++; state.user = user; state.songs = []; state.error = ''; }
    function signalChange() {
      try { window.localStorage.setItem('phongnhacsky.session-change', String(Date.now()) + Math.random()); } catch (_) {}
    }
    async function request(action, method, body, uid, params) {
      var controller = new AbortController(), timeout = setTimeout(function () { controller.abort(); }, 20000);
      try {
        var headers = {};
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        if (uid) headers['X-Sky-User'] = uid;
        var query = new URLSearchParams(Object.assign({ action: action }, params || {}));
        var response = await fetcher(endpoint + '?' + query.toString(), {
          method: method || 'GET', credentials: 'same-origin', cache: 'no-store', headers: headers,
          body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal
        });
        var data;
        try { data = await response.json(); } catch (_) { data = {}; }
        if (!response.ok) {
          var error = new Error(data.error && data.error.message || 'Không kết nối được tài khoản. Hãy tải lại trang hoặc thử lại sau.');
          error.code = data.error && data.error.code; error.status = response.status; throw error;
        }
        return data;
      } catch (error) {
        if (error.status) throw error;
        throw new Error('Kết nối bị gián đoạn. Hãy kiểm tra mạng và tải lại thư viện trước khi thử lại.');
      } finally { clearTimeout(timeout); }
    }
    async function fetchSongs(session) {
      try {
        var data = await request('songs', 'GET', undefined, session.uid);
        if (!sameSession(session)) return;
        state.songs = data.songs.filter(validSong); state.error = '';
      } catch (error) {
        if (sameSession(session)) {
          if (error.code === 'AUTH_REQUIRED' || error.code === 'SESSION_CHANGED') setUser(null);
          state.error = message(error);
        }
      } finally { if (session.version === generation || !state.user) { state.loading = false; emit(); } }
    }
    async function syncSession() {
      var version = ++generation;
      state.loading = !!state.user; emit();
      try {
        var data = await request('session');
        if (version !== generation) return;
        setUser(data.user); state.configured = true; state.ready = true; state.loading = !!data.user; emit();
        if (data.user) await fetchSongs({ uid: data.user.uid, version: generation });
      } catch (error) {
        if (version !== generation) return;
        state.configured = error.code !== 'SETUP_REQUIRED' && error.status !== 404;
        state.ready = !state.configured; state.loading = false;
        // Không chuyển người đang đăng nhập sang chế độ khách nếu chỉ mất mạng.
        state.error = state.configured ? message(error) : '';
        emit();
      }
    }
    async function operation(action) {
      if (state.busy) throw new Error('Đang xử lý. Hãy đợi một chút.');
      state.busy = true; emit();
      try { return await action(); }
      catch (error) {
        if (error.code === 'AUTH_REQUIRED' || error.code === 'SESSION_CHANGED') { setUser(null); emit(); await syncSession(); }
        throw error;
      } finally { state.busy = false; emit(); }
    }
    function requireUser() {
      if (!state.user) throw new Error('Hãy đăng nhập để lưu vào tài khoản.');
      if (state.loading || state.error) throw new Error('Hãy tải lại thư viện trước khi lưu hoặc xóa.');
      return { uid: state.user.uid, version: generation };
    }
    async function authenticate(username, password, register) {
      var name = String(username || '').trim().toLowerCase();
      if (!/^[a-z0-9_]{3,24}$/.test(name)) throw new Error('Tên đăng nhập gồm 3–24 ký tự: a–z, 0–9 hoặc dấu _.');
      if (typeof password !== 'string' || password.length < (register ? 8 : 1) || password.length > 128) throw new Error(register ? 'Mật khẩu cần từ 8 đến 128 ký tự.' : 'Hãy nhập mật khẩu (tối đa 128 ký tự).');
      if (!state.configured || !state.ready) throw new Error('Tài khoản chưa sẵn sàng. Hãy tải lại trang.');
      return operation(async function () {
        var version = generation;
        var data = await request(register ? 'register' : 'login', 'POST', { username: name, password: password });
        signalChange();
        if (version !== generation) { await syncSession(); return; }
        setUser(data.user); state.loading = true; emit();
        await fetchSongs({ uid: data.user.uid, version: generation });
      });
    }
    window.addEventListener('storage', function (event) { if (event.key === 'phongnhacsky.session-change') syncSession(); });
    return {
      start: function () {
        if (options.enabled === false || window.location.protocol === 'file:') { state.configured = false; state.ready = true; emit(); return Promise.resolve(); }
        if (!started) started = syncSession();
        return started;
      },
      snapshot: snapshot,
      subscribe: function (fn) { listeners.push(fn); fn(snapshot()); return function () { listeners = listeners.filter(function (listener) { return fn !== listener; }); }; },
      signIn: function (name, password) { return authenticate(name, password, false); },
      register: function (name, password) { return authenticate(name, password, true); },
      signOut: function () {
        return operation(async function () {
          await request('logout', 'POST', {}, state.user && state.user.uid);
          setUser(null); state.loading = false; emit(); signalChange();
        });
      },
      refresh: function () { if (!state.busy && !state.loading) return syncSession(); },
      community: async function (action, method, body, params) {
        if (!state.configured || !state.ready) throw new Error('Kết nối cộng đồng chưa sẵn sàng. Hãy tải lại trang.');
        method = method || 'GET';
        if (method === 'GET') return request(action, method, undefined, state.user && state.user.uid, params);
        var session = requireUser();
        return operation(async function () {
          var data = await request(action, method, body, session.uid, params);
          if (!sameSession(session)) throw new Error('Tài khoản đã thay đổi. Hãy tải lại cộng đồng.');
          return data;
        });
      },
      save: async function (value) {
        var session = requireUser();
        if (!validSong(value)) throw new Error('Bài nhạc không hợp lệ hoặc quá dài (tối đa 200.000 ký tự).');
        return operation(async function () {
          var data = await request('songs', 'PUT', value, session.uid);
          if (sameSession(session)) { state.songs = state.songs.filter(function (song) { return song.id !== data.song.id; }); state.songs.unshift(data.song); emit(); return data.song; }
        });
      },
      remove: async function (id) {
        var session = requireUser();
        return operation(async function () {
          await request('songs', 'DELETE', { id: id }, session.uid);
          if (sameSession(session)) { state.songs = state.songs.filter(function (song) { return song.id !== id; }); emit(); }
        });
      },
      importSongs: async function (songs) {
        var session = requireUser(), existing = new Set(state.songs.map(function (song) { return song.title; }));
        var pending = songs.filter(function (song) { if (!validSong(song) || existing.has(song.title.trim())) return false; existing.add(song.title.trim()); return true; });
        return operation(async function () {
          var count = 0;
          for (var offset = 0; offset < pending.length; offset += 5) {
            if (!sameSession(session)) throw new Error('Tài khoản đã thay đổi. Hãy kiểm tra lại thư viện.');
            var data = await request('import', 'POST', { songs: pending.slice(offset, offset + 5) }, session.uid);
            if (sameSession(session)) { state.songs = data.songs.concat(state.songs); emit(); }
            count += data.imported;
          }
          return { imported: count, skipped: songs.length - count };
        });
      }
    };
  };
  window.SkyCloud.errorMessage = message;
})();

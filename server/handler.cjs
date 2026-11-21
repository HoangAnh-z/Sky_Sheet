const { randomBytes, randomUUID, createHash } = require('node:crypto');
const { hashPassword, verifyPassword } = require('./password.cjs');
const { community, PUBLIC_ACTIONS, ACTIONS: COMMUNITY_ACTIONS } = require('./community.cjs');

const SESSION_SECONDS = 7 * 24 * 60 * 60;
const MAX_SONGS = 100;
const MAX_BODY_BYTES = 3500000;
class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
function fail(status, code, message) { throw new ApiError(status, code, message); }
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function normalizeUsername(value) {
  if (typeof value !== 'string') fail(400, 'INVALID_USERNAME', 'Hãy nhập tên đăng nhập.');
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(username)) fail(400, 'INVALID_USERNAME', 'Tên đăng nhập gồm 3–24 ký tự: a–z, 0–9 hoặc dấu _.');
  return username;
}
function validateSong(value) {
  if (!value || typeof value.title !== 'string' || !value.title.trim() || value.title.trim().length > 80 ||
      typeof value.text !== 'string' || !value.text.trim() || value.text.length > 200000 ||
      !Number.isInteger(value.bpm) || value.bpm < 50 || value.bpm > 220) {
    fail(400, 'INVALID_SONG', 'Bài nhạc không hợp lệ: tên tối đa 80 ký tự, nội dung tối đa 200.000 ký tự, BPM 50–220.');
  }
  return { title: value.title.trim(), bpm: value.bpm, text: value.text };
}
function getCookie(req, name) {
  const header = req.headers.cookie;
  if (typeof header !== 'string') return null;
  const part = header.split(';').map(value => value.trim()).find(value => value.startsWith(name + '='));
  const token = part && part.slice(name.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
async function readBody(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) fail(415, 'JSON_REQUIRED', 'Yêu cầu cần dùng JSON.');
  if (Number(req.headers['content-length'] || 0) > MAX_BODY_BYTES) fail(413, 'BODY_TOO_LARGE', 'Dữ liệu gửi lên quá lớn.');
  let value;
  try {
    if (req.body !== undefined) {
      if (Buffer.isBuffer(req.body) || typeof req.body === 'string') {
        if (Buffer.byteLength(req.body) > MAX_BODY_BYTES) fail(413, 'BODY_TOO_LARGE', 'Dữ liệu gửi lên quá lớn.');
        value = JSON.parse(req.body.toString());
      } else {
        if (Buffer.byteLength(JSON.stringify(req.body)) > MAX_BODY_BYTES) fail(413, 'BODY_TOO_LARGE', 'Dữ liệu gửi lên quá lớn.');
        value = req.body;
      }
    } else {
      const chunks = []; let size = 0;
      for await (const chunk of req) {
        size += Buffer.byteLength(chunk);
        if (size > MAX_BODY_BYTES) fail(413, 'BODY_TOO_LARGE', 'Dữ liệu gửi lên quá lớn.');
        chunks.push(Buffer.from(chunk));
      }
      value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    fail(400, 'INVALID_JSON', 'Dữ liệu gửi lên chưa đúng định dạng.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'INVALID_JSON', 'Dữ liệu gửi lên chưa đúng định dạng.');
  return value;
}

function createHandler({ getDatabase, secureCookies = true, now = () => Date.now() }) {
  const cookieName = secureCookies ? '__Host-sky_session' : 'sky_session';
  function setCookie(res, token, maxAge = SESSION_SECONDS) {
    res.setHeader('Set-Cookie', `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureCookies ? '; Secure' : ''}`);
  }
  async function currentUser(db, req) {
    const token = getCookie(req, cookieName);
    if (!token) return null;
    const result = await db.execute({
      sql: 'SELECT users.id AS uid, users.username FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?',
      args: [sha256(token), now()]
    });
    return result.rows[0] || null;
  }
  async function rateLimit(db, key, limit, seconds) {
    const time = now(), keyHash = sha256(key);
    const result = await db.execute({
      sql: `INSERT INTO auth_limits (key_hash, attempts, expires_at) VALUES (?, 1, ?)
        ON CONFLICT(key_hash) DO UPDATE SET
          attempts = CASE WHEN auth_limits.expires_at <= ? THEN 1 ELSE auth_limits.attempts + 1 END,
          expires_at = CASE WHEN auth_limits.expires_at <= ? THEN excluded.expires_at ELSE auth_limits.expires_at END
        RETURNING attempts`,
      args: [keyHash, time + seconds * 1000, time, time]
    });
    if (Number(result.rows[0].attempts) > limit) fail(429, 'RATE_LIMITED', 'Bạn thao tác quá nhiều lần. Hãy đợi khoảng 15 phút rồi thử lại.');
  }
  function sessionStatements(req, userId, token) {
    const statements = [
      { sql: 'DELETE FROM sessions WHERE expires_at <= ?', args: [now()] },
      { sql: 'DELETE FROM auth_limits WHERE expires_at <= ?', args: [now()] },
      { sql: 'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', args: [sha256(token), userId, now() + SESSION_SECONDS * 1000] }
    ];
    const oldToken = getCookie(req, cookieName);
    if (oldToken) statements.push({ sql: 'DELETE FROM sessions WHERE token_hash = ?', args: [sha256(oldToken)] });
    return statements;
  }
  function songRow(row) {
    const song = { id: row.id, title: row.title, bpm: Number(row.bpm), text: row.text, updatedAt: Number(row.updated_at) };
    if (row.post_id) song.source = { postId: row.post_id, username: row.source_username, title: row.original_title, composer: row.source_composer, url: row.source_url };
    return song;
  }

  return async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Cookie');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const reply = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)); };
    try {
      const url = new URL(req.url, 'http://localhost');
      const action = url.searchParams.get('action') || 'session';
      const methods = { session: ['GET'], register: ['POST'], login: ['POST'], logout: ['POST'], songs: ['GET', 'PUT', 'DELETE'], import: ['POST'],
        community: ['GET'], post: ['GET', 'DELETE'], publish: ['GET', 'POST'], 'copy-post': ['POST'], like: ['PUT'], follow: ['PUT'], comments: ['GET', 'POST', 'DELETE'] };
      if (!Object.hasOwn(methods, action)) fail(404, 'NOT_FOUND', 'Không tìm thấy chức năng này.');
      if (!methods[action].includes(req.method)) {
        res.setHeader('Allow', methods[action].join(', ')); fail(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');
      }
      const mutation = req.method !== 'GET';
      if (mutation) {
        const expectedOrigin = `${secureCookies ? 'https' : 'http'}://${req.headers.host}`;
        if (req.headers.origin !== expectedOrigin || req.headers['sec-fetch-site'] === 'cross-site') fail(403, 'INVALID_ORIGIN', 'Yêu cầu không đến từ trang hiện tại. Hãy tải lại trang.');
      }
      const db = await getDatabase().ready();
      const body = mutation ? await readBody(req) : null;
      if (PUBLIC_ACTIONS.has(action) && req.method === 'GET') {
        return reply(200, await community({ db, action, req, url, body, user: await currentUser(db, req), fail, rateLimit, now, maxSongs: MAX_SONGS }));
      }

      if (action === 'session') return reply(200, { user: await currentUser(db, req) });
      if (action === 'logout') {
        const activeUser = await currentUser(db, req);
        if (activeUser && req.headers['x-sky-user'] && req.headers['x-sky-user'] !== activeUser.uid) fail(409, 'SESSION_CHANGED', 'Tài khoản đã thay đổi ở tab khác. Hãy kiểm tra lại thư viện.');
        const token = getCookie(req, cookieName);
        if (token) await db.execute({ sql: 'DELETE FROM sessions WHERE token_hash = ?', args: [sha256(token)] });
        setCookie(res, '', 0); return reply(200, { user: null });
      }
      if (action === 'register' || action === 'login') {
        const username = normalizeUsername(body.username), password = body.password;
        if (typeof password !== 'string' || password.length < (action === 'register' ? 8 : 1) || password.length > 128) {
          fail(400, 'INVALID_PASSWORD', action === 'register' ? 'Mật khẩu cần từ 8 đến 128 ký tự.' : 'Hãy nhập mật khẩu (tối đa 128 ký tự).');
        }
        // Vercel đặt X-Forwarded-For; chỉ lưu băm của IP, không lưu IP gốc.
        const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
        await rateLimit(db, `auth-ip:${ip}`, 40, 900);
        if (action === 'register') await rateLimit(db, `register-ip:${ip}`, 10, 900);
        else await rateLimit(db, `login-user:${username}`, 15, 900);
        const result = await db.execute({ sql: 'SELECT id, username, password_hash FROM users WHERE username = ?', args: [username] });
        let user = result.rows[0];
        const token = randomBytes(32).toString('hex');
        if (action === 'register') {
          if (user) fail(409, 'USERNAME_TAKEN', 'Tên đăng nhập này đã có người dùng.');
          user = { id: randomUUID(), username };
          const passwordHash = await hashPassword(password);
          try {
            await db.batch([
              { sql: 'INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)', args: [user.id, username, passwordHash, now()] },
              ...sessionStatements(req, user.id, token)
            ], 'write');
          } catch (error) {
            if (/CONSTRAINT/.test(error.code || '')) fail(409, 'USERNAME_TAKEN', 'Tên đăng nhập này đã có người dùng.');
            throw error;
          }
        } else {
          const valid = await verifyPassword(password, user ? user.password_hash : undefined);
          if (!user || !valid) fail(401, 'INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu chưa đúng.');
          await db.batch([
            ...sessionStatements(req, user.id, token),
            { sql: 'DELETE FROM auth_limits WHERE key_hash = ?', args: [sha256(`login-user:${username}`)] }
          ], 'write');
        }
        setCookie(res, token);
        return reply(action === 'register' ? 201 : 200, { user: { uid: user.id, username: user.username } });
      }

      const user = await currentUser(db, req);
      if (!user) fail(401, 'AUTH_REQUIRED', 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.');
      if (req.headers['x-sky-user'] !== user.uid) fail(409, 'SESSION_CHANGED', 'Tài khoản đã thay đổi ở tab khác. Hãy kiểm tra lại thư viện.');
      if (COMMUNITY_ACTIONS.has(action)) return reply(200, await community({ db, action, req, url, body, user, fail, rateLimit, now, maxSongs: MAX_SONGS }));
      if (action === 'songs' && req.method === 'GET') {
        const result = await db.execute({ sql: `SELECT s.*, ls.post_id, ls.username AS source_username, ls.original_title, ls.composer AS source_composer, ls.source_url FROM songs s LEFT JOIN library_sources ls ON ls.song_id = s.id WHERE s.user_id = ? ORDER BY s.updated_at DESC, s.id`, args: [user.uid] });
        return reply(200, { songs: result.rows.map(songRow) });
      }
      if (action === 'songs' && req.method === 'DELETE') {
        if (typeof body.id !== 'string' || body.id.length > 100) fail(400, 'INVALID_SONG_ID', 'Bài nhạc không hợp lệ.');
        const [, result] = await db.batch([
          { sql: 'DELETE FROM library_sources WHERE song_id IN (SELECT id FROM songs WHERE id = ? AND user_id = ?)', args: [body.id, user.uid] },
          { sql: 'DELETE FROM songs WHERE id = ? AND user_id = ?', args: [body.id, user.uid] }
        ], 'write');
        if (!result.rowsAffected) fail(404, 'SONG_NOT_FOUND', 'Không tìm thấy bài nhạc trong tài khoản.');
        return reply(200, { deleted: true });
      }
      if (action === 'songs' && req.method === 'PUT') {
        const song = validateSong(body), time = now();
        if (body.id != null) {
          if (typeof body.id !== 'string' || body.id.length > 100) fail(400, 'INVALID_SONG_ID', 'Mã bài nhạc không hợp lệ.');
          let updated;
          try {
            updated = await db.execute({ sql: 'UPDATE songs SET title = ?, bpm = ?, text = ?, updated_at = ? WHERE id = ? AND user_id = ? RETURNING *', args: [song.title, song.bpm, song.text, time, body.id, user.uid] });
          } catch (error) {
            if (/CONSTRAINT/.test(error.code || '')) fail(409, 'TITLE_CONFLICT', 'Thư viện đã có bài khác cùng tên. Hãy chọn tên khác.');
            throw error;
          }
          if (!updated.rows.length) fail(404, 'SONG_NOT_FOUND', 'Không tìm thấy bài thuộc tài khoản của bạn. Hãy tải lại thư viện.');
          const source = (await db.execute({ sql: 'SELECT post_id, username AS source_username, original_title, composer AS source_composer, source_url FROM library_sources WHERE song_id = ? AND user_id = ?', args: [body.id, user.uid] })).rows[0];
          return reply(200, { song: songRow({ ...updated.rows[0], ...source }) });
        }
        const result = await db.execute({
          sql: `INSERT INTO songs (id, user_id, title, bpm, text, updated_at)
            SELECT ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM songs WHERE user_id = ?) < ?
              OR EXISTS(SELECT 1 FROM songs WHERE user_id = ? AND title = ?)
            ON CONFLICT(user_id, title) DO UPDATE SET bpm = excluded.bpm, text = excluded.text, updated_at = excluded.updated_at
            RETURNING id, title, bpm, text, updated_at`,
          args: [randomUUID(), user.uid, song.title, song.bpm, song.text, time, user.uid, MAX_SONGS, user.uid, song.title]
        });
        if (!result.rows.length) fail(409, 'LIBRARY_FULL', `Tài khoản đã có ${MAX_SONGS} bài. Hãy xóa bớt bài trước khi lưu bài mới.`);
        return reply(200, { song: songRow(result.rows[0]) });
      }
      if (action === 'import') {
        if (!Array.isArray(body.songs) || body.songs.length > 5) fail(400, 'INVALID_IMPORT', 'Mỗi lần chép tối đa 5 bài.');
        const songs = body.songs.map(validateSong);
        if (!songs.length) return reply(200, { songs: [], imported: 0, skipped: 0 });
        const result = await db.batch(songs.map(song => ({
          sql: `INSERT INTO songs (id, user_id, title, bpm, text, updated_at)
            SELECT ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM songs WHERE user_id = ?) < ?
            ON CONFLICT(user_id, title) DO NOTHING RETURNING id, title, bpm, text, updated_at`,
          args: [randomUUID(), user.uid, song.title, song.bpm, song.text, now(), user.uid, MAX_SONGS]
        })), 'write');
        const imported = result.flatMap(value => value.rows.map(songRow));
        return reply(200, { songs: imported, imported: imported.length, skipped: songs.length - imported.length });
      }
    } catch (error) {
      if (error.code === 'SETUP_REQUIRED') return reply(503, { error: { code: 'SETUP_REQUIRED', message: 'Tài khoản chưa được mở trên trang này. Bạn vẫn có thể lưu bài tại máy.' } });
      if (error instanceof ApiError) return reply(error.status, { error: { code: error.code, message: error.message } });
      // Không ghi token, mật khẩu, nội dung bài hoặc lỗi SQL chứa tham số ra log.
      console.error('Account API error:', error.code || error.name || 'unknown');
      return reply(503, { error: { code: 'DATABASE_UNAVAILABLE', message: 'Chưa kết nối được thư viện. Hãy thử lại sau.' } });
    }
  };
}
module.exports = { createHandler, ApiError };

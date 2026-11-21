const { randomUUID } = require('node:crypto');
const PUBLIC_ACTIONS = new Set(['community', 'post', 'comments']);
const ACTIONS = new Set([...PUBLIC_ACTIONS, 'publish', 'copy-post', 'like', 'follow']);

async function community({ db, action, req, url, body, user, fail, rateLimit, now, maxSongs }) {
  const uid = user ? user.uid : '';
  const id = value => {
    if (typeof value !== 'string' || !value || value.length > 100) fail(400, 'INVALID_ID', 'Mã bài hoặc người dùng không hợp lệ.');
    return value;
  };
  const string = (value, length, label) => {
    if (value == null) return '';
    if (typeof value !== 'string' || value.length > length) fail(400, 'INVALID_METADATA', `${label} quá dài hoặc không hợp lệ.`);
    return value.trim();
  };
  function offset() {
    const value = Number(url.searchParams.get('offset') || 0);
    if (!Number.isInteger(value) || value < 0 || value > 10000) fail(400, 'INVALID_PAGE', 'Trang không hợp lệ.');
    return value;
  }
  async function publicPost(postId) {
    const result = await db.execute({ sql: 'SELECT p.*, u.username FROM public_posts p JOIN users u ON u.id = p.user_id WHERE p.id = ? AND p.is_public = 1', args: [postId] });
    if (!result.rows.length) fail(404, 'POST_NOT_FOUND', 'Bài này đã được gỡ công khai hoặc không tồn tại.');
    return result.rows[0];
  }
  const aggregates = `
    (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS likes,
    (SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id) AS comments,
    EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked,
    EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.followed_id = p.user_id) AS following,
    EXISTS(SELECT 1 FROM library_sources s JOIN songs so ON so.id = s.song_id WHERE s.post_id = p.id AND s.user_id = ? AND so.user_id = ?) AS saved`;
  function postRow(row, includeText) {
    const value = {
      id: row.id, userId: row.user_id, username: row.username, title: row.title, bpm: Number(row.bpm),
      description: row.description, composer: row.composer, sourceUrl: row.source_url, creditUsername: row.credit_username,
      publishedAt: Number(row.published_at), updatedAt: Number(row.updated_at),
      likes: Number(row.likes || 0), comments: Number(row.comments || 0), liked: !!row.liked, following: !!row.following, saved: !!row.saved, own: row.user_id === uid
    };
    if (includeText) value.text = row.text;
    if (value.own) value.sourceSongId = row.source_song_id;
    return value;
  }
  if (action === 'community') {
    const q = string(url.searchParams.get('q'), 80, 'Từ khóa');
    const mode = url.searchParams.get('filter') || 'all';
    if (!['all', 'following', 'mine'].includes(mode)) fail(400, 'INVALID_FILTER', 'Bộ lọc không hợp lệ.');
    if (mode !== 'all' && !user) fail(401, 'AUTH_REQUIRED', 'Hãy đăng nhập để xem mục này.');
    const clauses = ['p.is_public = 1']; const params = [uid, uid, uid, uid];
    if (q) {
      const pattern = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
      clauses.push("(p.title LIKE ? ESCAPE '\\' OR u.username LIKE ? ESCAPE '\\')"); params.push(pattern, pattern);
    }
    if (mode === 'mine') { clauses.push('p.user_id = ?'); params.push(uid); }
    if (mode === 'following') { clauses.push('EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.followed_id = p.user_id)'); params.push(uid); }
    const start = offset(); params.push(start);
    const result = await db.execute({
      sql: `SELECT p.id, p.user_id, p.source_song_id, p.title, p.bpm, p.description, p.composer, p.source_url, p.credit_username, p.published_at, p.updated_at, u.username, ${aggregates}
        FROM public_posts p JOIN users u ON u.id = p.user_id WHERE ${clauses.join(' AND ')} ORDER BY p.published_at DESC, p.id DESC LIMIT 21 OFFSET ?`, args: params
    });
    return { posts: result.rows.slice(0, 20).map(row => postRow(row, false)), nextOffset: result.rows.length > 20 ? start + 20 : null };
  }
  if (action === 'post' && req.method === 'GET') {
    const result = await db.execute({ sql: `SELECT p.*, u.username, ${aggregates} FROM public_posts p JOIN users u ON u.id = p.user_id WHERE p.id = ? AND p.is_public = 1`, args: [uid, uid, uid, uid, id(url.searchParams.get('id'))] });
    if (!result.rows.length) fail(404, 'POST_NOT_FOUND', 'Bài này đã được gỡ công khai hoặc không tồn tại.');
    return { post: postRow(result.rows[0], true) };
  }
  if (action === 'publish') {
    const songId = id(req.method === 'GET' ? url.searchParams.get('songId') : body.songId);
    const song = (await db.execute({ sql: `SELECT s.*, ls.username AS credit, ls.composer AS source_composer, ls.source_url AS original_url FROM songs s LEFT JOIN library_sources ls ON ls.song_id = s.id WHERE s.id = ? AND s.user_id = ?`, args: [songId, uid] })).rows[0];
    if (!song) fail(404, 'SONG_NOT_FOUND', 'Hãy lưu bài vào tài khoản của bạn trước khi đăng.');
    if (req.method === 'GET') {
      const previous = (await db.execute({ sql: 'SELECT id, description, composer, source_url, is_public FROM public_posts WHERE source_song_id = ? AND user_id = ?', args: [songId, uid] })).rows[0];
      return { publication: previous ? { id: previous.id, description: previous.description, composer: previous.composer, sourceUrl: previous.source_url, isPublic: !!previous.is_public } : null };
    }
    await rateLimit(db, `publish:${uid}`, 60, 900);
    let tracks = 0, steps = 0, hasNote = false;
    for (const line of song.text.split(/\r?\n/)) {
      if (/^\s*#\s*track\b/i.test(line)) { tracks++; steps = 0; if (tracks > 8) fail(400, 'PUBLIC_SCORE_LIMIT', 'Bài công khai tối đa 8 lớp, 4.096 bước/lớp.'); }
      if (/^\s*#/.test(line)) continue;
      for (const token of line.trim().split(/\s+/).filter(Boolean)) {
        if (token === '|') continue;
        if (!tracks) tracks = 1;
        if (!/^[-._]$/.test(token) && !/^[QWERTASDFGZXCVB](\+[QWERTASDFGZXCVB])*$/i.test(token)) fail(400, 'INVALID_PUBLIC_SCORE', 'Bản nhạc có ký tự không hợp lệ. Hãy Áp dụng và lưu lại trước khi đăng.');
        if (/^[QWERTASDFGZXCVB]/i.test(token)) hasNote = true;
        if (++steps > 4096) fail(400, 'PUBLIC_SCORE_LIMIT', 'Bài công khai tối đa 8 lớp, 4.096 bước/lớp.');
      }
    }
    if (!hasNote) fail(400, 'EMPTY_PUBLIC_SCORE', 'Bài cần có nốt nhạc trước khi đăng.');
    const description = string(body.description, 1000, 'Mô tả');
    const composer = string(body.composer, 80, 'Tên tác giả gốc') || song.source_composer || '';
    const sourceUrl = string(body.sourceUrl, 500, 'Đường dẫn nguồn') || song.original_url || '';
    if (sourceUrl) {
      try { if (!['http:', 'https:'].includes(new URL(sourceUrl).protocol)) throw new Error(); }
      catch { fail(400, 'INVALID_SOURCE_URL', 'Nguồn cần là đường dẫn http:// hoặc https:// hợp lệ.'); }
    }
    const result = await db.execute({
      sql: `INSERT INTO public_posts (id, user_id, source_song_id, title, bpm, text, description, composer, source_url, credit_username, published_at, updated_at)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM public_posts WHERE user_id = ? AND is_public = 1) < 100
          OR EXISTS(SELECT 1 FROM public_posts WHERE source_song_id = ? AND user_id = ? AND is_public = 1)
        ON CONFLICT(source_song_id) DO UPDATE SET title = excluded.title, bpm = excluded.bpm, text = excluded.text,
          description = excluded.description, composer = excluded.composer, source_url = excluded.source_url, credit_username = excluded.credit_username,
          published_at = CASE WHEN public_posts.is_public = 0 THEN excluded.published_at ELSE public_posts.published_at END,
          is_public = 1, updated_at = excluded.updated_at RETURNING id`,
      args: [randomUUID(), uid, song.id, song.title, song.bpm, song.text, description, composer, sourceUrl, song.credit || '', now(), now(), uid, song.id, uid]
    });
    if (!result.rows.length) fail(409, 'PUBLIC_LIBRARY_FULL', 'Bạn đã có 100 bài công khai. Hãy gỡ bớt bài trước khi đăng mới.');
    return { id: result.rows[0].id };
  }
  if (action === 'post' && req.method === 'DELETE') {
    const result = await db.execute({ sql: 'UPDATE public_posts SET is_public = 0, updated_at = ? WHERE id = ? AND user_id = ? AND is_public = 1', args: [now(), id(body.id), uid] });
    if (!result.rowsAffected) fail(404, 'POST_NOT_FOUND', 'Không tìm thấy bài công khai thuộc tài khoản của bạn.');
    return { removed: true };
  }
  if (action === 'copy-post') {
    const postId = id(body.id);
    const tx = await db.transaction('write');
    try {
      const post = (await tx.execute({ sql: 'SELECT p.*, u.username FROM public_posts p JOIN users u ON u.id = p.user_id WHERE p.id = ? AND p.is_public = 1', args: [postId] })).rows[0];
      if (!post) fail(404, 'POST_NOT_FOUND', 'Bài này đã được gỡ công khai hoặc không tồn tại.');
      const existing = (await tx.execute({ sql: 'SELECT s.id FROM library_sources ls JOIN songs s ON s.id = ls.song_id WHERE ls.user_id = ? AND ls.post_id = ? AND s.user_id = ?', args: [uid, postId, uid] })).rows[0];
      if (existing) { await tx.rollback(); return { alreadySaved: true, songId: existing.id }; }
      const owned = (await tx.execute({ sql: 'SELECT title FROM songs WHERE user_id = ?', args: [uid] })).rows;
      if (owned.length >= maxSongs) fail(409, 'LIBRARY_FULL', 'Thư viện đã đủ 100 bài. Hãy xóa bớt trước khi thêm.');
      const titles = new Set(owned.map(row => row.title)); let title = post.title;
      for (let n = 1; titles.has(title); n++) { const suffix = ` (${n})`; title = post.title.slice(0, 80 - suffix.length) + suffix; }
      const songId = randomUUID();
      await tx.execute({ sql: 'INSERT INTO songs (id, user_id, title, bpm, text, updated_at) VALUES (?, ?, ?, ?, ?, ?)', args: [songId, uid, title, post.bpm, post.text, now()] });
      await tx.execute({ sql: 'INSERT INTO library_sources (song_id, user_id, post_id, username, original_title, composer, source_url) VALUES (?, ?, ?, ?, ?, ?, ?)', args: [songId, uid, postId, post.username, post.title, post.composer, post.source_url] });
      await tx.commit(); return { alreadySaved: false, songId, title };
    } finally { tx.close(); }
  }
  if (action === 'like') {
    const post = await publicPost(id(body.id));
    if (typeof body.active !== 'boolean') fail(400, 'INVALID_STATE', 'Trạng thái thích không hợp lệ.');
    await rateLimit(db, `social:${uid}`, 120, 900);
    if (body.active) await db.execute({ sql: 'INSERT OR IGNORE INTO post_likes VALUES (?, ?)', args: [post.id, uid] });
    else await db.execute({ sql: 'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', args: [post.id, uid] });
    return { active: body.active, count: Number((await db.execute({ sql: 'SELECT COUNT(*) AS n FROM post_likes WHERE post_id = ?', args: [post.id] })).rows[0].n) };
  }
  if (action === 'follow') {
    const target = id(body.userId);
    if (target === uid) fail(400, 'SELF_FOLLOW', 'Bạn không cần theo dõi chính mình.');
    if (typeof body.active !== 'boolean') fail(400, 'INVALID_STATE', 'Trạng thái theo dõi không hợp lệ.');
    if (!(await db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: [target] })).rows.length) fail(404, 'USER_NOT_FOUND', 'Không tìm thấy người dùng.');
    await rateLimit(db, `social:${uid}`, 120, 900);
    if (body.active) await db.execute({ sql: 'INSERT OR IGNORE INTO follows VALUES (?, ?)', args: [uid, target] });
    else await db.execute({ sql: 'DELETE FROM follows WHERE follower_id = ? AND followed_id = ?', args: [uid, target] });
    return { active: body.active };
  }
  if (action === 'comments') {
    const postId = id(req.method === 'GET' ? url.searchParams.get('postId') : body.postId);
    const post = await publicPost(postId);
    if (req.method === 'GET') {
      const start = offset();
      const result = await db.execute({ sql: 'SELECT c.id, c.user_id, c.content, c.created_at, u.username FROM post_comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at, c.id LIMIT 21 OFFSET ?', args: [postId, start] });
      return { comments: result.rows.slice(0, 20).map(row => ({ id: row.id, username: row.username, content: row.content, createdAt: Number(row.created_at), canDelete: row.user_id === uid || post.user_id === uid })), nextOffset: result.rows.length > 20 ? start + 20 : null };
    }
    if (req.method === 'POST') {
      const content = string(body.content, 1000, 'Bình luận');
      if (!content) fail(400, 'EMPTY_COMMENT', 'Hãy nhập bình luận.');
      await rateLimit(db, `comments:${uid}`, 30, 900);
      const result = await db.execute({ sql: 'INSERT INTO post_comments (id, post_id, user_id, content, created_at) SELECT ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM post_comments WHERE post_id = ?) < 500 RETURNING id', args: [randomUUID(), postId, uid, content, now(), postId] });
      if (!result.rows.length) fail(409, 'COMMENTS_FULL', 'Bài này đã đủ 500 bình luận.');
      return { id: result.rows[0].id };
    }
    const result = await db.execute({ sql: 'DELETE FROM post_comments WHERE id = ? AND post_id = ? AND (user_id = ? OR ? = ?)', args: [id(body.id), postId, uid, post.user_id, uid] });
    if (!result.rowsAffected) fail(404, 'COMMENT_NOT_FOUND', 'Không tìm thấy bình luận bạn có quyền xóa.');
    return { deleted: true };
  }
}
module.exports = { community, PUBLIC_ACTIONS, ACTIONS };

// Chỉ tạo bảng/index khi chưa có; không xóa dữ liệu khi redeploy.
module.exports = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at)`,
  `CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    bpm INTEGER NOT NULL CHECK(bpm BETWEEN 50 AND 220),
    text TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, title)
  )`,
  `CREATE INDEX IF NOT EXISTS songs_owner ON songs(user_id)`,
  `CREATE TABLE IF NOT EXISTS auth_limits (
    key_hash TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS auth_limits_expiry ON auth_limits(expires_at)`,
  `CREATE TABLE IF NOT EXISTS public_posts (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, source_song_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL, bpm INTEGER NOT NULL, text TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '', composer TEXT NOT NULL DEFAULT '', source_url TEXT NOT NULL DEFAULT '',
    credit_username TEXT NOT NULL DEFAULT '', is_public INTEGER NOT NULL DEFAULT 1,
    published_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS posts_feed ON public_posts(is_public, published_at DESC, id DESC)`,
  `CREATE INDEX IF NOT EXISTS posts_author ON public_posts(user_id, is_public)`,
  `CREATE TABLE IF NOT EXISTS library_sources (
    song_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, post_id TEXT NOT NULL,
    username TEXT NOT NULL, original_title TEXT NOT NULL,
    composer TEXT NOT NULL DEFAULT '', source_url TEXT NOT NULL DEFAULT '',
    UNIQUE(user_id, post_id)
  )`,
  `CREATE TABLE IF NOT EXISTS post_likes (
    post_id TEXT NOT NULL, user_id TEXT NOT NULL, PRIMARY KEY(post_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL, followed_id TEXT NOT NULL, PRIMARY KEY(follower_id, followed_id),
    CHECK(follower_id <> followed_id)
  )`,
  `CREATE INDEX IF NOT EXISTS follows_target ON follows(followed_id)`,
  `CREATE TABLE IF NOT EXISTS post_comments (
    id TEXT PRIMARY KEY, post_id TEXT NOT NULL, user_id TEXT NOT NULL,
    content TEXT NOT NULL, created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS comments_post ON post_comments(post_id, created_at, id)`
];

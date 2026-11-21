const { getProductionDatabase } = require('../server/db.cjs');
(async () => {
  const database = getProductionDatabase();
  try { await database.ready(); console.log('Turso schema is ready. Existing data is preserved.'); }
  finally { database.close(); }
})().catch(error => { console.error(error.code === 'SETUP_REQUIRED' ? 'Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local first.' : 'Could not initialize Turso. Check the connection and token.'); process.exitCode = 1; });

const { createHandler } = require('../server/handler.cjs');
const { getProductionDatabase } = require('../server/db.cjs');

// Một Function cho toàn bộ API, dùng chung cookie trên cùng tên miền với FE.
module.exports = createHandler({ getDatabase: getProductionDatabase, secureCookies: true });

const { createClient } = require('@libsql/client');
const schema = require('./schema.cjs');

function createDatabase(options) {
  const client = createClient(options);
  let initialized;
  return {
    client,
    async ready() {
      if (!initialized) initialized = client.batch(schema, 'write').catch(error => { initialized = null; throw error; });
      await initialized;
      return client;
    },
    close() { client.close(); }
  };
}

let productionDatabase;
function getProductionDatabase() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken || !/^(libsql|https):\/\//.test(url)) {
    const error = new Error('Database is not configured'); error.code = 'SETUP_REQUIRED'; throw error;
  }
  if (!productionDatabase) productionDatabase = createDatabase({ url, authToken });
  return productionDatabase;
}
module.exports = { createDatabase, getProductionDatabase };

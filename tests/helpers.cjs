const http = require('node:http');
const { createDatabase } = require('../server/db.cjs');
const { createHandler } = require('../server/handler.cjs');

async function startBackend(options = {}) {
  const database = createDatabase({ url: options.databaseUrl || 'file::memory:' });
  const handler = createHandler({ getDatabase: () => database, secureCookies: false, now: options.now });
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const clients = [];
  function client() {
    let cookie = '', uid = null;
    const identity = `192.0.2.${clients.length + 1}`;
    const account = {
      get cookie() { return cookie; },
      set cookie(value) { cookie = value; },
      get uid() { return uid; },
      set uid(value) { uid = value; },
      async raw(action, method = 'GET', body, headers = {}) {
        const response = await fetch(`${origin}/api/account?action=${action}`, {
          method,
          headers: { Origin: origin, Cookie: cookie, ...(uid ? { 'X-Sky-User': uid } : {}), 'X-Forwarded-For': identity, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
          body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
        });
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) cookie = setCookie.split(';')[0];
        const data = await response.json();
        if (data.user) uid = data.user.uid;
        else if ('user' in data && !data.user) uid = null;
        return { status: response.status, headers: response.headers, data };
      },
      // Adapter để FE jsdom gửi qua HTTP thật, cookie do test jar quản lý.
      async browserFetch(url, options = {}) {
        const parsed = new URL(url);
        const response = await fetch(origin + parsed.pathname + parsed.search, {
          ...options,
          headers: { Origin: origin, Cookie: cookie, 'X-Forwarded-For': identity, ...options.headers }
        });
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) cookie = setCookie.split(';')[0];
        return response;
      }
    };
    clients.push(account); return account;
  }
  return {
    database, server, origin, client,
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); database.close(); }
  };
}
module.exports = { startBackend };

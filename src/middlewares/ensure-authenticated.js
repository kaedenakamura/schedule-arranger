const { createMiddleware } = require('hono/factory');

// ensure-authenticated.js
function ensureAuthenticated() {
  return createMiddleware (async (c, next) => {
    const session = c.get('session');
    if (!session?.user) {
      // c.unauthorized() の代わりに 401 を返す
      return c.redirect('/login?from=' + c.req.path);
      // または JSON で返す場合
      // return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  });
}

module.exports = ensureAuthenticated;

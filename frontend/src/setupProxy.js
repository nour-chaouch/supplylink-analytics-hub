const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Disable CSP headers for development
  app.use((req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Content-Security-Policy');
    res.removeHeader('X-WebKit-CSP');
    next();
  });

  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false
    })
  );
};

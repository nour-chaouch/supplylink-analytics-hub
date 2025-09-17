const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Disable CSP headers for development
  app.use((req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Content-Security-Policy');
    res.removeHeader('X-WebKit-CSP');
    next();
  });

  // Proxy API requests to backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        res.status(500).json({ 
          error: 'Proxy error', 
          message: 'Backend server may not be running on port 5001' 
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.url} -> http://localhost:5001${req.url}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[PROXY] ${proxyRes.statusCode} ${req.method} ${req.url}`);
      }
    })
  );
};

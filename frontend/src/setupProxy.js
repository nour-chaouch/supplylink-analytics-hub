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
      target: 'http://localhost:5002',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        console.error('Error code:', err.code);
        console.error('Full error:', err);
        
        // Provide more helpful error messages based on error type
        let           errorMessage = 'Backend server may not be running on port 5002';
        if (err.code === 'ECONNREFUSED') {
          errorMessage = 'Connection refused - Backend server is not running on port 5002. Please start it with: cd backend && npm start';
        } else if (err.code === 'ETIMEDOUT') {
          errorMessage = 'Connection timeout - Backend server may be slow to respond or not running';
        } else if (err.code === 'ENOTFOUND') {
          errorMessage = 'Cannot resolve localhost - Network configuration issue';
        }
        
        res.status(503).json({ 
          error: 'Proxy error', 
          message: errorMessage,
          code: err.code,
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.url} -> http://localhost:5002${req.url}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[PROXY] ${proxyRes.statusCode} ${req.method} ${req.url}`);
      }
    })
  );
};

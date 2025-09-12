const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🚀 setupProxy.js loaded successfully!');
  
  // Прокси для MinIO API запросов (скачивание файлов)
  app.use(
    '/api/minio',
    createProxyMiddleware({
      target: 'https://host.docker.internal:9000',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying MinIO API request:', req.method, req.url);
        console.log('🎯 Target path:', proxyReq.path);
        console.log('🔗 Full target URL:', `'https://host.docker.internal:9000'${proxyReq.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ MinIO API response status:', proxyRes.statusCode);
        // Добавляем CORS заголовки для файлов
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      },
      onError: (err, req, res) => {
        console.error('❌ MinIO API proxy error:', err.message);
        console.error('❌ Request URL:', req.url);
        console.error('❌ Target:', 'https://host.docker.internal:9000');
        res.status(500).json({ 
          error: 'MinIO API proxy error', 
          message: err.message,
          path: req.url 
        });
      }
    })
  );

  // Прокси для файлов API запросов (скачивание обычных файлов)
  app.use(
    '/api/files',
    createProxyMiddleware({
      target: 'https://host.docker.internal:9000',
      changeOrigin: true,
      secure: false,
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying files API request:', req.method, req.url);
        console.log('🎯 Target:', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Files API response status:', proxyRes.statusCode);
        // Добавляем CORS заголовки для файлов
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      },
      onError: (err, req, res) => {
        console.error('❌ Files API proxy error:', err.message);
        res.status(500).json({ 
          error: 'Files API proxy error', 
          message: err.message,
          path: req.url 
        });
      }
    })
  );

  // Прокси для остальных API запросов
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://host.docker.internal:9000',
      changeOrigin: true,
      secure: false,
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying general API request:', req.method, req.url);
        console.log('🎯 Target path:', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ General API response status:', proxyRes.statusCode);
      }
    })
  );

  // Прокси для MinIO файлов (если нужно)
  app.use(
    '/minio',
    createProxyMiddleware({
      target: 'https://host.docker.internal:9000',
      changeOrigin: true,
      secure: false,
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxying MinIO file request:', req.method, req.url);
        console.log('🎯 Target path:', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ MinIO file response status:', proxyRes.statusCode);
      }
    })
  );
}; 
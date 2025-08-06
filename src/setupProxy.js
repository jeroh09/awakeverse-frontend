// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000', // Your Flask backend
      changeOrigin: true,
      secure: false,
      headers: {
        Connection: 'keep-alive'
      }
    })
  );
};
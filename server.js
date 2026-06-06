'use strict';

require('dotenv').config();

const http = require('http');
const app  = require('./src/app');
const { initWebSocket } = require('./src/websocket/ws.server');
const logger = require('./src/config/logger');
const { startNotificationsCron } = require('./src/modules/notifications/notifications.engine');

const PORT = process.env.PORT || 4000;

// ── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer(app);

// ── WebSocket ────────────────────────────────────────────────────────────────
initWebSocket(server);

// ── Background Jobs ──────────────────────────────────────────────────────────
startNotificationsCron();

// ── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`🚀 Memar API running on port ${PORT} [${process.env.NODE_ENV}]`);
  logger.info(`📡 API Base: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
});

// ── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

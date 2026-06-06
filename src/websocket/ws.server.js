'use strict';

const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
const logger     = require('../config/logger');

let io;

// Active user → socket mapping
const userSockets = new Map(); // userId → Set<socketId>

function initWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Missing auth token'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { userId } = socket;
    logger.info(`[WS] User connected: ${userId} (${socket.id})`);

    // Track socket per user
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // Auto-join personal room
    socket.join(`user:${userId}`);

    // ── Channel rooms ───────────────────────────────────────────────────────
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      logger.debug(`[WS] ${userId} joined project room: ${projectId}`);
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('join:channel', (channelId) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on('leave:channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    // ── Chat messages ────────────────────────────────────────────────────────
    socket.on('chat:message', (payload) => {
      // payload: { channelId, message }
      io.to(`channel:${payload.channelId}`).emit('message.new', {
        ...payload.message,
        sender_id: userId,
        created_at: new Date().toISOString(),
      });
    });

    socket.on('chat:typing', (payload) => {
      socket.to(`channel:${payload.channelId}`).emit('user.typing', {
        userId,
        channelId: payload.channelId,
      });
    });

    // ── Disconnect cleanup ────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
      logger.info(`[WS] User disconnected: ${userId} — ${reason}`);
    });
  });

  logger.info('✅ WebSocket server initialized');
  return io;
}

// ── Emit helpers (called from services) ──────────────────────────────────────

/**
 * Emit event to a specific user (all their sockets)
 */
function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit event to all members of a project room
 */
function emitToProject(projectId, event, data) {
  if (!io) return;
  io.to(`project:${projectId}`).emit(event, data);
}

/**
 * Emit event to all members of a chat channel
 */
function emitToChannel(channelId, event, data) {
  if (!io) return;
  io.to(`channel:${channelId}`).emit(event, data);
}

/**
 * Broadcast to all connected sockets (admin announcements)
 */
function broadcast(event, data) {
  if (!io) return;
  io.emit(event, data);
}

/**
 * Check if a user is currently online
 */
function isOnline(userId) {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
}

module.exports = { initWebSocket, emitToUser, emitToProject, emitToChannel, broadcast, isOnline };

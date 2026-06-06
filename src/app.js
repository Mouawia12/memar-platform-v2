'use strict';

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const compression = require('compression');
const morgan     = require('morgan');

const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { apiRateLimiter } = require('./middleware/rateLimiter');

// ── Route modules ─────────────────────────────────────────────────────────────
const authRoutes          = require('./modules/auth/auth.routes');
const usersRoutes         = require('./modules/users/users.routes');
const rolesRoutes         = require('./modules/roles/roles.routes');
const projectsRoutes      = require('./modules/projects/projects.routes');
const tasksRoutes         = require('./modules/tasks/tasks.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const filesRoutes         = require('./modules/files/files.routes');
const calendarRoutes      = require('./modules/calendar/calendar.routes');
const appointmentsRoutes  = require('./modules/appointments/appointments.routes');
const auditRoutes         = require('./modules/audit/audit.routes');
const chatbotRoutes       = require('./modules/chatbot/chatbot.routes');

const app = express();
const API = `/api/${process.env.API_VERSION || 'v1'}`;

// ── Security & Parsing ───────────────────────────────────────────────────────
// ── Security ──────────────────────────────────────────────────────────────────
// CSP disabled for ERP frontend compatibility (inline handlers + local scripts)
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept-Language', 'X-Request-ID'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => require('./config/logger').http(msg.trim()) } }));
app.use(requestLogger);

// ── Static Files ─────────────────────────────────────────────────────────────
const path = require('path');
app.use('/erp',    express.static(path.join(__dirname, '../erp')));
app.use('/portal', express.static(path.join(__dirname, '../portal')));
app.use('/shared', express.static(path.join(__dirname, '../shared')));
app.use('/',       express.static(path.join(__dirname, '../website')));


app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'memar-api', ts: new Date().toISOString() });
});

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use(API, apiRateLimiter);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/users`,         usersRoutes);
app.use(`${API}/roles`,         rolesRoutes);
app.use(`${API}/projects`,      projectsRoutes);
app.use(`${API}/tasks`,         tasksRoutes);
app.use(`${API}/notifications`, notificationsRoutes);
app.use(`${API}/files`,         filesRoutes);
app.use(`${API}/calendar`,      calendarRoutes);
app.use(`${API}/appointments`,  appointmentsRoutes);
app.use(`${API}/audit`,         auditRoutes);
app.use(`${API}/chatbot`,       chatbotRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', data: null });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;

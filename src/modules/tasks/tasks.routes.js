'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../../middleware/rbac');
const { PERMISSIONS: P } = require('../../config/permissions');
const svc = require('./tasks.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../utils/response');

const router = Router();
router.use(authenticate);

const wrap = fn => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };

router.get('/board',                requireAnyPermission(P.TASKS_VIEW_ALL, P.TASKS_VIEW_OWN), wrap(async (req, res) => {
  sendSuccess(res, await svc.getBoard({ projectId: req.query.project_id, userId: req.user.id, userPermissions: req.user.permissions }));
}));

router.get('/',                     requireAnyPermission(P.TASKS_VIEW_ALL, P.TASKS_VIEW_OWN), wrap(async (req, res) => {
  const r = await svc.listTasks({ query: req.query, userId: req.user.id, userRole: req.user.role, userPermissions: req.user.permissions });
  sendPaginated(res, r.data, r.total, r.page, r.limit);
}));

router.get('/:id',                  requireAnyPermission(P.TASKS_VIEW_ALL, P.TASKS_VIEW_OWN), wrap(async (req, res) => {
  sendSuccess(res, await svc.getTaskById(req.params.id));
}));

router.post('/',                    requirePermission(P.TASKS_CREATE), wrap(async (req, res) => {
  sendCreated(res, await svc.createTask({ body: req.body, requesterId: req.user.id }));
}));

router.patch('/:id',                requirePermission(P.TASKS_EDIT), wrap(async (req, res) => {
  sendSuccess(res, await svc.updateTask({ id: req.params.id, body: req.body, requesterId: req.user.id }), 'Updated');
}));

router.delete('/:id',               requirePermission(P.TASKS_DELETE), wrap(async (req, res) => {
  await svc.deleteTask({ id: req.params.id, requesterId: req.user.id });
  sendSuccess(res, null, 'Deleted');
}));

// Time logging
router.post('/:id/time-log/start',  requireAnyPermission(P.TASKS_VIEW_ALL, P.TASKS_VIEW_OWN), wrap(async (req, res) => {
  sendCreated(res, await svc.startTimeLog({ taskId: req.params.id, userId: req.user.id, notes: req.body.notes }));
}));

router.post('/:id/time-log/stop',   requireAnyPermission(P.TASKS_VIEW_ALL, P.TASKS_VIEW_OWN), wrap(async (req, res) => {
  sendSuccess(res, await svc.stopTimeLog({ taskId: req.params.id, userId: req.user.id }), 'Time log saved');
}));

router.get('/:id/time-log',         requireAnyPermission(P.TASKS_VIEW_ALL, P.TASKS_VIEW_OWN), wrap(async (req, res) => {
  sendSuccess(res, await svc.getTimeLogs(req.params.id));
}));

module.exports = router;

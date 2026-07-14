'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { PERMISSIONS: P } = require('../../config/permissions');
const svc = require('./appointments.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../../utils/response');

const router = Router();
router.use(authenticate);
const wrap = fn => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };

router.get('/', requirePermission(P.APPOINTMENTS_VIEW), wrap(async (req, res) => {
  const r = await svc.listAppointments({ query: req.query, userId: req.user.id, userRole: req.user.role, userPermissions: req.user.permissions });
  sendPaginated(res, r.data, r.total, r.page, r.limit);
}));

router.get('/:id', requirePermission(P.APPOINTMENTS_VIEW), wrap(async (req, res) => {
  sendSuccess(res, await svc.getAppointmentById(req.params.id));
}));

router.post('/', requirePermission(P.APPOINTMENTS_CREATE), wrap(async (req, res) => {
  sendCreated(res, await svc.createAppointment({ body: req.body, requesterId: req.user.id }));
}));

router.patch('/:id', requirePermission(P.APPOINTMENTS_MANAGE), wrap(async (req, res) => {
  sendSuccess(res, await svc.updateAppointment({ id: req.params.id, body: req.body, requesterId: req.user.id }), 'Updated');
}));

router.delete('/:id', requirePermission(P.APPOINTMENTS_MANAGE), wrap(async (req, res) => {
  await svc.cancelAppointment({ id: req.params.id, requesterId: req.user.id });
  sendSuccess(res, null, 'Appointment cancelled');
}));

// RSVP
router.post('/:id/respond', requirePermission(P.APPOINTMENTS_VIEW), wrap(async (req, res) => {
  await svc.respondToInvite({ appointmentId: req.params.id, userId: req.user.id, status: req.body.status });
  sendSuccess(res, null, 'Response recorded');
}));

// Join virtual room
router.post('/:id/join', requirePermission(P.APPOINTMENTS_VIEW), wrap(async (req, res) => {
  sendSuccess(res, await svc.joinAppointment({ appointmentId: req.params.id, userId: req.user.id }));
}));

module.exports = router;

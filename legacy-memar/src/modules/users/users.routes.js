'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { PERMISSIONS: P } = require('../../config/permissions');
const ctrl = require('./users.controller');

const router = Router();
router.use(authenticate);

router.get('/',                      requirePermission(P.USERS_VIEW),   ctrl.list);
router.get('/:id',                   requirePermission(P.USERS_VIEW),   ctrl.getOne);
router.post('/',                     requirePermission(P.USERS_CREATE),  ctrl.create);
router.patch('/:id',                 requirePermission(P.USERS_EDIT),    ctrl.update);
router.delete('/:id',                requirePermission(P.USERS_DELETE),  ctrl.remove);
router.post('/:id/roles',            requirePermission(P.ROLES_MANAGE),  ctrl.addRole);
router.delete('/:id/roles/:roleId',  requirePermission(P.ROLES_MANAGE),  ctrl.delRole);

module.exports = router;

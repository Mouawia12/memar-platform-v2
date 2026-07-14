'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authRateLimiter } = require('../../middleware/rateLimiter');
const ctrl = require('./auth.controller');

const router = Router();

router.post('/login',    authRateLimiter, ctrl.login);
router.post('/refresh',  authRateLimiter, ctrl.refresh);
router.post('/logout',   authenticate, ctrl.logout);
router.get('/me',        authenticate, ctrl.me);
// PATCH /me — update own profile (implemented in next sprint)
// router.patch('/me', authenticate, ctrl.updateMe);

module.exports = router;

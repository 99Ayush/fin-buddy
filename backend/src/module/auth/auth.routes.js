'use strict';

const { Router }      = require('express');
const controller      = require('./auth.controller');
const { requireAuth } = require('./auth.middleware');

const router = Router();

// Public routes
router.post('/register', controller.register);
router.post('/login',    controller.login);

// Protected routes
router.get('/me',       requireAuth, controller.me);
router.post('/logout',  requireAuth, controller.logout);

module.exports = router;

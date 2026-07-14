'use strict';

const express = require('express');
const router = express.Router();
const chatbotController = require('./chatbot.controller');

// POST /api/v1/chatbot/chat
router.post('/chat', chatbotController.handleChat);

module.exports = router;

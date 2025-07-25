const express = require('express');
const router = express.Router();
const chatController = require('../Controllers/chatController');

router.get('/', chatController.getChats);
router.get('/:chatId/messages', chatController.getMessages);
router.post('/', chatController.createChat);
router.post('/:chatId/messages', chatController.sendMessage);

module.exports = router; 
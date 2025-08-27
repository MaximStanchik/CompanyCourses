const express = require('express');
const router = express.Router();
const reactionController = require('../Controllers/reactionController');

router.get('/message/:messageId', reactionController.getReactions);
router.post('/toggle', reactionController.toggleReaction);
router.post('/comment-reaction', reactionController.addCommentReaction);

module.exports = router; 
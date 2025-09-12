const Router = require("express");
const router = new Router();
const notificationController = require("../Controllers/notificationController");
const NotificationService = require('../utils/notificationService');

router.get("/notifications", notificationController.getAllNotifications);
router.get("/notifications/user/:userId", notificationController.getUserNotifications);
router.put("/notifications/:id/read", notificationController.markAsRead);
router.put("/notifications/user/:userId/read-all", notificationController.markAllAsRead);
router.get("/notifications/user/:userId/unread-count", notificationController.getUnreadCount);

router.post("/test-notification", async (req, res) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;
    const notification = await NotificationService.createNotification(userId, title, message, type);
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;

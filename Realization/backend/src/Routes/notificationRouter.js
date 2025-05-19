const Router = require("express");
const router = new Router();
const notificationController = require("../Controllers/notificationController");

router.get("/notifications", notificationController.getAllNotifications);

module.exports = router;

const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const DbClient = new PrismaClient();

class notificationController {
  async getAllNotifications(req, res) {
    try {
      const notifications = await DbClient.notification.findMany({
        select: {
          id: true,
          date: true,
          content: true,
          // Добавляем поле "Course" и внутри него выбираем поле "name"
          course: {
            select: {
              name: true,
            },
          },
        },
      });
      return res.send(notifications);
    } catch (err) {
      console.log(err);
      res.status(400).send({ message: "Notifications error" });
    }
  }
}

module.exports = new notificationController();

const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const DbClient = new PrismaClient();

class notificationController {
  async getAllNotifications(req, res) {
    try {
      const notifications = await DbClient.notification.findMany({
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          read: true,
          createdAt: true,
          course: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      return res.send(notifications);
    } catch (err) {
      console.log(err);
      res.status(400).send({ message: "Notifications error" });
    }
  }

  async getUserNotifications(req, res) {
    try {
      const { userId } = req.params;
      
      // Получаем уведомления для конкретного пользователя
      const notifications = await DbClient.notification.findMany({
        where: {
          userId: Number(userId)
        },
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          read: true,
          createdAt: true,
          course: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(notifications);
    } catch (err) {
      console.log('Error getting user notifications:', err);
      res.status(400).send({ message: "Error getting user notifications" });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      
      // Обновляем уведомление как прочитанное
      const updatedNotification = await DbClient.notification.update({
        where: { id: Number(id) },
        data: {
          read: true
        }
      });

      res.json({ message: 'Notification marked as read', notification: updatedNotification });
    } catch (err) {
      console.log('Error marking notification as read:', err);
      res.status(400).send({ message: "Error marking notification as read" });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const { userId } = req.params;
      
      // Отмечаем все уведомления пользователя как прочитанные
      const updatedNotifications = await DbClient.notification.updateMany({
        where: { 
          userId: Number(userId),
          read: false
        },
        data: {
          read: true
        }
      });

      res.json({ 
        message: 'All notifications marked as read', 
        updatedCount: updatedNotifications.count 
      });
    } catch (err) {
      console.log('Error marking all notifications as read:', err);
      res.status(400).send({ message: "Error marking all notifications as read" });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const { userId } = req.params;
      
      // Получаем количество непрочитанных уведомлений
      const count = await DbClient.notification.count({
        where: {
          userId: Number(userId),
          read: false
        }
      });

      res.json({ unreadCount: count });
    } catch (err) {
      console.log('Error getting unread count:', err);
      res.status(400).send({ message: "Error getting unread count" });
    }
  }
}

module.exports = new notificationController();

const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();

class NotificationService {
  // Создать уведомление для одного пользователя
  static async createNotification(userId, title, message, type = 'info', courseId = null) {
    try {
      const notification = await DbClient.notification.create({
        data: {
          userId: userId,
          title: title,
          message: message,
          type: type,
          courseId: courseId
        }
      });
      console.log(`Уведомление создано для пользователя ${userId}: ${title}`);
      return notification;
    } catch (error) {
      console.error('Ошибка при создании уведомления:', error);
      throw error;
    }
  }

  // Создать уведомления для всех пользователей курса
  static async createNotificationForCourseUsers(courseId, title, message, type = 'info') {
    try {
      // Получаем всех пользователей, записанных на курс
      const enrollments = await DbClient.enrollment.findMany({
        where: { course_id: courseId },
        include: { User: true }
      });

      const notifications = [];
      for (const enrollment of enrollments) {
        if (enrollment.User) {
          const notification = await this.createNotification(
            enrollment.User.id,
            title,
            message,
            type,
            courseId
          );
          notifications.push(notification);
        }
      }

      console.log(`Создано ${notifications.length} уведомлений для курса ${courseId}`);
      return notifications;
    } catch (error) {
      console.error('Ошибка при создании уведомлений для пользователей курса:', error);
      throw error;
    }
  }

  // Создать уведомления для всех пользователей системы
  static async createNotificationForAllUsers(title, message, type = 'info') {
    try {
      const users = await DbClient.user.findMany({
        where: { role: 'USER' }
      });

      const notifications = [];
      for (const user of users) {
        const notification = await this.createNotification(
          user.id,
          title,
          message,
          type
        );
        notifications.push(notification);
      }

      console.log(`Создано ${notifications.length} уведомлений для всех пользователей`);
      return notifications;
    } catch (error) {
      console.error('Ошибка при создании уведомлений для всех пользователей:', error);
      throw error;
    }
  }

  // Уведомления для конкретных действий админа
  static async notifyProfileUpdated(userId, adminName) {
    return await this.createNotification(
      userId,
      'Профиль обновлен',
      `Администратор ${adminName} обновил ваш профиль. Проверьте изменения в разделе "Профиль".`,
      'info'
    );
  }

  static async notifyCourseModuleUpdated(courseId, moduleName, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Модуль курса обновлен',
      `Администратор ${adminName} обновил модуль "${moduleName}". Проверьте изменения в курсе.`,
      'info',
      courseId
    );
  }

  static async notifyCourseLessonUpdated(courseId, lessonName, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Урок курса обновлен',
      `Администратор ${adminName} обновил урок "${lessonName}". Проверьте изменения в курсе.`,
      'info',
      courseId
    );
  }

  static async notifyCourseModuleAdded(courseId, moduleName, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Новый модуль добавлен',
      `Администратор ${adminName} добавил новый модуль "${moduleName}" в курс.`,
      'success',
      courseId
    );
  }

  static async notifyCourseLessonAdded(courseId, lessonName, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Новый урок добавлен',
      `Администратор ${adminName} добавил новый урок "${lessonName}" в курс.`,
      'success',
      courseId
    );
  }

  static async notifyUserEnrolled(userId, courseName, adminName) {
    return await this.createNotification(
      userId,
      'Запись на курс',
      `Администратор ${adminName} записал вас на курс "${courseName}".`,
      'success'
    );
  }

  static async notifyUserUnenrolled(userId, courseName, adminName) {
    return await this.createNotification(
      userId,
      'Отчисление с курса',
      `Администратор ${adminName} отчислил вас с курса "${courseName}".`,
      'warning'
    );
  }

  static async notifyCourseContentUpdated(courseId, courseName, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Курс обновлен',
      `Администратор ${adminName} внес изменения в курс "${courseName}". Проверьте обновления.`,
      'info',
      courseId
    );
  }

  // Новые методы для уведомлений об изменениях в курсах
  static async notifyModuleAdded(courseId, moduleName, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Добавлен новый модуль',
      `В курс добавлен новый модуль "${moduleName}".`,
      'success',
      courseId
    );
  }

  static async notifyModuleDeleted(courseId, moduleName, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Модуль удален',
      `Модуль "${moduleName}" был удален из курса.`,
      'warning',
      courseId
    );
  }

  static async notifyModuleModified(courseId, moduleName, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Модуль изменен',
      `Модуль "${moduleName}" был изменен.`,
      'info',
      courseId
    );
  }

  static async notifyLessonAdded(courseId, lessonName, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Добавлен новый урок',
      `В курс добавлен новый урок "${lessonName}".`,
      'success',
      courseId
    );
  }

  static async notifyLessonDeleted(courseId, lessonName, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Урок удален',
      `Урок "${lessonName}" был удален из курса.`,
      'warning',
      courseId
    );
  }

  static async notifyLessonModified(courseId, lessonName, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Урок изменен',
      `Урок "${lessonName}" был изменен.`,
      'info',
      courseId
    );
  }

  static async notifyStepModified(courseId, lessonName, stepTitle, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Шаг урока изменен',
      `В уроке "${lessonName}" был изменен шаг "${stepTitle}".`,
      'info',
      courseId
    );
  }

  static async notifyStepAdded(courseId, lessonName, stepTitle, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Добавлен новый шаг',
      `В урок "${lessonName}" добавлен новый шаг "${stepTitle}".`,
      'success',
      courseId
    );
  }

  static async notifyStepDeleted(courseId, lessonName, stepTitle, adminName) {
    return await this.createNotificationForCourseUsers(
      courseId,
      'Шаг удален',
      `Из урока "${lessonName}" был удален шаг "${stepTitle}".`,
      'warning',
      courseId
    );
  }
}

module.exports = NotificationService; 
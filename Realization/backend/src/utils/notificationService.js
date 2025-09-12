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

  // Создать уведомления для всех пользователей курса с переводами
  static async createNotificationForCourseUsers(courseId, title, message, type = 'info', lang = 'en') {
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

  // Создать уведомления для всех пользователей курса с ключами переводов
  static async createNotificationForCourseUsers(courseId, translationKey, message, type = 'info') {
    try {
      console.log(`=== СОЗДАНИЕ УВЕДОМЛЕНИЙ С КЛЮЧАМИ ПЕРЕВОДОВ ===`);
      console.log(`Курс ID: ${courseId}, Ключ перевода: ${translationKey}`);
      
      // Получаем всех пользователей, записанных на курс
      const enrollments = await DbClient.enrollment.findMany({
        where: { course_id: courseId },
        include: { User: true }
      });

      console.log(`Найдено ${enrollments.length} записей на курс`);

      const notifications = [];
      for (const enrollment of enrollments) {
        if (enrollment.User) {
          console.log(`\n--- Обработка пользователя ${enrollment.User.id} (${enrollment.User.username}) ---`);
          
          // Создаем уведомление с ключом перевода в заголовке
          const notification = await this.createNotification(
            enrollment.User.id,
            translationKey, // Используем ключ перевода как заголовок
            message, // Используем оригинальное сообщение как fallback
            type,
            courseId
          );
          notifications.push(notification);
          
          console.log(`✅ Уведомление создано для пользователя ${enrollment.User.id} с ключом ${translationKey}`);
        }
      }

      console.log(`\n=== ИТОГО: Создано ${notifications.length} уведомлений для курса ${courseId} ===`);
      return notifications;
    } catch (error) {
      console.error('❌ Ошибка при создании уведомлений для пользователей курса:', error);
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
  static async notifyModuleAdded(courseId, moduleName, adminName, lang = 'en') {
    return await this.createNotificationForCourseUsers(
      courseId,
      'module_added',
      `В курс добавлен новый модуль "${moduleName}".`,
      'success'
    );
  }

  static async notifyModuleDeleted(courseId, moduleName, adminName, lang = 'en') {
    return await this.createNotificationForCourseUsers(
      courseId,
      'module_deleted',
      `Модуль "${moduleName}" был удален из курса.`,
      'warning'
    );
  }

  static async notifyModuleModified(courseId, moduleName, adminName, lang = 'en') {
    return await this.createNotificationForCourseUsers(
      courseId,
      'module_modified',
      `Модуль "${moduleName}" был изменен.`,
      'info'
    );
  }

  static async notifyLessonAdded(courseId, lessonName, adminName, lang = 'en') {
    return await this.createNotificationForCourseUsers(
      courseId,
      'lesson_added',
      `В курс добавлен новый урок "${lessonName}".`,
      'success'
    );
  }

  static async notifyLessonDeleted(courseId, lessonName, adminName, lang = 'en') {
    return await this.createNotificationForCourseUsers(
      courseId,
      'lesson_deleted',
      `Урок "${lessonName}" был удален из курса.`,
      'warning'
    );
  }

  static async notifyLessonModified(courseId, lessonName, adminName, lang = 'en') {
    return await this.createNotificationForCourseUsers(
      courseId,
      'lesson_modified',
      `Урок "${lessonName}" был изменен.`,
      'info'
    );
  }

  static async notifyStepModified(courseId, lessonName, stepTitle, adminName, lang = 'en') {
    return await this.createNotificationForCourseUsers(
      courseId,
      'step_modified',
      `В уроке "${lessonName}" был изменен шаг "${stepTitle}".`,
      'info'
    );
  }

  static async notifyStepAdded(courseId, lessonName, stepTitle, adminName, lang = 'en') {
    return await this.createNotificationForCourseUsers(
      courseId,
      'step_added',
      `В урок "${lessonName}" добавлен новый шаг "${stepTitle}".`,
      'success'
    );
  }

  static async notifyStepDeleted(courseId, lessonName, stepTitle, adminName, lang = 'en') {
    return await this.createNotificationForCourseUsers(
      courseId,
      'step_deleted',
      `Из урока "${lessonName}" был удален шаг "${stepTitle}".`,
      'warning'
    );
  }
}

module.exports = NotificationService; 
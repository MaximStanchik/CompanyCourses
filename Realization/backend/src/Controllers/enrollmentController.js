const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const jwt = require("jsonwebtoken");
const NotificationService = require('../utils/notificationService');

class enrollmentController {
  async getEnrollmentByStudent(req, res) {
    console.log('=== getEnrollmentByStudent вызван ===');
    console.log('Query params:', req.query);
    console.log('User ID from query:', req.query.id);
    
    const authorizationHeader = req.headers.authorization;
    if (authorizationHeader) {
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length === 2) {
        const token = tokenArray[1];
        let decodedToken;
        try {
          decodedToken = jwt.verify(token, process.env.SECRET);
          console.log('Decoded token:', decodedToken);
        } catch (err) {
          console.log('Token verification failed:', err);
          return res.status(401).json({ message: "Invalid token" });
        }
        const id = decodedToken.id;
        console.log('User ID from token:', id);

        const enrollments = await DbClient.enrollment.findMany({
          where: {
            User: {
              id: parseInt(req.query.id), // Преобразуем id в число, если это необходимо
            },
          },
          select: {
            id: true,
            approved: true,
            progress: true,
            course_id: true,
            user_id: true,
            Course: {
              select: {
                id: true,
                name: true,
                status: true,
                description: true,
                logoUrl: true,
                introUrl: true,
                level: true,
                workload: true,
                shortDescription: true,
                language: true,
                Category: {
                  select: {
                    id: true,
                    name: true,
                    nameEn: true,
                    nameRu: true
                  }
                },
                courseCategories: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        name: true,
                        nameEn: true,
                        nameRu: true
                      }
                    }
                  }
                },
                _count: {
                  select: { enrollments: true }
                }
              }
            },
            User: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          },
        });
        
        // Добавляем поле categories для совместимости с CourseCatalog
        const enrollmentsWithCategories = enrollments.map(enrollment => {
          const course = enrollment.Course;
          if (course) {
            // Создаем массив категорий как в getPublicCourses
            const categories = [];
            if (course.Category) {
              categories.push(course.Category);
            }
            if (course.courseCategories && Array.isArray(course.courseCategories)) {
              course.courseCategories.forEach(cc => {
                if (cc.category && !categories.find(c => c.id === cc.category.id)) {
                  categories.push(cc.category);
                }
              });
            }
            course.categories = categories;
          }
          return enrollment;
        });
        
        console.log('Найденные записи:', enrollmentsWithCategories);
        console.log('Количество записей:', enrollmentsWithCategories.length);
        
        res.json(enrollmentsWithCategories);
      }
    }
    console.log('=== getEnrollmentByStudent завершен ===');
  }
  catch(err) {
    res.status(500).json(err);
  }

  async getAllEnrollments(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (authorizationHeader) {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
          const roles = decodedToken.roles;
          if (!roles.includes("ADMIN")) {
            return res.status(403).json("You don't have enough rights");
          }
          const enrollments = await DbClient.enrollment.findMany({
            select: {
              id: true,
              approved: true,
              progress: true,
              User: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                },
              },
              Course: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          });
          return res.json(enrollments);
        }
      }
      return res.status(401).json({ message: "Missing authorization token" });
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Enrollments error" });
    }
  }

  async checkEnrollment(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      let id; // Объявляем переменную id
      if (authorizationHeader) {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
          id = decodedToken.id;
        } else {
          console.error("Invalid Authorization header format");
        }
        const user = await DbClient.user.findFirst({
          where: {
            id: id,
          },
        });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const enrollment = await DbClient.enrollment.findFirst({
          where: {
            user_id: id, // здесь я должен передавать полученный id из токена в req.query
            course_id: Number(req.query.courseid) || 0,
          },
          include: {
            Course: {
              select: {
                name: true,
              },
            },
          },
        });
        res.json(enrollment);
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }

  async addEnrollment(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (authorizationHeader) {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
          const roles = decodedToken.roles;
          if (!roles.includes("ADMIN")) {
            return res.status(403).json("You don't have enough rights");
          }
          // Проверяем наличие тела запроса
          if (Object.keys(req.body).length === 0) {
            return res.status(400).send("request body is missing");
          }
          // Используем Prisma для поиска пользователя и курса по имени
          const student = await DbClient.user.findFirst({
            where: {
              email: req.body.student,
            },
          });

          const course = await DbClient.course.findFirst({
            where: {
              name: req.body.course,
            },
          });

          if (!student || !course) {
            return res.status(404).send("Student or Course not found");
          }

          // Проверяем наличие записи Enrollment с такими же значениями user_id и course_id
          const existingEnrollment = await DbClient.enrollment.findFirst({
            where: {
              user_id: student.id,
              course_id: course.id,
            },
          });

          if (existingEnrollment) {
            return res.status(409).send("User already enrolled in this course");
          }

          // Создаем новую запись Enrollment
          console.log('Создаем запись с данными:', {
            user_id: student.id,
            course_id: course.id,
            approved: true
          });
          
          const enrollment = await DbClient.enrollment.create({
            data: {
              user_id: student.id, // Используем найденный id студента
              course_id: course.id, // Используем найденный id курса
              approved: true, // Автоматически одобряем записи через админку
            },
          });
          
          // Отправляем уведомление пользователю
          try {
            const adminUser = await DbClient.user.findUnique({ where: { id: decodedToken.id } });
            await NotificationService.notifyUserEnrolled(student.id, course.name, adminUser.username || 'Администратор');
          } catch (notificationError) {
            console.error('Ошибка при отправке уведомления:', notificationError);
            // Не прерываем выполнение, если уведомление не отправилось
          }
          
          console.log('Запись создана:', enrollment);
          res.status(200).json(enrollment);
        }
      }
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }

  async addEnrollmentByStudent(req, res) {
    // Проверяем наличие тела запроса
    if (!req.body) {
      return res.status(400).send("request body is missing");
    }
    try {
      const authorizationHeader = req.headers.authorization;
      let id;
      if (authorizationHeader) {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
          id = decodedToken.id;
        } else {
          console.error("Invalid Authorization header format");
        }
        const user = await DbClient.user.findFirst({
          where: {
            id: id,
          },
        });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        if (user.role !== "USER") {
          return res.status(403).json("Only students can enroll in courses");
        }

        // Get course ID from either params or body
        const courseId = req.params.courseId || req.body.courseId;
        if (!courseId) {
          return res.status(400).json({ error: "Course ID is required" });
        }

        // Check if course exists and is published
        const course = await DbClient.course.findFirst({
          where: {
            id: Number(courseId),
          },
        });

        if (!course) {
          return res.status(404).json({ error: "Course not found" });
        }

        // Check if course is published (status should be 'published')
        if (course.status !== 'published') {
          return res.status(403).json({ error: "Course is not available for enrollment" });
        }

        // Check if user is already enrolled
        const existingEnrollment = await DbClient.enrollment.findFirst({
          where: {
            user_id: user.id,
            course_id: Number(courseId),
          },
        });

        if (existingEnrollment) {
          return res.status(409).json({ error: "User already enrolled in this course" });
        }

        // Determine if enrollment should be automatically approved
        // For now, we'll make it automatic, but this could be configurable per course
        const autoApprove = true; // This could be a course setting in the future

        // Создаем новую запись Enrollment
        const enrollment = await DbClient.enrollment.create({
          data: {
            User: { connect: { id: Number(user.id) } },
            Course: { connect: { id: Number(courseId) } },
            approved: autoApprove,
          },
        });

        // Create notification for admin if manual approval is needed
        if (!autoApprove) {
          try {
            await DbClient.notification.create({
              data: {
                courseId: Number(courseId),
                title: "Новая заявка на запись",
                message: `Новая заявка на запись от ${user.email} для курса: ${course.name}`,
                type: "info",
                read: false,
                createdAt: new Date(),
              },
            });
          } catch (notificationError) {
            console.warn('Failed to create enrollment notification:', notificationError);
          }
        }

        res.status(200).json({
          ...enrollment,
          message: autoApprove ? "Successfully enrolled in course!" : "Enrollment request submitted. Waiting for admin approval."
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }

  async deleteEnrollment(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (authorizationHeader) {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
          const roles = decodedToken.roles;
          if (!roles.includes("ADMIN")) {
            return res.status(403).json("You don't have enough rights");
          }
          const id = parseInt(req.query.id);
          
          // Получаем информацию о записи перед удалением
          const enrollmentToDelete = await DbClient.enrollment.findUnique({
            where: { id: Number(id) },
            include: {
              User: true,
              Course: true
            }
          });
          
          if (!enrollmentToDelete) {
            return res.status(404).json({ error: "Enrollment not found" });
          }
          
          const deletedEnrollment = await DbClient.enrollment.delete({
            where: {
              id: Number(id),
            },
          });
          
          // Отправляем уведомление пользователю
          try {
            const adminUser = await DbClient.user.findUnique({ where: { id: decodedToken.id } });
            await NotificationService.notifyUserUnenrolled(
              enrollmentToDelete.User.id, 
              enrollmentToDelete.Course.name, 
              adminUser.username || 'Администратор'
            );
          } catch (notificationError) {
            console.error('Ошибка при отправке уведомления:', notificationError);
            // Не прерываем выполнение, если уведомление не отправилось
          }
          
          res.json(deletedEnrollment);
        }
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }

  async deleteEnrollmentByStudent(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      let id;
      if (authorizationHeader) {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
          id = decodedToken.id;
        } else {
          console.error("Invalid Authorization header format");
        }
        const user = await DbClient.user.findFirst({
          where: {
            id: id,
          },
        });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        const courseId = Number(req.params.courseId);
        if (isNaN(courseId)) {
          return res.status(400).json({ error: "Invalid course ID" });
        }

        const findEnrollment = await DbClient.enrollment.findFirst({
          where: {
            Course: { id: courseId },
            User: { id: user.id },
          },
        });
        if (!findEnrollment) {
          return res.status(404).json({ error: "Enrollment not found" });
        }

        // Удаляем запись Enrollment
        const enrollment = await DbClient.enrollment.delete({
          where: {
            id: findEnrollment.id,
          },
        });
        res.status(200).json(enrollment);
      }
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }

  /**
   * Возвращает курсы, на которые записан хотя бы один студент, вместе со списком этих студентов.
   * GET /students
   */
  async getCoursesWithStudents(req, res) {
    try {
      // Проверка авторизации — допускаем только администраторов
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json("You are not authorized");
      }
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json("Invalid authorization format");
      }
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const roles = decodedToken.roles;
      if (!roles || !roles.includes("ADMIN")) {
        return res.status(403).json("You don't have enough rights");
      }

      // Получаем курсы, у которых есть хотя бы одна запись Enrollment
      const courses = await DbClient.course.findMany({
        where: {
          enrollments: {
            some: {},
          },
        },
        include: {
          enrollments: {
            include: {
              User: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      const result = courses.map((c) => ({
        id: c.id,
        name: c.name,
        students: c.enrollments
          .map((e) => e.User)
          .filter(Boolean),
      }));

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }

  /**
   * Approve or reject enrollment request (Admin only)
   * PUT /enrollment/:enrollmentId/approve
   */
  async approveEnrollment(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json("You are not authorized");
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json("Invalid authorization format");
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const roles = decodedToken.roles;
      if (!roles || !roles.includes("ADMIN")) {
        return res.status(403).json("You don't have enough rights");
      }

      const enrollmentId = Number(req.params.enrollmentId);
      const { approved } = req.body;

      if (typeof approved !== 'boolean') {
        return res.status(400).json({ error: "Approved status is required and must be boolean" });
      }

      // Check if enrollment exists
      const enrollment = await DbClient.enrollment.findFirst({
        where: { id: enrollmentId },
        include: {
          User: true,
          Course: true,
        },
      });

      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }

      // Update enrollment approval status
      const updatedEnrollment = await DbClient.enrollment.update({
        where: { id: enrollmentId },
        data: { approved },
        include: {
          User: true,
          Course: true,
        },
      });

      // Create notification for user
      try {
        await DbClient.notification.create({
          data: {
            courseId: enrollment.course_id,
            title: "Статус записи изменен",
            message: `Ваша заявка на запись в курс "${enrollment.Course.name}" была ${approved ? 'одобрена' : 'отклонена'}.`,
            type: approved ? "success" : "warning",
            read: false,
            createdAt: new Date(),
          },
        });
      } catch (notificationError) {
        console.warn('Failed to create approval notification:', notificationError);
      }

      res.json({
        ...updatedEnrollment,
        message: `Enrollment ${approved ? 'approved' : 'rejected'} successfully`
      });

    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }

  /**
   * Get pending enrollment requests (Admin only)
   * GET /enrollment/pending
   */
  async getPendingEnrollments(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json("You are not authorized");
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json("Invalid authorization format");
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const roles = decodedToken.roles;
      if (!roles || !roles.includes("ADMIN")) {
        return res.status(403).json("You don't have enough rights");
      }

      const pendingEnrollments = await DbClient.enrollment.findMany({
        where: { approved: false },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          Course: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
      });

      res.json(pendingEnrollments);

    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }

  // ВРЕМЕННЫЙ МЕТОД ДЛЯ ИСПРАВЛЕНИЯ СУЩЕСТВУЮЩИХ ЗАПИСЕЙ
  async fixExistingEnrollments(req, res) {
    try {
      console.log('=== Исправляем существующие записи ===');
      
      // Сначала посмотрим, сколько записей с approved: false
      const pendingEnrollments = await DbClient.enrollment.findMany({
        where: {
          approved: false
        }
      });
      
      console.log('Найдено записей с approved: false:', pendingEnrollments.length);
      console.log('Записи:', pendingEnrollments.map(e => ({ id: e.id, course_id: e.course_id, user_id: e.user_id })));
      
      if (pendingEnrollments.length > 0) {
        const updatedEnrollments = await DbClient.enrollment.updateMany({
          where: {
            approved: false
          },
          data: {
            approved: true
          }
        });
        
        console.log('Обновлено записей:', updatedEnrollments.count);
        res.json({ 
          message: `Обновлено ${updatedEnrollments.count} записей`, 
          count: updatedEnrollments.count,
          updated: true
        });
      } else {
        console.log('Нет записей для обновления');
        res.json({ 
          message: 'Нет записей для обновления', 
          count: 0,
          updated: false
        });
      }
    } catch (error) {
      console.error('Ошибка при обновлении записей:', error);
      res.status(500).json({ error: 'Ошибка при обновлении записей', details: error.message });
    }
  }
}

module.exports = new enrollmentController();

const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const jwt = require("jsonwebtoken");

class enrollmentController {
  async getEnrollmentByStudent(req, res) {
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
        const id = decodedToken.id;

        const enrollments = await DbClient.enrollment.findMany({
          where: {
            User: {
              id: parseInt(req.query.id), // Преобразуем id в число, если это необходимо
            },
          },
          include: {
            Course: true, // Включаем связанную модель Course
          },
        });
        res.json(enrollments);
      }
    }
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
              User: {
                select: {
                  email: true,
                },
              },
              Course: {
                select: {
                  name: true,
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
          const enrollment = await DbClient.enrollment.create({
            data: {
              user_id: student.id, // Используем найденный id студента
              course_id: course.id, // Используем найденный id курса
              approved: req.body.approved || false,
            },
          });
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

        // Создаем новую запись Enrollment
        const enrollment = await DbClient.enrollment.create({
          data: {
            User: { connect: { id: Number(user.id) } },
            Course: { connect: { id: Number(req.params.courseId) } },
            approved: req.body.approved || false,
          },
        });
        res.status(200).json(enrollment);
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
          const deletedEnrollment = await DbClient.enrollment.delete({
            where: {
              id: Number(id),
            },
          });
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
}

module.exports = new enrollmentController();

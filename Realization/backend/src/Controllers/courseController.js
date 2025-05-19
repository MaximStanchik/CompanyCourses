const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const { getWS } = require("../ws/websocket");
const jwt = require("jsonwebtoken");

class courseController {
  async addCourse(req, res) {
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
          // Поиск категории по имени
          const category = await DbClient.category.findUnique({
            where: {
              name: req.body.category,
            },
          });

          // Check if the course name already exists
          const existingCourse = await DbClient.course.findFirst({
            where: {
              name: req.body.name,
            },
          });
          if (existingCourse) {
            // Return an error response if the course already exists
            return res
              .status(409)
              .json("Course with this name already exists.");
          }

          // Создание курса и привязка к категории
          const createdCourse = await DbClient.course.create({
            data: {
              name: req.body.name,
              description: req.body.description,
              Category: {
                connect: {
                  id: category.id, // Поиск категории по id
                },
              },
            },
          });

          const createdNotification = await DbClient.Notification.create({
            data: {
              courseId: createdCourse.id,
              date: new Date(),
              content: `Admin has created a new course: ${createdCourse.name}`,
            },
          });
          if (createdNotification) {
            let IO = getWS();
            IO.emit("new-notification", { createdNotification });
          }
          res.send(createdCourse);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).send({ message: "Course creation error" });
    }
  }

  async getAllCourses(req, res) {
    try {
      // проверка, что пользователь авторизован:
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json("You are not authorized");
      } else {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }

          const courses = await DbClient.course.findMany({
            select: {
              id: true,
              name: true,
              description: true,
              // Добавляем поле "category" и внутри него выбираем поле "name"
              Category: {
                select: {
                  name: true,
                },
              },
            },
          });
          return res.send(courses);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).send({ message: "Courses error" });
    }
  }

  async getCourseById(req, res) {
    try {
      const { id } = req.query;
      const course = await DbClient.course.findUnique({
        where: {
          id: Number(id),
        },
      });
      if (!course) {
        return res.status(404).send("Course with this id not found.");
      }

      return res.send(course);
    } catch (e) {
      console.log(e);
      res.status(400).send({ message: "Course error" });
    }
  }

  async deleteCourse(req, res) {
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
          const { id } = req.query;
          const course = await DbClient.course.delete({
            where: {
              id: Number(id),
            },
          });
          return res.json(course);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Course deletion error" });
    }
  }

  async deleteCoursesByCategory(req, res) {
    try {
      const { id } = req.query;
      const courses = await DbClient.course.findMany({
        where: {
          category: Number(id),
        },
      });

      if (!courses || courses.length === 0) {
        return res.status(404).send("No courses found for this category.");
      }

      // Удаление всех найденных курсов
      await DbClient.course.deleteMany({
        where: {
          category: Number(id),
        },
      });
      return res.send({
        message: `Courses for category with id ${id} successfully deleted.`,
      });
    } catch (e) {
      console.log(e);
      res.status(400).send({ message: "Error deleting courses by category" });
    }
  }

  async updateCourse(req, res) {
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

          const { id } = req.query;
          const { name, description, category } = req.body;

          const existingCourse = await DbClient.course.findUnique({
            where: {
              name,
            },
          });

          if (existingCourse && existingCourse.id !== parseInt(id)) {
            // Return an error response if the course with the same name exists and has a different id
            return res
              .status(409)
              .send("Course with this name already exists.");
          }

          const course = await DbClient.course.update({
            where: {
              id: parseInt(id),
            },
            data: {
              name: name,
              description: description,
              Category: {
                connect: {
                  id: category,
                },
              },
            },
          });

          const createdNotification = await DbClient.Notification.create({
            data: {
              courseId: course.id,
              date: new Date(),
              content: `Admin has updated a course: ${course.name}`,
            },
          });

          if (createdNotification) {
            let IO = getWS();
            IO.emit("new-notification", { createdNotification });
          }

          if (!course) {
            return res.status(404).send("Course with this id not found.");
          }

          return res.send(course);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).send({ message: "Course updation error" });
    }
  }
}

module.exports = new courseController();

const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const { uploadVideo } = require("./videoController.js");
const jwt = require("jsonwebtoken");

class lectureController {
  async addLecture(req, res) {
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
      if (!roles.includes("ADMIN")) {
        return res.status(403).json("You don't have enough rights");
      }

      // ⬇️ Загружаем видео и получаем относительный путь
      const videoLink = await uploadVideo(req);

      const course = await DbClient.course.findFirst({
        where: { name: req.body.course },
      });

      if (!course) {
        return res.status(400).json("This course doesn't exist");
      }

      const existingLecture = await DbClient.lecture.findFirst({
        where: {
          name: req.body.name,
          course_id: course.id,
        },
      });

      if (existingLecture) {
        return res
          .status(409)
          .json("Lecture with this name already exists in this course");
      }

      const upload = await DbClient.lecture.create({
        data: {
          name: req.body.name,
          content: req.body.content,
          videoLink, // ✅ сохраняем относительный путь
          Course: {
            connect: {
              id: course.id,
            },
          },
        },
      });

      res.status(201).json({ upload });
    } catch (error) {
      console.error(error);
      res.status(500).json("Server error");
    }
  }

  async getAllLectures(req, res) {
    try {
      const lectures = await DbClient.lecture.findMany({
        where: { course_id: Number(req.query.id) },
        include: {
          Course: {
            select: {
              description: true,
            },
          },
        },
      });

      // ✅ Преобразуем путь к видео в формат, подходящий для фронта
      const lecturesWithPublicVideoLink = lectures.map((lecture) => ({
        ...lecture,
        videoLink: lecture.videoLink.startsWith("/static/")
          ? lecture.videoLink
          : `/static/${lecture.videoLink}`, // на всякий случай
      }));

      res.json(lecturesWithPublicVideoLink);
    } 
    catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }
}

module.exports = new lectureController();

const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const jwt = require("jsonwebtoken");

class favoriteController {
  constructor() {
    // Bind methods to preserve 'this' context when used as route handlers
    this.getFavorites = this.getFavorites.bind(this);
    this.addFavorite = this.addFavorite.bind(this);
    this.removeFavorite = this.removeFavorite.bind(this);
  }

  // Получить избранные курсы текущего пользователя (только USER)
  async getFavorites(req, res) {
    try {
      const user = this._getUser(req, res);
      if (!user) return;
      const { id: userId, roles } = user;
      if (roles && roles.includes("ADMIN")) {
        return res.status(403).json("Admins cannot manage favorites");
      }

      const favorites = await DbClient.favoriteCourse.findMany({
        where: { user_id: userId },
        include: {
          Course: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      res.json(favorites.map((f) => f.Course));
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }

  // Добавить курс в избранное
  async addFavorite(req, res) {
    try {
      const user = this._getUser(req, res);
      if (!user) return;
      const { id: userId, roles } = user;
      if (roles && roles.includes("ADMIN")) {
        return res.status(403).json("Admins cannot manage favorites");
      }

      const courseId = Number(req.params.courseId);
      if (isNaN(courseId)) return res.status(400).json("Invalid course id");

      // Проверяем, существует ли уже
      const exists = await DbClient.favoriteCourse.findFirst({
        where: { user_id: userId, course_id: courseId },
      });
      if (exists) return res.status(409).json("Already in favorites");

      await DbClient.favoriteCourse.create({
        data: { user_id: userId, course_id: courseId },
      });
      res.status(201).json({ added: true });
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }

  // Удалить курс из избранного
  async removeFavorite(req, res) {
    try {
      const user = this._getUser(req, res);
      if (!user) return;
      const { id: userId, roles } = user;
      if (roles && roles.includes("ADMIN")) {
        return res.status(403).json("Admins cannot manage favorites");
      }

      const courseId = Number(req.params.courseId);
      if (isNaN(courseId)) return res.status(400).json("Invalid course id");

      await DbClient.favoriteCourse.deleteMany({
        where: { user_id: userId, course_id: courseId },
      });
      res.json({ removed: true });
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }

  // ===== helpers =====
  _getUser(req, res) {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      res.status(401).json("You are not authorized");
      return null;
    }
    const tokenArray = authorizationHeader.split(" ");
    if (tokenArray.length !== 2) {
      res.status(401).json("Invalid authorization format");
      return null;
    }
    const token = tokenArray[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.SECRET);
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
      return null;
    }
    return { id: decodedToken.id, roles: decodedToken.roles };
  }
}

module.exports = new favoriteController(); 
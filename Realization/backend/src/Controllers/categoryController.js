const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const DbClient = new PrismaClient();

class categoryController {
  async addCategory(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (authorizationHeader) {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } 
          catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
          const roles = decodedToken.roles;
          if (!roles.includes("ADMIN")) {
            return res.status(403).json("You don't have enough rights");
          }
          const { name } = req.body;
          // Check if the category already exists
          const existingCategory = await DbClient.category.findUnique({
            where: {
              name,
            },
          });
          if (existingCategory) {
            // Return an error response if the category already exists
            return res.status(409).send("Category already exists");
          }
          const category = await DbClient.category.create({
            data: {
              name,
            },
          });
          return res.json(category);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Category creation error" });
    }
  }

  async getAllCategories(req, res) {
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
          const categories = await DbClient.category.findMany();
          return res.json(categories);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Categories error" });
    }
  }

  async getCategoryById(req, res) {
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
          if (!Number.isInteger(id)) {
            return res.status(400).json({ message: "Invalid category ID" });
          }
          const category = await DbClient.category.findUnique({
            where: {
              id,
            },
          });
          if (!category) {
            return res.status(404).json({ message: "Category not found" });
          }
          return res.json(category);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Category error" });
    }
  }

  async deleteCategory(req, res) {
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
          if (!Number.isInteger(id)) {
            return res.status(400).json({ message: "Invalid category ID" });
          }

          // Удаление категории и всех связанных с ней курсов в рамках одной транзакции
          await DbClient.$transaction(async (prisma) => {
            await DbClient.course.deleteMany({
              where: {
                category: Number(id),
              },
            });

            const category = await DbClient.category.delete({
              where: {
                id: Number(id),
              },
            });

            if (!category) {
              return res.status(404).json({ message: "Category not found" });
            }

            return res.json(category);
          });
        }
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Category deletion error" });
    }
  }

  async updateCategory(req, res) {
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
          if (!Number.isInteger(id)) {
            return res.status(400).json({ message: "Invalid category ID" });
          }
          const { name } = req.body;

          // Check if the category already exists
          const existingCategory = await DbClient.category.findUnique({
            where: {
              name,
            },
          });
          if (existingCategory) {
            // Return an error response if the category already exists
            return res.status(409).send("Category already exists");
          }
          const category = await DbClient.category.update({
            where: {
              id: Number(id),
            },
            data: {
              name,
            },
          });
          if (!category) {
            return res.status(404).json({ message: "Category not found" });
          }
          return res.json(category);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Category update error" });
    }
  }
}

module.exports = new categoryController();

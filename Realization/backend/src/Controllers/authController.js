const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Load input validation
const validateRegisterInput = require("../Validation/register");
const validateLoginInput = require("../Validation/login");

const generateAccessToken = (id, roles) => {
  const payload = {
    id,
    roles: Array.isArray(roles) ? roles : [roles],
  };
  return jwt.sign(payload, process.env.SECRET, { expiresIn: "12h" }); // jwt.sign() - функция, которая создает токен
};

class authController {
  async registration(req, res) {
    const { id, name } = req.body;
    const email = req.body.email;
    const password = req.body.password;
    const password2 = req.body.password2;
    const { errors, isValid } = validateRegisterInput(req.body);

    // Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    try {
      const candidate = await DbClient.user.findUnique({
        where: {
          email: email,
        },
      });
      if (candidate) {
        const errors = { email: "Email already exists" };
        return res.status(400).json(errors);
      } 
      else {
        const hashPassword = await bcrypt.hash(password, 5);
        const user = await DbClient.user.create({
          data: {
            id,
            name,
            email,
            role: "USER",
            password: hashPassword,
          },
        });
        return res.json(user);
      }
    } catch (err) {
      console.log(err);
      res.status(400).json({ message: "Registration error" });
    }
  }

  async login(req, res) {
    const { errors, isValid } = validateLoginInput(req.body);

    // Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { email, password } = req.body;
    try {
      const user = await DbClient.user.findUnique({
        where: {
          email: email,
        },
      });
      if (!user) {
        const errors = { email: `User with email ${email} does not exist` };
        return res.status(400).json(errors);
      }
      const validPassword = await bcrypt.compareSync(password, user.password);
      if (!validPassword) {
        const errors = { password: "Invalid password" };
        return res.status(400).json(errors);
      }
      const token = generateAccessToken(user.id, user.role);
      return res.json({ token });
    } catch (err) {
      console.log(err);
      res.status(400).json({ message: "Login error" });
    }
  }

  async getUsers(req, res) {
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
            return res.status(401).json("Invalid token");
          }
          const roles = decodedToken.roles;
          if (!roles.includes("ADMIN")) {
            return res.status(403).json("You don't have enough rights");
          }

          const users = await DbClient.user.findMany();
          return res.json(users);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Get users error" });
    }
  }

  async isAdmin(req, res) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const { id } = await jwt.verify(token, process.env.SECRET);
      const user = await DbClient.user.findUnique({
        where: {
          id: id,
        },
      });
      if (user.role === "ADMIN") {
        return res.json({ isAdmin: true });
      } 
      else {
        return res.json({ isAdmin: false });
      }
    } 
    catch (e) {
      console.log(e);
      res.status(400).json({ message: "Get user error" });
    }
  }

  async currentUser(req, res) {
    try {
      // проверка, что пользователь авторизован:
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json("You are not authorized");
      }
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
          const user = await DbClient.user.findUnique({
            where: {
              id: id,
            },
          });
          return res.json(user);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Get user error" });
    }
  }

  async getUserById(req, res) {
    try {
      const id = parseInt(req.query.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const user = await DbClient.user.findUnique({
        where: {
          id,
        },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(user);
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "User error" });
    }
  }

  async updateUser(req, res) {
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
            return res.status(400).json({ message: "Invalid user ID" });
          }
          const user = await DbClient.user.findUnique({
            where: {
              id,
            },
          });
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
          const { name, email, role } = req.body;
          const existingUser = await DbClient.user.findUnique({
            where: {
              email,
            },
          });
          if (existingUser && existingUser.id !== id) {
            // Return an error response if the category already exists
            return res.status(409).send("User with this email already exists");
          }
          const userNew = await DbClient.user.update({
            where: {
              id: Number(id),
            },
            data: {
              ...req.body,
            },
          });
          return res.json(userNew);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "User error" });
    }
  }

  async deleteUser(req, res) {
    try {
      // Удаление пользователя
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
          const removedUser = await DbClient.user.delete({
            where: { id: Number(req.query.id) },
          });
          res.json(removedUser);
        }
      }
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  }
}

module.exports = new authController();

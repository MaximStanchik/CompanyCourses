const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const jwt = require("jsonwebtoken");
// Load Validation
const validateProfileInput = require("../Validation/profile");

class profileController {
  async addProfile(req, res) {
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
          const id = decodedToken.id;

          const user = await DbClient.user.findUnique({
            where: {
              id: parseInt(id),
            },
          });
          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }

          const { errors, isValid } = validateProfileInput(req.body);
          // Check Validation
          if (!isValid) {
            // Return any errors with 400 status
            return res.status(400).json(errors);
          }

          // Get fields
          const profileFields = {};
          profileFields.userId = user.id;
          if (req.body.handle) profileFields.handle = req.body.handle;
          if (req.body.company) profileFields.company = req.body.company;
          if (req.body.bio) profileFields.bio = req.body.bio;
          if (req.body.position) profileFields.position = req.body.position;
          if (req.body.city) profileFields.city = req.body.city;
          if (req.body.country) profileFields.country = req.body.country;
          if (req.body.status) profileFields.status = req.body.status;
          if (req.body.githubusername)
            profileFields.githubusername = req.body.githubusername;
          // Skills - Split into array
          if (typeof req.body.skills !== "undefined") {
            profileFields.skills = req.body.skills.split(",");
          }

          const profile = await DbClient.profile.findUnique({
            where: { userId: user.id },
          });

          if (profile) {
            // Update
            const updatedProfile = await DbClient.profile.update({
              where: { userId: user.id },
              data: profileFields,
            });
            res.json(updatedProfile);
          } else {
            const existingProfile = await DbClient.profile.findFirst({
              where: { handle: profileFields.handle },
            });

            if (existingProfile) {
              errors.handle = "That handle already exists";
              return res.status(400).json(errors);
            }

            // Save Profile
            const createdProfile = await DbClient.profile.create({
              data: profileFields,
            });
            res.json(createdProfile);
          }
        }
      } else {
        console.error("Invalid Authorization header format");
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }

  async getAllProfiles(req, res) {
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
          const profiles = await DbClient.profile.findMany({
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          });

          if (!profiles || profiles.length === 0) {
            return res.status(404).json({ noprofile: "There are no profiles" });
          }

          res.json(profiles);
        }
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Failed to fetch profiles" });
    }
  }

  async getProfileByCurrentUser(req, res) {
    try {
      const { errors } = validateProfileInput(req.body);
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

          const user = await DbClient.user.findUnique({
            where: {
              id: parseInt(id),
            },
          });
          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }

          // Используем Prisma для поиска профиля пользователя
          const profile = await DbClient.profile.findUnique({
            where: {
              userId: user.id,
            },
            include: {
              user: {
                select: {
                  name: true, // Включение столбца name из таблицы User
                },
              },
            },
          });

          if (!profile) {
            errors.noprofile = "There is no profile for this user";
            return res.status(404).json(errors);
          }
          res.json(profile);
        }
      } else {
        console.error("Invalid Authorization header format");
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Server error" });
    }
  }

  async profileByUserId(req, res) {
    try {
      const errors = {};
      const profile = await DbClient.profile.findFirst({
        where: {
          userId: Number(req.params.user_id),
        },
        include: {
          user: {
            select: {
              name: true, // Включение столбца name из таблицы User
            },
          },
        },
      });

      if (!profile) {
        return res
          .status(404)
          .json({ noprofile: "There is no profile for this user" });
      }
      res.json(profile);
    } catch (err) {
      console.error(err); // Вывод ошибки в консоль
      res.status(404).json({ profile: "There is no profile for this user" });
    }
  }

  async profileByHandle(req, res) {
    try {
      const profile = await DbClient.profile.findFirst({
        where: {
          handle: req.params.handle,
        },
        include: {
          user: {
            select: {
              name: true, // Включение столбца name из таблицы User
            },
          },
        },
      });

      if (!profile) {
        return res
          .status(404)
          .json({ noprofile: "There is no profile for this user" });
      }
      res.json(profile);
    } catch (err) {
      console.error(err); // Вывод ошибки в консоль
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  async deleteProfile(req, res) {
    // при удалении профиля, удаляется и user
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
          const id = decodedToken.id;
          const user = await DbClient.user.findFirst({
            where: {
              id: Number(id),
            },
          });

          if (!user || !user.id) {
            return res.status(401).json({ error: "Unauthorized" });
          }
          const profile = await DbClient.profile.findFirst({
            where: {
              userId: user.id,
            },
          });

          if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
          }

          await DbClient.profile.delete({
            where: {
              id: profile.id,
            },
          });

          res.json({ success: true });
        }
      } else {
        console.error("Invalid Authorization header format");
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete profile and user" });
    }
  }
}

module.exports = new profileController();

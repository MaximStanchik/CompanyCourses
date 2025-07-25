const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const jwt = require("jsonwebtoken");
const validateProfileInput = require("../Validation/profile");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require('bcryptjs');

// Ensure static directory exists
const avatarStoragePath = path.join(__dirname, "../../static/avatar");
if (!fs.existsSync(avatarStoragePath)) {
  fs.mkdirSync(avatarStoragePath, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarStoragePath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const uploadAvatarMulter = multer({
  storage: avatarStorage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
}).single("avatar");

class ProfileController {
  async addProfile(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader)
        return res.status(401).json({ error: "Unauthorized" });

      const token = authorizationHeader.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET);

      const user = await DbClient.user.findUnique({
        where: { id: parseInt(decodedToken.id) },
      });

      if (!user) return res.status(404).json({ error: "User not found" });

      const { errors, isValid } = validateProfileInput(req.body);
      if (!isValid) return res.status(400).json(errors);

      if (req.body.username) {
        const existingUsername = await DbClient.user.findFirst({
          where: {
            username: req.body.username,
            NOT: { id: user.id },
          },
        });
      
        if (existingUsername) {
          return res.status(400).json({ username: "Username is already taken (last saved valid username selected)" });
        }
      
        await DbClient.user.update({
          where: { id: user.id },
          data: { username: req.body.username },
        });
      }

      const profileFields = {
        userId: user.id,
        bio: req.body.bio,
        githubusername: req.body.githubusername,
        city: req.body.city,
        country: req.body.country,
        position: req.body.position,
        company: req.body.company,
        status: req.body.status,
        skills:
          typeof req.body.skills !== "undefined"
            ? req.body.skills.split(",")
            : [],
        date: req.body.date,
        name: req.body.name,
        surname: req.body.surname,
        additionalName: req.body.additionalName,
        jobTitle: req.body.jobTitle,
        goal: req.body.goal,
        aboutMe: req.body.aboutMe,
      };

      const existingProfile = await DbClient.profile.findUnique({
        where: { userId: user.id },
      });

      if (existingProfile) {
        const updatedProfile = await DbClient.profile.update({
          where: { userId: user.id },
          data: profileFields,
        });
        return res.json(updatedProfile);
      } else {
        const createdProfile = await DbClient.profile.create({
          data: profileFields,
        });
        return res.json(createdProfile);
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  async getAllProfiles(req, res) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET);

      if (!decodedToken.roles.includes("ADMIN")) {
        return res.status(403).json("You don't have enough rights");
      }

      const profiles = await DbClient.profile.findMany({
        include: { user: { select: { username: true } } },
      });

      if (!profiles.length)
        return res.status(404).json({ noprofile: "There are no profiles" });

      return res.json(profiles);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch profiles" });
    }
  }

  async getProfileByCurrentUser(req, res) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET);

      // Определяем IP
      let ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip;
      if (Array.isArray(ip)) ip = ip[0];
      if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0];
      // Обновляем lastActivityTime и lastIP
      await DbClient.user.update({
        where: { id: parseInt(decodedToken.id) },
        data: {
          lastActivityTime: new Date(),
          lastIP: ip,
        }
      });

      const user = await DbClient.user.findUnique({
        where: { id: parseInt(decodedToken.id) },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          lastDevice: true,
          lastOS: true,
          lastBrowser: true,
          lastIP: true,
          lastCountry: true,
          lastActivityTime: true,
        }
      });

      if (!user) return res.status(404).json({ error: "User not found" });

      const profile = await DbClient.profile.findFirst({
        where: {
          userId: user.id,
        },
        include: {
          user: false,
        },
      });

      if (!profile)
        return res
          .status(404)
          .json({ noprofile: "There is no profile for this user" });

      return res.json({ ...profile, user });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  async profileByUserId(req, res) {
    try {
      const profile = await DbClient.profile.findFirst({
        where: { userId: Number(req.params.user_id) },
        include: { user: { select: { username: true } } },
      });

      if (!profile)
        return res
          .status(404)
          .json({ noprofile: "There is no profile for this user" });

      return res.json(profile);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "There is no profile for this user" });
    }
  }

  async profileByUsername(req, res) {
    try {
      const profile = await DbClient.profile.findFirst({
        where: {
          user: {
            username: req.params.handle, // req.params.username в router-е указан как :handle
          },
        },
        include: {
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
      });

      if (!profile)
        return res
          .status(404)
          .json({ noprofile: "There is no profile for this user" });

      return res.json(profile);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  async deleteProfile(req, res) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET);

      const user = await DbClient.user.findUnique({
        where: { id: Number(decodedToken.id) },
      });

      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const profile = await DbClient.profile.findUnique({
        where: { userId: user.id },
      });

      if (!profile)
        return res.status(404).json({ error: "Profile not found" });

      await DbClient.profile.delete({ where: { id: profile.id } });
      await DbClient.user.delete({ where: { id: user.id } });

      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Failed to delete profile and user" });
    }
  }

  async checkUsername(req, res) {
    try {
      const profile = await DbClient.profile.findFirst({
        where: {
          user: {
            username: req.params.username,
          },
        },
      });

      return res.json({ exists: !!profile });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  async uploadAvatar(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader)
        return res.status(401).json({ error: "Unauthorized" });
      const token = authorizationHeader.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET);
      const user = await DbClient.user.findUnique({
        where: { id: parseInt(decodedToken.id) },
      });
      if (!user) return res.status(404).json({ error: "User not found" });
      uploadAvatarMulter(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: "Upload error" });
        }
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        const relativePath = `/static/avatar/${req.file.filename}`;
        // Save avatar path to profile
        const updatedProfile = await DbClient.profile.update({
          where: { userId: user.id },
          data: { avatar: relativePath },
        });
        return res.json({ avatar: relativePath });
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  async uploadUserAvatar(req, res) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET);
      const user = await DbClient.user.findUnique({ where: { id: parseInt(decodedToken.id) } });
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const avatarPath = `/static/avatar/${req.file.filename}`;
      await DbClient.user.update({ where: { id: user.id }, data: { avatar: avatarPath } });
      return res.json({ avatar: avatarPath });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  async updateUserIp(req, res) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET);
      const { ip } = req.body;
      if (!ip) return res.status(400).json({ error: 'IP is required' });
      await DbClient.user.update({
        where: { id: parseInt(decodedToken.id) },
        data: { lastIP: ip, lastActivityTime: new Date() },
      });
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  async changePassword(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const decodedToken = jwt.verify(token, process.env.SECRET);
      const user = await DbClient.user.findUnique({ where: { id: parseInt(decodedToken.id) } });
      console.log('changePassword: decodedToken.id:', decodedToken.id);
      if (user) console.log('changePassword: user.email:', user.email);
      const { currentPassword, newPassword } = req.body;
      console.log('changePassword: currentPassword:', currentPassword);
      console.log('changePassword: user.password:', user ? user.password : 'NO_USER');
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!currentPassword) return res.status(400).json({ error: 'All fields are required' });
      // Проверка текущего пароля
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      console.log('changePassword: isMatch:', isMatch);
      if (!isMatch) return res.status(400).json({ error: 'Текущий пароль неверный' });
      // Если только проверка текущего пароля (newPassword === '___dummy___')
      if (newPassword === '___dummy___') {
        return res.json({ success: true });
      }
      // Валидация нового пароля (как при регистрации)
      let score = 0;
      if (newPassword.length >= 8) score++;
      if (/[A-Z]/.test(newPassword)) score++;
      if (/[a-z]/.test(newPassword)) score++;
      if (/\d/.test(newPassword)) score++;
      if (/[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) score++;
      console.log('changePassword: newPassword:', newPassword);
      console.log('changePassword: password strength score:', score);
      if (score < 3) {
        return res.status(400).json({ error: 'Пароль слишком простой. Минимум 8 символов, буквы верхнего и нижнего регистра, цифры и спецсимволы.' });
      }
      // Хешируем и сохраняем новый пароль
      const salt = await bcrypt.genSalt(5);
      const hash = await bcrypt.hash(newPassword, salt);
      await DbClient.user.update({ where: { id: user.id }, data: { password: hash } });
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
}

const controller = new ProfileController();
module.exports = {
  addProfile: controller.addProfile.bind(controller),
  getAllProfiles: controller.getAllProfiles.bind(controller),
  getProfileByCurrentUser: controller.getProfileByCurrentUser.bind(controller),
  profileByUserId: controller.profileByUserId.bind(controller),
  profileByUsername: controller.profileByUsername.bind(controller),
  deleteProfile: controller.deleteProfile.bind(controller),
  checkUsername: controller.checkUsername.bind(controller),
  uploadUserAvatar: controller.uploadUserAvatar.bind(controller),
  uploadAvatarMulter,
  updateUserIp: controller.updateUserIp.bind(controller),
  changePassword: controller.changePassword.bind(controller),
};

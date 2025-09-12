const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const jwt = require("jsonwebtoken");
const validateProfileInput = require("../Validation/profile");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require('bcryptjs');
const NotificationService = require('../utils/notificationService');
const { uploadFile, BUCKETS, deleteFile } = require('../utils/minioClient');

// Настройка multer для временного хранения файлов
const uploadAvatarMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB для аватаров
}).single("avatar");

class ProfileController {
  async addProfile(req, res) {
    try {
      // Используем req.user из middleware
      const userId = parseInt(req.user.id);

      const user = await DbClient.user.findUnique({
        where: { id: userId },
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
        language: req.body.language,
      };
      
      console.log('=== ОБНОВЛЕНИЕ ПРОФИЛЯ ===');
      console.log('Пользователь ID:', user.id);
      console.log('Данные профиля:', profileFields);
      console.log('Язык из запроса:', req.body.language);

      const existingProfile = await DbClient.profile.findUnique({
        where: { userId: user.id },
      });

      if (existingProfile) {
        const updatedProfile = await DbClient.profile.update({
          where: { userId: user.id },
          data: profileFields,
        });
        console.log('✅ Профиль обновлен:', updatedProfile);
        const freshUser = await DbClient.user.findUnique({ where: { id: user.id }, select: { id: true, username: true, email: true, avatar: true } });
        
        // Обрабатываем путь к аватару - возвращаем только имя файла
        const userWithProcessedAvatar = {
          ...freshUser,
          avatar: freshUser.avatar ? freshUser.avatar.split('/').pop() : null
        };
        
        return res.json({ ...updatedProfile, user: userWithProcessedAvatar });
      } else {
        const createdProfile = await DbClient.profile.create({
          data: profileFields,
        });
        console.log('✅ Профиль создан:', createdProfile);
        const freshUser = await DbClient.user.findUnique({ where: { id: user.id }, select: { id: true, username: true, email: true, avatar: true } });
        
        // Обрабатываем путь к аватару - возвращаем только имя файла
        const userWithProcessedAvatar = {
          ...freshUser,
          avatar: freshUser.avatar ? freshUser.avatar.split('/').pop() : null
        };
        
        return res.json({ ...createdProfile, user: userWithProcessedAvatar });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  async getAllProfiles(req, res) {
    try {
      // Используем req.user из middleware
      if (!req.user.roles || !req.user.roles.includes("ADMIN")) {
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
      // Используем req.user из middleware
      const userId = parseInt(req.user.id);

      // Определяем IP
      let ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip;
      if (Array.isArray(ip)) ip = ip[0];
      if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0];
      // Обновляем lastActivityTime и lastIP
      await DbClient.user.update({
        where: { id: userId },
        data: {
          lastActivityTime: new Date(),
          lastIP: ip,
        }
      });

      const user = await DbClient.user.findUnique({
        where: { id: userId },
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

      // Обрабатываем путь к аватару - возвращаем только имя файла
      const userWithProcessedAvatar = {
        ...user,
        avatar: user.avatar ? user.avatar.split('/').pop() : null
      };

      return res.json({ ...profile, user: userWithProcessedAvatar });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  async adminUpdateProfile(req, res) {
    try {
      // Используем req.user из middleware
      if (!req.user.roles || !req.user.roles.includes('ADMIN')) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const targetUserId = parseInt(req.body.userId);
      if (!targetUserId) return res.status(400).json({ error: 'userId is required' });

      // Обрабатываем загрузку файла аватара, если он есть
      if (req.file) {
        try {
          const fileName = `avatar-${targetUserId}-${Date.now()}${path.extname(req.file.originalname)}`;
          const avatarPath = await uploadFile(BUCKETS.AVATARS, fileName, req.file.buffer, req.file.mimetype);
          
          // Удаляем старый аватар, если он существует
          const existingUser = await DbClient.user.findUnique({ where: { id: targetUserId } });
          if (existingUser && existingUser.avatar) {
            try {
              // Извлекаем имя файла из пути MinIO
              const oldAvatarPath = existingUser.avatar.split('/').pop();
              await deleteFile(BUCKETS.AVATARS, oldAvatarPath);
            } catch (deleteError) {
              console.error('Error deleting old avatar:', deleteError);
            }
          }
          
          await DbClient.user.update({
            where: { id: targetUserId },
            data: { avatar: avatarPath },
          });
        } catch (uploadError) {
          console.error('Error uploading avatar to MinIO:', uploadError);
          return res.status(500).json({ error: 'Failed to upload avatar' });
        }
      }

      // Update username/email if provided (unique username enforced)
      if (req.body.username || req.body.email) {
        const data = {};
        if (req.body.username) {
          const existing = await DbClient.user.findFirst({ where: { username: req.body.username, NOT: { id: targetUserId } } });
          if (existing) return res.status(400).json({ username: 'Username is already taken' });
          data.username = req.body.username;
        }
        if (req.body.email) {
          data.email = req.body.email;
        }
        if (Object.keys(data).length) {
          await DbClient.user.update({ where: { id: targetUserId }, data });
        }
      }

      // Update user role if provided
      if (req.body.role) {
        await DbClient.user.update({
          where: { id: targetUserId },
          data: { role: req.body.role }
        });
      }

      const profileFields = {
        userId: targetUserId,
        bio: req.body.bio ?? undefined,
        githubusername: req.body.githubusername ?? undefined,
        city: req.body.city ?? undefined,
        country: req.body.country ?? undefined,
        position: req.body.position ?? undefined,
        company: req.body.company ?? undefined,
        status: req.body.status ?? undefined,
        skills: typeof req.body.skills === 'string' ? req.body.skills.split(',').map(s=>s.trim()).filter(Boolean) : Array.isArray(req.body.skills) ? req.body.skills : undefined,
        date: req.body.date ?? undefined,
        name: req.body.name ?? undefined,
        surname: req.body.surname ?? undefined,
        additionalName: req.body.additionalName ?? undefined,
        jobTitle: req.body.jobTitle ?? undefined,
        goal: req.body.goal ?? undefined,
        aboutMe: req.body.aboutMe ?? undefined,
      };

      const existingProfile = await DbClient.profile.findUnique({ where: { userId: targetUserId } });
      let out;
      if (existingProfile) {
        out = await DbClient.profile.update({ where: { userId: targetUserId }, data: profileFields });
      } else {
        out = await DbClient.profile.create({ data: { ...profileFields, userId: targetUserId } });
      }
      
      // Отправляем уведомление пользователю
      try {
        const adminUser = await DbClient.user.findUnique({ where: { id: req.user.id } });
        await NotificationService.notifyProfileUpdated(targetUserId, adminUser.username || 'Администратор');
      } catch (notificationError) {
        console.error('Ошибка при отправке уведомления:', notificationError);
        // Не прерываем выполнение, если уведомление не отправилось
      }
      
      const freshUser = await DbClient.user.findUnique({ where: { id: targetUserId }, select: { id: true, username: true, email: true, avatar: true, role: true } });
      
      // Обрабатываем путь к аватару - возвращаем только имя файла
      const userWithProcessedAvatar = {
        ...freshUser,
        avatar: freshUser.avatar ? freshUser.avatar.split('/').pop() : null
      };
      
      return res.json({ profile: out, user: userWithProcessedAvatar });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  async profileByUserId(req, res) {
    try {
      const profile = await DbClient.profile.findFirst({
        where: { userId: Number(req.params.user_id) },
        include: { 
          user: { 
            select: { 
              username: true,
              avatar: true
            } 
          } 
        },
      });

      if (!profile)
        return res
          .status(404)
          .json({ noprofile: "There is no profile for this user" });

      // Обрабатываем путь к аватару - возвращаем только имя файла
      const profileWithProcessedAvatar = {
        ...profile,
        user: {
          ...profile.user,
          avatar: profile.user.avatar ? profile.user.avatar.split('/').pop() : null
        }
      };

      return res.json(profileWithProcessedAvatar);
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
              avatar: true,
            },
          },
        },
      });

      if (!profile)
        return res
          .status(404)
          .json({ noprofile: "There is no profile for this user" });

      // Обрабатываем путь к аватару - возвращаем только имя файла
      const profileWithProcessedAvatar = {
        ...profile,
        user: {
          ...profile.user,
          avatar: profile.user.avatar ? profile.user.avatar.split('/').pop() : null
        }
      };

      return res.json(profileWithProcessedAvatar);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = parseInt(req.user.id);

      // Получаем пользователя с хешированным паролем
      const user = await DbClient.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Проверяем текущий пароль
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Хешируем новый пароль
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Обновляем пароль
      await DbClient.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      return res.json({ message: "Password changed successfully" });
    } catch (err) {
      console.error('Error changing password:', err);
      return res.status(500).json({ error: "Failed to change password" });
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
      // Используем req.user из middleware
      const userId = parseInt(req.user.id);
      const user = await DbClient.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      
      // Загружаем аватар в MinIO
      const fileName = `avatar-${userId}-${Date.now()}${path.extname(req.file.originalname)}`;
      const avatarPath = await uploadFile(BUCKETS.AVATARS, fileName, req.file.buffer, req.file.mimetype);
      
      // Удаляем старый аватар, если он существует
      if (user.avatar) {
        try {
          const oldAvatarPath = user.avatar.split('/').pop();
          await deleteFile(BUCKETS.AVATARS, oldAvatarPath);
        } catch (deleteError) {
          console.error('Error deleting old avatar:', deleteError);
        }
      }
      
      await DbClient.user.update({ where: { id: user.id }, data: { avatar: avatarPath } });
      
      // Возвращаем только имя файла
      const avatarFileName = avatarPath.split('/').pop();
      return res.json({ avatar: avatarFileName });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  async updateUserIp(req, res) {
    try {
      // Используем req.user из middleware
      const userId = parseInt(req.user.id);
      const { ip } = req.body;
      if (!ip) return res.status(400).json({ error: 'IP is required' });
      await DbClient.user.update({
        where: { id: userId },
        data: { lastIP: ip, lastActivityTime: new Date() },
      });
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
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
  checkUsername: controller.checkUsername.bind(controller),
  uploadUserAvatar: controller.uploadUserAvatar.bind(controller),
  uploadAvatarMulter,
  updateUserIp: controller.updateUserIp.bind(controller),
  changePassword: controller.changePassword.bind(controller),
  adminUpdateProfile: controller.adminUpdateProfile.bind(controller),
};

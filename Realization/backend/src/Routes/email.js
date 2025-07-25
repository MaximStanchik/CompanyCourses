const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config(); // Загрузка переменных окружения из .env
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../Middleware/authMiddleware');

// Конфигурация почтового транспортера через Yahoo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mail.yahoo.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // Для порта 587 secure должен быть false
  auth: {
    user: process.env.EMAIL_USER, // Email отправителя
    pass: process.env.EMAIL_PASS  // Пароль приложения
  }
});

// Маршрут для отправки email
router.post('/send-email', authMiddleware, async (req, res) => {
  console.log('AUTH DEBUG: req.user =', req.user);
  let savedMessage = null;
  try {
    // 1. Получаем userId из req.user (или req.session, или req.body для теста)
    const userId = req.user?.id || req.body.userId; // Для теста можно передавать userId в body
    if (!userId) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    // 2. Получаем пользователя из БД
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email || user.isVerified === false) {
      return res.status(400).json({ error: 'Email пользователя не найден или неактивен' });
    }

    // 3. Сохраняем сообщение в БД
    savedMessage = await prisma.supportMessage.create({
      data: {
        userId: user.id,
        email: user.email,
        message: req.body.text,
        status: 'pending',
        createdAt: new Date()
      }
    });

    // 4. Отправляем email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'maximpetrov420@gmail.com',
      replyTo: user.email,
      subject: req.body.subject || 'Support Message from User',
      text: `Жалоба от пользователя:\nID: ${user.id}\nEmail: ${user.email}\n\nСообщение:\n${req.body.text}`,
      html: `<p><strong>Жалоба от пользователя:</strong></p><ul><li><b>ID:</b> ${user.id}</li><li><b>Email:</b> ${user.email}</li></ul><p><b>Сообщение:</b></p><p>${req.body.text}</p>`
    };

    await transporter.sendMail(mailOptions);

    // 5. Обновляем статус сообщения
    await prisma.supportMessage.update({
      where: { id: savedMessage.id },
      data: { status: 'sent' }
    });

    res.status(200).json({ message: 'Сообщение успешно отправлено' });
  } catch (error) {
    console.error('EMAIL SEND ERROR:', error);
    // Если ошибка отправки — обновляем статус
    if (savedMessage?.id) {
      await prisma.supportMessage.update({
        where: { id: savedMessage.id },
        data: { status: 'error', error: error.message }
      });
    }
    res.status(500).json({ error: 'Ошибка при отправке сообщения' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config(); // Загрузка переменных окружения из .env
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../Middleware/authMiddleware');

const PORT = parseInt(process.env.EMAIL_PORT) || 587;
const HOST = process.env.EMAIL_HOST || 'smtp.mail.yahoo.com';
const USER = process.env.EMAIL_USER;
const PASS = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  host: HOST,
  port: PORT,
  secure: PORT === 465,
  auth: { user: USER, pass: PASS }
});

transporter.verify().then(()=>{
  console.log('SMTP verified');
}).catch(err=>{
  console.warn('SMTP verify failed:', err?.message);
});

const SUPPORT_TO = process.env.SUPPORT_INBOX || USER;

router.post('/send-email', authMiddleware, async (req, res) => {
  console.log('AUTH DEBUG: req.user =', req.user);
  let savedMessage = null;
  try {
    const userId = req.user?.id || req.body.userId;
    if (!userId) return res.status(401).json({ error: 'Пользователь не авторизован' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email) return res.status(400).json({ error: 'Email пользователя не найден' });

    savedMessage = await prisma.supportMessage.create({
      data: { userId: user.id, email: user.email, message: req.body.text, status: 'pending', createdAt: new Date() }
    });

    const mailOptions = {
      from: USER,
      to: SUPPORT_TO,
      subject: req.body.subject || 'Support Message from User',
      text: `Жалоба от пользователя:\nID: ${user.id}\nEmail: ${user.email}\n\nСообщение:\n${req.body.text}`,
      html: `<p><strong>Жалоба от пользователя:</strong></p><ul><li><b>ID:</b> ${user.id}</li><li><b>Email:</b> ${user.email}</li></ul><p><b>Сообщение:</b></p><p>${req.body.text}</p>`
    };

    await transporter.sendMail(mailOptions);

    await prisma.supportMessage.update({ where: { id: savedMessage.id }, data: { status: 'sent' } });
    res.status(200).json({ message: 'Сообщение успешно отправлено' });
  } catch (error) {
    console.error('EMAIL SEND ERROR:', error);
    if (savedMessage?.id) {
      await prisma.supportMessage.update({ where: { id: savedMessage.id }, data: { status: 'error', error: error.message } });
    }
    res.status(200).json({ message: 'Сообщение сохранено, но почта временно недоступна', error: error.message });
  }
});

module.exports = router;

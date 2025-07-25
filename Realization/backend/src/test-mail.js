require('dotenv').config({ path: '../.env' }); // <-- Обязательно

const nodemailer = require('nodemailer');

console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✓' : '❌');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mail.yahoo.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function main() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'maximpetrov420@gmail.com',
      subject: 'Тестовое сообщение',
      text: 'Привет! Это тест.',
    });
    console.log('✅ УСПЕХ: Письмо отправлено:', info.response);
  } catch (err) {
    console.error('❌ SEND FAIL:', err);
  }
}

main();

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let IO;

function initWS(httpsServer) {
  const io = new Server(httpsServer, {
    cors: {
      origin: "https://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    allowEIO3: true,
  });

  io.on("connection", async (socket) => {
    // При подключении — отправить список чатов (опционально)
    try {
      const chats = await prisma.chat.findMany();
      socket.emit('chat-list', chats);
    } catch (e) { /* ignore */ }

    // При запросе истории чата
    socket.on('get-chat-history', async (chatId) => {
      try {
        const messages = await prisma.message.findMany({
          where: { chatId: chatId },
          include: {
            user: { select: { id: true, username: true, avatar: true } },
            reactions: { include: { user: { select: { id: true, username: true, avatar: true } } } }
          },
          orderBy: { sentAt: 'asc' }
        });
        socket.emit('chat-history', { chatId, messages });
      } catch (e) { socket.emit('chat-history', { chatId, messages: [] }); }
    });

    // Новое сообщение (текст, файл, изображение, видео, caption, preview)
    socket.on('chat-message', async (msg) => {
      // msg: { userId, text, time, fileUrl, fileType, preview, caption, fileName, chatId, user/username }
      let chat = await prisma.chat.findUnique({ where: { id: msg.chatId } });
      if (!chat) {
        chat = await prisma.chat.create({ data: { id: msg.chatId, name: msg.chatId.toString() } });
      }
      let user = null;
      if (msg.userId) {
        user = await prisma.user.findUnique({ where: { id: Number(msg.userId) } });
      }
      if (!user && (msg.username || msg.user)) {
        const uname = msg.username || msg.user;
        user = await prisma.user.findFirst({ where: { username: uname } });
      }
      const message = await prisma.message.create({
        data: {
          chatId: chat.id,
          userId: user ? user.id : null,
          text: msg.text,
          sentAt: msg.time ? new Date(msg.time) : new Date(),
          fileUrl: msg.fileUrl || null,
          fileType: msg.fileType || null,
          preview: msg.preview || null,
          caption: msg.caption || null
        },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          reactions: { include: { user: { select: { id: true, username: true, avatar: true } } } }
        }
      });
      if (msg.fileName) message.fileName = msg.fileName;
      io.emit('chat-message', { ...message, chatId: chat.id });
    });

    // Реакции к сообщениям
    socket.on('reaction-toggle', async ({ messageId, userId, emoji, chatId }) => {
      const uid = parseInt(userId);
      if (!messageId || !emoji || isNaN(uid)) return; // простая валидация

      // Проверяем, есть ли ХОТЬ КАКАЯ-ТО реакция этого пользователя на это сообщение
      const existing = await prisma.reaction.findFirst({
        where: { messageId, userId: uid }
      });

      if (existing) {
        if (existing.emoji === emoji) {
          // Тот же самый эмодзи — убираем реакцию (toggle off)
          await prisma.reaction.delete({ where: { id: existing.id } });
        } else {
          // Отличается — меняем эмодзи на новый (по сути замена)
          await prisma.reaction.update({ where: { id: existing.id }, data: { emoji } });
        }
      } else {
        // Не было реакции — создаём новую
        await prisma.reaction.create({ data: { messageId, userId: uid, emoji } });
      }

      // Возвращаем обновлённый список реакций
      const reactions = await prisma.reaction.findMany({
        where: { messageId },
        include: { user: { select: { id: true, username: true, avatar: true } } }
      });
      io.emit('reaction-update', { messageId, reactions, chatId });
    });

    socket.on("subscribe", (data) => {
      const userId = data.userId;

      const existingUserIdIndex = allSockets.findIndex(
        (item) => (item.userId = userId)
      );
      if (existingUserIdIndex === -1) {
        allSockets.push({ userId, socket });
      } 
      else {
        allSockets[existingUserIdIndex].socket = socket;
      }
    });
    IO = io;
  });
}

function getWS() {
  return IO;
}

module.exports = { initWS, getWS };

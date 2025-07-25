const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Получить все чаты
exports.getChats = async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      include: {
        messages: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
            reactions: { include: { user: { select: { id: true, username: true, avatar: true } } } }
          },
          orderBy: { sentAt: 'asc' }
        }
      }
    });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chats', details: err.message });
  }
};

// Получить сообщения чата
exports.getMessages = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    // Проверяем, есть ли чат
    let chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      // Если нет — создаём
      chat = await prisma.chat.create({ data: { id: chatId, name: chatId } });
    }
    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        reactions: { include: { user: { select: { id: true, username: true, avatar: true } } } }
      },
      orderBy: { sentAt: 'asc' }
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages', details: err.message, stack: err.stack });
  }
};

// Создать чат
exports.createChat = async (req, res) => {
  try {
    const { id, name } = req.body;
    const chat = await prisma.chat.create({ data: { id, name } });
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create chat', details: err.message, stack: err.stack });
  }
};

// Отправить сообщение (текст, файл, изображение, видео, caption, preview)
exports.sendMessage = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    // Проверяем, есть ли чат
    let chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      chat = await prisma.chat.create({ data: { id: chatId, name: chatId } });
    }
    const { userId, text, fileUrl, fileType, preview, caption } = req.body;
    const message = await prisma.message.create({
      data: { chatId, userId, text, fileUrl, fileType, preview, caption }
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message', details: err.message, stack: err.stack });
  }
}; 
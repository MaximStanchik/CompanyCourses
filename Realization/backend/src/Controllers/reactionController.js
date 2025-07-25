const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Получить все реакции к сообщению
exports.getReactions = async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const reactions = await prisma.reaction.findMany({
      where: { messageId },
      include: { user: { select: { id: true, username: true, avatar: true } } }
    });
    res.json(reactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reactions', details: err.message });
  }
};

// Поставить/убрать реакцию
exports.toggleReaction = async (req, res) => {
  try {
    const { messageId, userId, emoji } = req.body;
    // Проверяем, есть ли уже такая реакция
    const existing = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      }
    });
    if (existing) {
      // Если есть — убираем
      await prisma.reaction.delete({
        where: { id: existing.id }
      });
      return res.json({ removed: true });
    } else {
      // Если нет — добавляем
      const reaction = await prisma.reaction.create({
        data: { messageId, userId, emoji }
      });
      return res.status(201).json(reaction);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle reaction', details: err.message });
  }
}; 
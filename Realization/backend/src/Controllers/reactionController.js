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

// Добавить реакцию на комментарий (лайк/дизлайк)
exports.addCommentReaction = async (req, res) => {
  try {
    const { commentId, reactionType } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.SECRET);
    const userId = decoded.id;

    const cid = parseInt(commentId);
    if (!cid || (reactionType !== 'like' && reactionType !== 'dislike')) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Проверяем текущую реакцию пользователя
    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId: {
          commentId: cid,
          userId: userId
        }
      }
    });

    // Если клик по той же реакции — удаляем (отмена)
    if (existingReaction && existingReaction.type === reactionType) {
      await prisma.commentReaction.delete({
        where: {
          commentId_userId: {
            commentId: cid,
            userId: userId
          }
        }
      });
      return res.json({ removed: true, myReaction: null });
    }

    // Иначе выставляем выбранную реакцию (или создаём)
    const upserted = await prisma.commentReaction.upsert({
      where: {
        commentId_userId: {
          commentId: cid,
          userId: userId
        }
      },
      update: { type: reactionType, updatedAt: new Date() },
      create: { commentId: cid, userId: userId, type: reactionType }
    });

    return res.json({ myReaction: upserted.type });
  } catch (err) {
    console.error('Error adding comment reaction:', err);
    res.status(500).json({ error: 'Failed to add comment reaction', details: err.message });
  }
}; 
const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const jwt = require("jsonwebtoken");
const NotificationService = require("../utils/notificationService");

class lessonController {
  constructor() {
    // Bind methods to preserve 'this' context when used as route handlers
    this.getAll = this.getAll.bind(this);
    this.create = this.create.bind(this);
    this.duplicate = this.duplicate.bind(this);
    this.remove = this.remove.bind(this);
  }

  // Get all lessons (admin only)
  async getAll(req, res) {
    try {
      const { roles } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");

      // Accept the following query params:
      //  - course  : numeric id to filter lessons belonging to a specific course
      //  - search / q : string term to search by lesson name OR course name (case-insensitive)
      const { course, search, q } = req.query;
      const searchTerm = (search || q || "").toString().trim();

      console.log('getAll lessons called with params => course:', course, 'searchTerm:', searchTerm);

      // Base filter (by course if provided)
      const whereClause = {
        ...(course ? { course_id: Number(course) } : {}),
        ...(searchTerm
          ? {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { Course: { name: { contains: searchTerm, mode: 'insensitive' } } },
              ],
            }
          : {}),
      };

      console.log('Database query where clause:', JSON.stringify(whereClause, null, 2));

      const lessons = await DbClient.lecture.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          content: true,
          course_id: true,
          videoLink: true,
          // Include course name so the frontend can display it if needed
          Course: { select: { name: true } },
        },
        orderBy: { id: 'asc' },
      });

      console.log(`Found ${lessons.length} lessons (course filter: ${course || 'any'}, search: '${searchTerm}')`);
      console.log('Sample lesson:', lessons.length > 0 ? lessons[0] : 'No lessons found');

      res.json(lessons);
    } catch (err) {
      console.error('Error in getAll lessons:', err);
      res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Unknown error',
      });
    }
  }

  // Create lesson (admin only)
  async create(req, res) {
    try {
      const { roles, id: adminId } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");

      const { title, courseId } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ message: "Title required" });
      if (title.trim().length > 64) return res.status(400).json({ message: "Max 64 characters" });

      const lesson = await DbClient.lecture.create({
        data: { name: title.trim(), content: "" },
      });

      // Отправляем уведомление пользователям курса
      if (courseId) {
        try {
          const admin = await DbClient.user.findUnique({ where: { id: adminId } });
          const adminName = admin ? admin.username || admin.email : 'Администратор';
          await NotificationService.notifyLessonAdded(courseId, title.trim(), adminName);
        } catch (notificationError) {
          console.error('Ошибка при отправке уведомления:', notificationError);
        }
      }

      res.status(201).json({ id: lesson.id });
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }

  // Duplicate
  async duplicate(req, res) {
    try {
      const { roles } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");
      const id = Number(req.params.id);
      const lesson = await DbClient.lecture.findUnique({ where: { id } });
      if (!lesson) return res.status(404).json("Not found");
      const copy = await DbClient.lecture.create({
        data: {
          name: lesson.name + " (copy)",
          content: lesson.content,
          course_id: lesson.course_id,
        },
      });
      res.status(201).json(copy);
    } catch (err) { console.error(err); res.status(500).json(err); }
  }

  // Delete
  async remove(req, res) {
    try {
      const { roles, id: adminId } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");
      const id = Number(req.params.id);
      
      // Получаем информацию об уроке до удаления
      const lesson = await DbClient.lecture.findUnique({ 
        where: { id },
        include: { Course: true }
      });
      
      await DbClient.lecture.delete({ where: { id } });
      
      // Отправляем уведомление пользователям курса
      if (lesson && lesson.Course) {
        try {
          const admin = await DbClient.user.findUnique({ where: { id: adminId } });
          const adminName = admin ? admin.username || admin.email : 'Администратор';
          await NotificationService.notifyLessonDeleted(lesson.Course.id, lesson.name, adminName);
        } catch (notificationError) {
          console.error('Ошибка при отправке уведомления:', notificationError);
        }
      }
      
      res.json({ removed: true });
    } catch (err) { console.error(err); res.status(500).json(err); }
  }

  // Get one
  async getOne(req, res) {
    try {
      const { roles } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");
      const id = Number(req.params.id);
      const lesson = await DbClient.lecture.findUnique({ where: { id } });
      if (!lesson) return res.status(404).json('Not found');
      // attach meta pin if exists
      try {
        const fs = require('fs'); const path = require('path');
        const metaDir = path.join(__dirname, '../../static/lesson-meta');
        const metaPath = path.join(metaDir, `lesson-${id}.json`);
        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          return res.json({ ...lesson, ...meta });
        }
      } catch {}
      return res.json(lesson);
    } catch (err) { console.error(err); res.status(500).json(err); }
  }

  // Update name/description
  async update(req, res) {
    try {
      const { roles, id: adminId } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");
      const id = Number(req.params.id);
      const data = {};
      if (req.body.name !== undefined) data.name = String(req.body.name);
      if (req.body.description !== undefined) data.content = String(req.body.description);
      
      // Получаем информацию об уроке до обновления
      const lesson = await DbClient.lecture.findUnique({ 
        where: { id },
        include: { Course: true }
      });
      
      const updated = await DbClient.lecture.update({ where: { id }, data });
      
      // Отправляем уведомление пользователям курса
      if (lesson && lesson.Course) {
        try {
          const admin = await DbClient.user.findUnique({ where: { id: adminId } });
          const adminName = admin ? admin.username || admin.email : 'Администратор';
          await NotificationService.notifyLessonModified(lesson.Course.id, lesson.name, adminName);
        } catch (notificationError) {
          console.error('Ошибка при отправке уведомления:', notificationError);
        }
      }
      
      res.json(updated);
    } catch (err) { console.error(err); res.status(500).json(err); }
  }

  // Patch (e.g., isPinned)
  async patch(req, res) {
    try {
      const { roles } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");
      const id = Number(req.params.id);
      const { isPinned } = req.body || {};
      const fs = require('fs'); const path = require('path');
      const metaDir = path.join(__dirname, '../../static/lesson-meta');
      if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
      const metaPath = path.join(metaDir, `lesson-${id}.json`);
      let meta = {};
      if (fs.existsSync(metaPath)) meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (typeof isPinned === 'boolean') meta.isPinned = isPinned;
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
      res.json({ id, ...meta });
    } catch (err) { console.error(err); res.status(500).json(err); }
  }

  async getSteps(req,res){
    try{ const { roles } = this._auth(req,res); if(!roles) return; if(!roles.includes('ADMIN')) return res.status(403).json('Forbidden');
      const id = Number(req.params.id);
      const steps = await DbClient.step.findMany({ where: { lesson_id: id }, orderBy: { order: 'asc' } });
      return res.json(steps);
    }catch(err){ console.error(err); res.status(500).json(err);} }

  async createStep(req,res){
    try{ 
      const { roles, id: adminId } = this._auth(req,res); 
      if(!roles) return; 
      if(!roles.includes('ADMIN')) return res.status(403).json('Forbidden');
      
      const id = Number(req.params.id);
      const count = await DbClient.step.count({ where: { lesson_id: id } });
      const created = await DbClient.step.create({ 
        data: { 
          lesson_id: id, 
          type: req.body.type || 'text', 
          title: req.body.title || '', 
          content: req.body.content || '', 
          description: req.body.description || '', 
          videoUrl: req.body.videoUrl || '', 
          order: count 
        } 
      });
      
      // Отправляем уведомление пользователям курса
      try {
        const lesson = await DbClient.lecture.findUnique({ 
          where: { id },
          include: { Course: true }
        });
        
        if (lesson && lesson.Course) {
          const admin = await DbClient.user.findUnique({ where: { id: adminId } });
          const adminName = admin ? admin.username || admin.email : 'Администратор';
          await NotificationService.notifyStepAdded(lesson.Course.id, lesson.name, req.body.title || 'Новый шаг', adminName);
        }
      } catch (notificationError) {
        console.error('Ошибка при отправке уведомления:', notificationError);
      }
      
      res.status(201).json(created);
    }catch(err){ console.error(err); res.status(500).json(err);} }

  async updateStep(req,res){
    try{ 
      const { roles, id: adminId } = this._auth(req,res); 
      if(!roles) return; 
      if(!roles.includes('ADMIN')) return res.status(403).json('Forbidden');
      
      const id = Number(req.params.id); 
      const stepId = Number(req.params.stepId);
      
      // Получаем информацию о шаге до обновления
      const step = await DbClient.step.findUnique({ 
        where: { id: stepId },
        include: { 
          Lecture: { 
            include: { Course: true } 
          } 
        }
      });
      
      const updated = await DbClient.step.update({ 
        where: { id: stepId }, 
        data: { 
          type: req.body.type, 
          title: req.body.title, 
          content: req.body.content, 
          description: req.body.description, 
          videoUrl: req.body.videoUrl 
        } 
      });
      
      // Отправляем уведомление пользователям курса
      if (step && step.Lecture && step.Lecture.Course) {
        try {
          const admin = await DbClient.user.findUnique({ where: { id: adminId } });
          const adminName = admin ? admin.username || admin.email : 'Администратор';
          await NotificationService.notifyStepModified(step.Lecture.Course.id, step.Lecture.name, req.body.title || step.title, adminName);
        } catch (notificationError) {
          console.error('Ошибка при отправке уведомления:', notificationError);
        }
      }
      
      res.json(updated);
    }catch(err){ console.error(err); res.status(500).json(err);} }

  async deleteStep(req,res){
    try{ 
      const { roles, id: adminId } = this._auth(req,res); 
      if(!roles) return; 
      if(!roles.includes('ADMIN')) return res.status(403).json('Forbidden');
      
      const id = Number(req.params.id); 
      const stepId = Number(req.params.stepId);
      
      // Получаем информацию о шаге до удаления
      const step = await DbClient.step.findUnique({ 
        where: { id: stepId },
        include: { 
          Lecture: { 
            include: { Course: true } 
          } 
        }
      });
      
      await DbClient.step.delete({ where: { id: stepId } });
      
      // reindex
      const steps = await DbClient.step.findMany({ where: { lesson_id: id }, orderBy: { order: 'asc' } });
      await Promise.all(steps.map((s, i) => DbClient.step.update({ where: { id: s.id }, data: { order: i } })));
      
      // Отправляем уведомление пользователям курса
      if (step && step.Lecture && step.Lecture.Course) {
        try {
          const admin = await DbClient.user.findUnique({ where: { id: adminId } });
          const adminName = admin ? admin.username || admin.email : 'Администратор';
          await NotificationService.notifyStepDeleted(step.Lecture.Course.id, step.Lecture.name, step.title, adminName);
        } catch (notificationError) {
          console.error('Ошибка при отправке уведомления:', notificationError);
        }
      }
      
      res.json({ removed: true });
    }catch(err){ console.error(err); res.status(500).json(err);} }

  async reorderSteps(req,res){
    try{ const { roles } = this._auth(req,res); if(!roles) return; if(!roles.includes('ADMIN')) return res.status(403).json('Forbidden');
      const id = Number(req.params.id); const stepIds = Array.isArray(req.body.stepIds)?req.body.stepIds.map(Number):[];
      await Promise.all(stepIds.map((sid, i) => DbClient.step.update({ where: { id: sid }, data: { order: i } })));
      res.json({ ok: true });
    }catch(err){ console.error(err); res.status(500).json(err);} }

  _auth(req, res) {
    const header = req.headers.authorization;
    if (!header) { res.status(401).json("Unauthorized"); return {}; }
    const parts = header.split(" "); if (parts.length!==2){ res.status(401).json("Bad auth"); return {}; }
    try {
      const token = jwt.verify(parts[1], process.env.SECRET);
      return { id: token.id, roles: token.roles || [] };
    } catch { res.status(401).json("Invalid token"); return {}; }
  }
}

module.exports = new lessonController(); 
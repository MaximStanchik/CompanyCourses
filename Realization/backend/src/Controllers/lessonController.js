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
          moduleId: true,
          order: true,
          isPinned: true,
          // Include course name so the frontend can display it if needed
          Course: { select: { name: true } },
        },
        orderBy: { id: 'asc' },
      });

      // Convert BigInt to regular numbers for JSON serialization
      const serializedLessons = lessons.map(lesson => ({
        ...lesson,
        moduleId: lesson.moduleId ? (typeof lesson.moduleId === 'bigint' ? Number(lesson.moduleId) : lesson.moduleId) : null
      }));

      console.log(`Found ${lessons.length} lessons (course filter: ${course || 'any'}, search: '${searchTerm}')`);
      console.log('Sample lesson:', lessons.length > 0 ? serializedLessons[0] : 'No lessons found');

      res.json(serializedLessons);
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

      const { title, course_id, courseId } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ message: "Title required" });
      if (title.trim().length > 64) return res.status(400).json({ message: "Max 64 characters" });

      // Используем course_id или courseId (поддержка обоих вариантов)
      const finalCourseId = course_id || courseId;
      if (!finalCourseId) return res.status(400).json({ message: "Course ID required" });

      const lesson = await DbClient.lecture.create({
        data: { 
          name: title.trim(), 
          content: "",
          course_id: parseInt(finalCourseId)
        },
      });

      // Отправляем уведомление пользователям курса
      if (finalCourseId) {
        try {
          const admin = await DbClient.user.findUnique({ where: { id: adminId } });
          const adminName = admin ? admin.username || admin.email : 'Администратор';
          await NotificationService.notifyLessonAdded(finalCourseId, title.trim(), adminName);
        } catch (notificationError) {
          console.error('Ошибка при отправке уведомления:', notificationError);
        }
      }

      // Convert BigInt to regular number for JSON serialization
      const serializedLesson = {
        ...lesson,
        moduleId: lesson.moduleId ? (typeof lesson.moduleId === 'bigint' ? Number(lesson.moduleId) : lesson.moduleId) : null
      };

      res.status(201).json(serializedLesson);
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
      
      // Получаем урок со всеми его шагами
      const lesson = await DbClient.lecture.findUnique({ 
        where: { id },
        include: {
          steps: {
            orderBy: { order: 'asc' }
          }
        }
      });
      
      if (!lesson) return res.status(404).json("Not found");
      
      // Создаем копию урока
      const copy = await DbClient.lecture.create({
        data: {
          name: lesson.name + " (copy)",
          content: lesson.content,
          course_id: lesson.course_id,
          moduleId: lesson.moduleId,
          order: lesson.order,
          videoLink: lesson.videoLink,
        },
      });
      
      // Дублируем все шаги урока
      if (lesson.steps && lesson.steps.length > 0) {
        const stepsToCreate = lesson.steps.map(step => ({
          lesson_id: copy.id,
          type: step.type,
          title: step.title,
          content: step.content,
          description: step.description,
          videoUrl: step.videoUrl,
          fileUrl: step.fileUrl,
          filename: step.filename,
          order: step.order,
        }));
        
        await DbClient.step.createMany({
          data: stepsToCreate
        });
        
        console.log(`[LessonController] Duplicated ${stepsToCreate.length} steps for lesson ${copy.id}`);
      }
      
      // Convert BigInt to regular number for JSON serialization
      const serializedCopy = {
        ...copy,
        moduleId: copy.moduleId ? (typeof copy.moduleId === 'bigint' ? Number(copy.moduleId) : copy.moduleId) : null
      };
      
      res.status(201).json(serializedCopy);
    } catch (err) { 
      console.error('[LessonController] Error in duplicate:', err); 
      res.status(500).json(err); 
    }
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
          const lessonName = lesson.name || 'Без назви';
          await NotificationService.notifyLessonDeleted(lesson.Course.id, lessonName, adminName);
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
      console.log(`[LessonController] getOne called for lesson ID: ${id}`);
      const lesson = await DbClient.lecture.findUnique({ where: { id } });
      console.log(`[LessonController] Found lesson:`, lesson);
      if (!lesson) return res.status(404).json('Not found');
      
      // Convert BigInt to regular number for JSON serialization
      const serializedLesson = {
        ...lesson,
        moduleId: lesson.moduleId ? (typeof lesson.moduleId === 'bigint' ? Number(lesson.moduleId) : lesson.moduleId) : null
      };
      console.log(`[LessonController] Serialized lesson:`, serializedLesson);
      console.log(`[LessonController] Returning lesson data:`, serializedLesson);
      return res.json(serializedLesson);
    } catch (err) { 
      console.error('[LessonController] Error in getOne:', err);
      res.status(500).json({ 
        message: 'Internal server error', 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Unknown error' 
      }); 
    }
  }

  // Update name/description
  async update(req, res) {
    try {
      const { roles, id: adminId } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");
      const id = Number(req.params.id);
      const data = {};
      
      console.log('[LessonController] Update request body:', req.body);
      console.log('[LessonController] Updating lesson ID:', id);
      
      if (req.body.name !== undefined) data.name = String(req.body.name);
      if (req.body.description !== undefined) data.content = String(req.body.description);
      if (req.body.moduleId !== undefined) data.moduleId = Number(req.body.moduleId);
      if (req.body.module_id !== undefined) data.moduleId = Number(req.body.module_id);
      if (req.body.order !== undefined) data.order = Number(req.body.order);
      
      console.log('[LessonController] Data to update:', data);
      
      // Check if lesson exists first
      const existingLesson = await DbClient.lecture.findUnique({ 
        where: { id },
        include: { Course: true }
      });
      
      if (!existingLesson) {
        console.log(`[LessonController] Lesson with ID ${id} not found in database`);
        console.log(`[LessonController] Available lessons:`, await DbClient.lecture.findMany({ select: { id: true, name: true } }));
        return res.status(404).json({ 
          message: `Lesson with ID ${id} not found`,
          availableLessons: await DbClient.lecture.findMany({ select: { id: true, name: true } })
        });
      }
      
      console.log('[LessonController] Found existing lesson:', existingLesson);
      
      const updated = await DbClient.lecture.update({ where: { id }, data });
      
      // Отправляем уведомление пользователям курса
      if (existingLesson && existingLesson.Course) {
        try {
          const admin = await DbClient.user.findUnique({ where: { id: adminId } });
          const adminName = admin ? admin.username || admin.email : 'Администратор';
          const lessonName = existingLesson.name || 'Без назви';
          await NotificationService.notifyLessonModified(existingLesson.Course.id, lessonName, adminName);
        } catch (notificationError) {
          console.error('Ошибка при отправке уведомления:', notificationError);
        }
      }
      
      // Convert BigInt to regular number for JSON serialization
      const serializedUpdated = {
        ...updated,
        moduleId: updated.moduleId ? (typeof updated.moduleId === 'bigint' ? Number(updated.moduleId) : updated.moduleId) : null
      };
      
      console.log('[LessonController] Successfully updated lesson:', serializedUpdated);
      res.json(serializedUpdated);
    } catch (err) { 
      console.error('[LessonController] Error updating lesson:', err);
      res.status(500).json({ 
        message: 'Internal server error', 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Unknown error' 
      }); 
    }
  }

  // Patch (e.g., isPinned)
  async patch(req, res) {
    try {
      const { roles } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");
      
      const id = Number(req.params.id);
      const { isPinned } = req.body || {};
      
      console.log(`[LessonController] PATCH request for lesson ${id}, isPinned:`, isPinned);
  
      // Обновляем состояние закрепления в базе данных
      if (isPinned !== undefined) {
        const updatedLesson = await DbClient.lecture.update({
          where: { id },
          data: { isPinned: Boolean(isPinned) }  // Явно преобразуем в boolean
        });
        
        console.log(`Lesson ${id} pinned status updated to: ${updatedLesson.isPinned}`);
        return res.json({ 
          id, 
          isPinned: updatedLesson.isPinned,
          message: `Lesson ${updatedLesson.isPinned ? 'pinned' : 'unpinned'} successfully`
        });
      }
      
      res.status(400).json({ message: 'isPinned field is required' });
      
    } catch (err) {
      console.error('[LessonController] Error in patch:', err);
      res.status(500).json({ 
        message: 'Internal server error', 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Unknown error' 
      });
    }
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
          fileUrl: req.body.fileUrl || '',
          filename: req.body.filename || '',
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
          const lang = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
          const lessonName = lesson.name || 'Без назви';
          await NotificationService.notifyStepAdded(lesson.Course.id, lessonName, req.body.title || 'Новый шаг', adminName, lang);
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
          Lesson: { 
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
          videoUrl: req.body.videoUrl,
          fileUrl: req.body.fileUrl,
          filename: req.body.filename
        } 
      });
      
      // Отправляем уведомление пользователям курса
      if (step && step.Lesson && step.Lesson.Course) {
        try {
          const admin = await DbClient.user.findUnique({ where: { id: adminId } });
          const adminName = admin ? admin.username || admin.email : 'Администратор';
          const lang = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
          const lessonName = step.Lesson.name || 'Без назви';
          await NotificationService.notifyStepModified(step.Lesson.Course.id, lessonName, req.body.title || step.title, adminName, lang);
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
          Lesson: { 
            include: { Course: true } 
          } 
        }
      });
      
      await DbClient.step.delete({ where: { id: stepId } });
      
      // reindex
      const steps = await DbClient.step.findMany({ where: { lesson_id: id }, orderBy: { order: 'asc' } });
      await Promise.all(steps.map((s, i) => DbClient.step.update({ where: { id: s.id }, data: { order: i } })));
      
      // Отправляем уведомление пользователям курса
      if (step && step.Lesson && step.Lesson.Course) {
        try {
          const admin = await DbClient.user.findUnique({ where: { id: adminId } });
          const adminName = admin ? admin.username || admin.email : 'Администратор';
          const lang = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
          const lessonName = step.Lesson.name || 'Без назви';
          await NotificationService.notifyStepDeleted(step.Lesson.Course.id, lessonName, step.title, adminName, lang);
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

  // Debug endpoint to check database state
  async debug(req, res) {
    try {
      const { roles } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");

      const lessons = await DbClient.lecture.findMany({
        select: { id: true, name: true, course_id: true, moduleId: true }
      });
      
      const courses = await DbClient.course.findMany({
        select: { id: true, name: true }
      });

      // Convert BigInt to regular numbers for JSON serialization
      const serializedLessons = lessons.map(lesson => ({
        ...lesson,
        moduleId: lesson.moduleId ? (typeof lesson.moduleId === 'bigint' ? Number(lesson.moduleId) : lesson.moduleId) : null
      }));

      res.json({
        lessons: serializedLessons,
        courses: courses,
        totalLessons: lessons.length,
        totalCourses: courses.length
      });
    } catch (err) {
      console.error('[LessonController] Debug error:', err);
      res.status(500).json({ message: 'Debug error', error: err.message });
    }
  }
}

module.exports = new lessonController(); 
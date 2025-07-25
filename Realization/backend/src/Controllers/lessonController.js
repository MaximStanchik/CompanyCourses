const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const jwt = require("jsonwebtoken");

class lessonController {
  // Get all lessons (admin only)
  async getAll(req, res) {
    try {
      const { roles } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");

      const lessons = await DbClient.lecture.findMany({
        select: { id: true, name: true, content: true, course_id: true },
      });
      res.json(lessons);
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }

  // Create lesson (admin only)
  async create(req, res) {
    try {
      const { roles } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");

      const { title } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ message: "Title required" });
      if (title.trim().length > 64) return res.status(400).json({ message: "Max 64 characters" });

      const lesson = await DbClient.lecture.create({
        data: { name: title.trim(), content: "" },
      });
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
      const { roles } = this._auth(req, res);
      if (!roles) return;
      if (!roles.includes("ADMIN")) return res.status(403).json("Forbidden");
      const id = Number(req.params.id);
      await DbClient.lecture.delete({ where: { id } });
      res.json({ removed: true });
    } catch (err) { console.error(err); res.status(500).json(err); }
  }

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
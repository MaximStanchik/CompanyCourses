const Router = require("express");
const router = new Router();
const lessonController = require("../Controllers/lessonController");

router.get('/lessons', lessonController.getAll.bind(lessonController));
router.post('/lessons', lessonController.create.bind(lessonController));
router.post('/lesson/:id/duplicate', lessonController.duplicate.bind(lessonController));
router.delete('/lesson/:id', lessonController.remove.bind(lessonController));

module.exports = router; 
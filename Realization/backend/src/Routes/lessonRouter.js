const Router = require("express");
const router = new Router();
const lessonController = require("../Controllers/lessonController");

router.get('/lessons', lessonController.getAll.bind(lessonController));
router.post('/lessons', lessonController.create.bind(lessonController));
router.post('/lesson/:id/duplicate', lessonController.duplicate.bind(lessonController));
router.delete('/lesson/:id', lessonController.remove.bind(lessonController));
router.get('/lessons/:id', lessonController.getOne.bind(lessonController));
router.put('/lessons/:id', lessonController.update.bind(lessonController));
router.patch('/lesson/:id', lessonController.patch.bind(lessonController));
// Steps
router.get('/lessons/:id/steps', lessonController.getSteps.bind(lessonController));
router.post('/lessons/:id/steps', lessonController.createStep.bind(lessonController));
router.put('/lessons/:id/steps/:stepId', lessonController.updateStep.bind(lessonController));
router.delete('/lessons/:id/steps/:stepId', lessonController.deleteStep.bind(lessonController));
router.put('/lessons/:id/steps/reorder', lessonController.reorderSteps.bind(lessonController));

// Debug endpoint
router.get('/lessons-debug', lessonController.debug.bind(lessonController));

module.exports = router; 
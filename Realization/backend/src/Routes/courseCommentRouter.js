const Router = require("express");
const router = new Router();
const courseCommentController = require("../Controllers/courseCommentController");

// Course comment routes
router.post("/course-comment", courseCommentController.addComment);
router.get("/course-comment/:courseId", courseCommentController.getCourseComments);
router.get("/course/:courseId/comments", courseCommentController.getCourseComments); // Новый роут
router.get("/course-comment/:courseId/count", courseCommentController.getCommentCount);
router.put("/course-comment/:commentId", courseCommentController.updateComment);
router.delete("/course-comment/:commentId", courseCommentController.deleteComment);

module.exports = router; 
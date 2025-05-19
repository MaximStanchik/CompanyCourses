const Router = require("express");
const router = new Router();
const courseController = require("../Controllers/courseController");
const { check } = require("express-validator");
const roleMiddleware = require("../Middleware/roleMiddleware");

router.post("/course/add", courseController.addCourse);
router.get("/courses", courseController.getAllCourses);
router.get("/course/", courseController.getCourseById);
router.delete("/course/", courseController.deleteCourse);
router.delete("/course/deleteByCategory/:id", courseController.deleteCoursesByCategory);
router.put("/course/", courseController.updateCourse);

module.exports = router;

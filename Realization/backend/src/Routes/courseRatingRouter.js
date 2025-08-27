const Router = require("express");
const router = new Router();
const courseRatingController = require("../Controllers/courseRatingController");

// Course rating routes
router.post("/course-rating", courseRatingController.addOrUpdateRating);
router.get("/course-rating/:courseId", courseRatingController.getUserRating);
router.get("/course/:courseId/rating/:userId", courseRatingController.getUserRating); // Новый роут
router.get("/course-rating/:courseId/stats", courseRatingController.getCourseRatingStats);
router.get("/course-rating/:courseId/all", courseRatingController.getAllCourseRatings);

module.exports = router; 
const Router = require("express");
const router = new Router();
const lectureController = require("../Controllers/lectureController");
const { check } = require("express-validator");
const roleMiddleware = require("../Middleware/roleMiddleware");

router.post("/lecture/add", lectureController.addLecture);
router.get("/lectures/", lectureController.getAllLectures);

module.exports = router;

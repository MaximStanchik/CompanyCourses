const Router = require("express");
const router = new Router();

// Заглушка для /students
router.get("/students", (req, res) => {
  res.json([]);
});

module.exports = router; 
const Router = require("express");
const router = new Router();
const categoryController = require("../Controllers/categoryController");
const { check } = require("express-validator");
const roleMiddleware = require("../Middleware/roleMiddleware");

router.post("/category/add", categoryController.addCategory);
router.get("/categories", categoryController.getAllCategories);
router.get("/category", categoryController.getCategoryById);
router.delete("/category/", categoryController.deleteCategory);
router.put("/category/", categoryController.updateCategory);

module.exports = router;

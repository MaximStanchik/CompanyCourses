const Router = require("express");
const router = new Router();
const favoriteController = require("../Controllers/favoriteController");

router.get("/favorites", favoriteController.getFavorites);
router.post("/favorites/add/:courseId", favoriteController.addFavorite);
router.delete("/favorites/:courseId", favoriteController.removeFavorite);

module.exports = router; 
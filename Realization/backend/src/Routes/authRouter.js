const Router = require("express");
const router = new Router();
const authController = require("../Controllers/authController");
const { passport, socialCallback } = require('../config/passport');

router.post("/registration", authController.registration);
router.post("/login", authController.login);
router.get("/users", authController.getUsers);
router.get("/is-admin", authController.isAdmin);
router.get("/currentUser", authController.currentUser);
router.get("/user", authController.getUserById);
router.put("/user", authController.updateUser);
router.delete("/user/", authController.deleteUser);
router.get('/check-email', authController.checkEmailExists);
router.get("/checkUsernameExists", authController.checkUsernameExists);
router.get("/verify-email", authController.verifyEmail);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), socialCallback);

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { session: false }), socialCallback);

// Yandex OAuth
router.get('/yandex', passport.authenticate('yandex'));
router.get('/yandex/callback', passport.authenticate('yandex', { session: false }), socialCallback);

// Dribbble OAuth
router.get('/dribbble', passport.authenticate('dribbble'));
router.get('/dribbble/callback', passport.authenticate('dribbble', { session: false }), socialCallback);

module.exports = router;
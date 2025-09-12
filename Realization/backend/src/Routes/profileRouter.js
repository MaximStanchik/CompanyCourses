const Router = require("express");
const router = new Router();
const profileController = require("../Controllers/profileController");
const { uploadAvatarMulter } = require('../Controllers/profileController');
const authMiddleware = require("../Middleware/authMiddleware");

// Test route
router.get("/test", (req, res) => res.json({ msg: "Profile Works" }));

// Profile routes
router.get("/", authMiddleware, profileController.getProfileByCurrentUser); // Get current user's profile
router.get("/all", authMiddleware, profileController.getAllProfiles);       // Get all profiles (admin only)
router.post("/", authMiddleware, profileController.addProfile);             // Create or edit user profile
router.get("/user/:user_id", profileController.profileByUserId); // Get profile by user ID
router.get("/handle/:handle", profileController.profileByUsername); // Get profile by handle
router.get("/check-username/:username", profileController.checkUsername);
// router.post("/avatar", profileController.uploadAvatar); // Удалено, чтобы не было ошибки undefined
router.post("/avatar-user", authMiddleware, uploadAvatarMulter, profileController.uploadUserAvatar);
router.post("/update-ip", authMiddleware, profileController.updateUserIp);
router.post("/change-password", authMiddleware, profileController.changePassword);
// Admin: update any user's profile
router.post("/admin/update", authMiddleware, uploadAvatarMulter, profileController.adminUpdateProfile);

module.exports = router;
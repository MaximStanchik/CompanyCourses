const Router = require("express");
const router = new Router();
const profileController = require("../Controllers/profileController");
const { uploadAvatarMulter } = require('../Controllers/profileController');

// Test route
router.get("/test", (req, res) => res.json({ msg: "Profile Works" }));

// Profile routes
router.get("/", profileController.getProfileByCurrentUser); // Get current user's profile
router.get("/all", profileController.getAllProfiles);       // Get all profiles (admin only)
router.post("/", profileController.addProfile);             // Create or edit user profile
router.get("/user/:user_id", profileController.profileByUserId); // Get profile by user ID
router.get("/handle/:handle", profileController.profileByUsername); // Get profile by handle
router.delete("/", profileController.deleteProfile);        // Delete profile and user
router.get("/check-username/:username", profileController.checkUsername);
// router.post("/avatar", profileController.uploadAvatar); // Удалено, чтобы не было ошибки undefined
router.post("/avatar-user", uploadAvatarMulter, profileController.uploadUserAvatar);
router.post("/update-ip", profileController.updateUserIp);
router.post("/change-password", profileController.changePassword);

module.exports = router;
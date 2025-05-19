const Router = require("express");
const router = new Router();
const profileController = require("../Controllers/profileController");
const { check } = require("express-validator");

router.get("/test", (req, res) => res.json({ msg: "Profile Works" }));
router.get("/", profileController.getProfileByCurrentUser); // Get current users profile
router.get("/all", profileController.getAllProfiles); // Get all profiles
router.post("/", profileController.addProfile); // Create or edit user profile
router.get("/user/:user_id", profileController.profileByUserId); // Get profile by user ID
router.get("/handle/:handle", profileController.profileByHandle); // Get profile by handle
router.delete("/", profileController.deleteProfile); // Delete user and profile

module.exports = router;

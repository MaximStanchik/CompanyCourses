const Router = require("express");
const router = new Router();
const authController = require("../Controllers/authController");
const {check} = require("express-validator");

router.post('/registration', [
    check('email', "Email is not correct").isEmail(),
    check('password', "Password must be longer than 3 and shorter than 12").isLength({min: 3, max: 12})
], authController.registration);
router.post('/login', authController.login);
router.get("/users", authController.getUsers);
router.get("/is-admin", authController.isAdmin);
router.get("/currentUser", authController.currentUser);
router.get("/user", authController.getUserById);
router.put("/user", authController.updateUser);
router.delete('/user/', authController.deleteUser);

module.exports = router;

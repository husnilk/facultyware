var express = require("express");
var router = express.Router();
const indexController = require("../controllers/indexController");
const authController = require("../controllers/authController");
const { isAuthenticated } = require("../middlewares/auth");

/* GET home page. */
router.get("/", indexController.index);

router.get("/home", isAuthenticated, indexController.home);

router.get("/login", authController.loginPage);

router.post("/login", authController.login);

router.get("/logout", authController.logout);

module.exports = router;

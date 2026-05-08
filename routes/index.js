var express = require("express");
var router = express.Router();
const indexController = require("../controllers/indexController");
const { isAuthenticated } = require("../middlewares/auth");
const { createRateLimiter } = require("../middlewares/rateLimit");

const passwordChangeRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `password:${req.session.userId || req.ip}`,
  message: "Too many password change attempts. Please try again in 15 minutes.",
});

/* GET home page. */
router.get("/", isAuthenticated, indexController.index);

router.get("/login", indexController.loginPage);

router.post("/login", indexController.login);

router.get("/password", isAuthenticated, indexController.passwordPage);
router.post(
  "/password",
  isAuthenticated,
  passwordChangeRateLimiter,
  indexController.changePassword,
);

router.get("/logout", indexController.logout);

module.exports = router;

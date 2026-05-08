var express = require("express");
var router = express.Router();
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const indexController = require("../controllers/indexController");
const { isAuthenticated } = require("../middlewares/auth");

const passwordChangeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.session.userId
      ? `password:user:${req.session.userId}`
      : `password:ip:${ipKeyGenerator(req.ip)}`,
  handler: (req, res) => {
    res.status(429).render("password", {
      title: "Change Password",
      user: req.session.username,
      error: "Too many password change attempts. Please try again in 15 minutes.",
      success: null,
    });
  },
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

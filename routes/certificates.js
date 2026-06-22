const express = require("express");
const router = express.Router();
const certificatesController = require("../controllers/certificatesController");
const { isAuthenticated } = require("../middlewares/auth");

router.get("/", isAuthenticated, certificatesController.index);
router.get("/:id", isAuthenticated, certificatesController.show);

module.exports = router;
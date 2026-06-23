const express = require("express");
const router = express.Router();
const participantsController = require("../controllers/participantsController");
const { isAuthenticated } = require("../middlewares/auth");

router.get("/", isAuthenticated, participantsController.index);
router.get("/:id", isAuthenticated, participantsController.detail);
router.post("/:id/status", isAuthenticated, participantsController.updateStatus);

module.exports = router;
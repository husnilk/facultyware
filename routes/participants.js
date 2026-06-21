const express = require("express");
const router = express.Router();
const participantsController = require("../controllers/participantsController");

router.get("/", participantsController.index);
router.get("/:id", participantsController.detail);
router.post("/:id/status", participantsController.updateStatus);

module.exports = router;
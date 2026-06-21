const express = require("express");
const router = express.Router();
const certificatesController = require("../controllers/certificatesController");

router.get("/", certificatesController.index);
router.get("/:id", certificatesController.show);

module.exports = router;
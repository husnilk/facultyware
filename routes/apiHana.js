const express = require("express");
const router = express.Router();
const apiHanaController = require("../controllers/apiHanaController");

router.get("/participants", apiHanaController.participants);
router.get("/participants/:id", apiHanaController.participantDetail);
router.get("/certificates", apiHanaController.certificates);
router.get("/reports", apiHanaController.reports);

module.exports = router;
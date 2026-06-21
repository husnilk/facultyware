const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");
const { uploadReport } = require("../middlewares/upload");

router.get("/", reportsController.index);
router.get("/upload", reportsController.uploadPage);
router.post("/upload", uploadReport.single("report_file"), reportsController.store);

module.exports = router;
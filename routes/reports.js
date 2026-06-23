const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");
const { uploadReport } = require("../middlewares/upload");
const { isAuthenticated } = require("../middlewares/auth");

router.get("/", isAuthenticated, reportsController.index);
router.get("/upload", isAuthenticated, reportsController.uploadPage);
router.post("/upload", isAuthenticated, uploadReport.single("report_file"), reportsController.store);

module.exports = router;
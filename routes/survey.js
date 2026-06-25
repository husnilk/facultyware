const express = require("express");
const router = express.Router();

const surveyController = require("../controllers/surveyController");
const { isAuthenticated } = require("../middlewares/auth");

// List Survey
router.get("/", isAuthenticated, surveyController.index);

// Form Tambah Survey
router.get("/create", isAuthenticated, surveyController.createForm);

// Simpan Survey
router.post("/create", isAuthenticated, surveyController.store);

// Form Edit Survey
router.get("/edit/:id", isAuthenticated, surveyController.editForm);

// Update Survey
router.post("/edit/:id", isAuthenticated, surveyController.update);

// Publish Survey
router.post("/publish/:id", isAuthenticated, surveyController.publish);

// Export PDF
router.get("/export/pdf", isAuthenticated, surveyController.exportPDF);

// Hapus Survey
router.post("/delete/:id", isAuthenticated, surveyController.destroy);

module.exports = router;
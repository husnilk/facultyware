const express = require("express");
const router = express.Router();

const questionController = require("../controllers/questionController");
const { isAuthenticated } = require("../middlewares/auth");

// Daftar semua pertanyaan
router.get("/", isAuthenticated, questionController.index);

// Daftar pertanyaan berdasarkan survey
router.get(
    "/survey/:id",
    isAuthenticated,
    questionController.bySurvey
);

// Form tambah pertanyaan untuk survey tertentu
router.get(
    "/create/:surveyId",
    isAuthenticated,
    questionController.createForm
);

// Simpan pertanyaan baru
router.post(
    "/create/:surveyId",
    isAuthenticated,
    questionController.store
);

// Form edit
router.get(
    "/edit/:id",
    isAuthenticated,
    questionController.editForm
);

// Update
router.post(
    "/edit/:id",
    isAuthenticated,
    questionController.update
);

// Hapus
router.post(
    "/delete/:id",
    isAuthenticated,
    questionController.destroy
);

module.exports = router;
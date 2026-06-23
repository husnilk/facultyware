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

// Form tambah pertanyaan
router.get("/create", isAuthenticated, questionController.createForm);
router.post("/create", isAuthenticated, questionController.store);

// Form edit pertanyaan
router.get("/edit/:id", isAuthenticated, questionController.editForm);
router.post("/edit/:id", isAuthenticated, questionController.update);

// Hapus pertanyaan
router.post("/delete/:id", isAuthenticated, questionController.destroy);

module.exports = router;
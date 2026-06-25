const express = require("express");
const router = express.Router();

const optionController = require("../controllers/optionController");

// Semua option
router.get("/", optionController.all);

// Option berdasarkan question
router.get("/question/:id", optionController.index);

// Create
router.get("/create/:questionId", optionController.createForm);
router.post("/create/:questionId", optionController.store);

// Edit
router.get("/edit/:id", optionController.editForm);
router.post("/edit/:id", optionController.update);

// Delete
router.post("/delete/:id", optionController.destroy);

module.exports = router;
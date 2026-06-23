const express = require("express");
const router = express.Router();

const surveyApiController = require("../controllers/api/surveyApiController");
const questionApiController = require("../controllers/api/questionApiController");

// API Survey
router.get("/surveys", surveyApiController.index);

// API Question
router.get("/questions", questionApiController.index);

module.exports = router;
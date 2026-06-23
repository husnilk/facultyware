const express = require("express");
const router = express.Router();

const assignmentController = require("../controllers/assignmentController");
const { isAuthenticated } = require("../middlewares/auth");

router.get("/", isAuthenticated, assignmentController.index);

router.get("/create", isAuthenticated, assignmentController.createForm);
router.post("/create", isAuthenticated, assignmentController.store);

router.get("/edit/:id", isAuthenticated, assignmentController.editForm);
router.post("/edit/:id", isAuthenticated, assignmentController.update);

router.post("/delete/:id", isAuthenticated, assignmentController.destroy);

module.exports = router;
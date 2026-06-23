const express = require("express");
const router = express.Router();

const optionController = require("../controllers/optionController");
const { isAuthenticated } = require("../middlewares/auth");

router.get("/", isAuthenticated, optionController.index);

router.get("/create", isAuthenticated, optionController.createForm);
router.post("/create", isAuthenticated, optionController.store);

router.get("/edit/:id", isAuthenticated, optionController.editForm);
router.post("/edit/:id", isAuthenticated, optionController.update);

router.post("/delete/:id", isAuthenticated, optionController.destroy);

module.exports = router;
const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategoriController');

router.get('/', kategoriController.getAllCategories);

router.get('/create', kategoriController.createCategoryForm);

router.post('/create', kategoriController.createCategorySubmit);

router.get('/search', kategoriController.searchKategori);

router.get('/edit/:id', kategoriController.editCategoryForm);

router.post('/edit/:id', kategoriController.editCategorySubmit);

router.post('/delete/:id', kategoriController.deleteCategory);

module.exports = router;
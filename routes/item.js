const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemControllers');

router.get('/', itemController.getAllItems);

router.get('/create', itemController.createItemForm);

router.post('/create', itemController.createItemSubmit);

router.get('/search', itemController.searchItems);

router.get('/edit/:id', itemController.editItemForm);

router.post('/edit/:id', itemController.editItemSubmit);

router.post('/delete/:id', itemController.deleteItem);

router.get('/export', itemController.exportItems);

router.post('/import', itemController.upload, itemController.importItems);

module.exports = router;
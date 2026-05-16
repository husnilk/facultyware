const express = require('express');
const router = express.Router();
const unitsController = require('../controllers/unitsController');
const { checkPermission } = require('../middlewares/acl');

// All unit management routes require 'manage_units' permission
router.use(checkPermission('manage_units'));

router.get('/', unitsController.list);
router.get('/new', unitsController.newUnit);
router.post('/', unitsController.createUnit);
router.get('/:id', unitsController.detailUnit);
router.get('/:id/edit', unitsController.editUnit);
router.post('/:id', unitsController.updateUnit);
router.delete('/:id', unitsController.deleteUnit);

module.exports = router;

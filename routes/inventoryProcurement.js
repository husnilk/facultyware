const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventoryProcurementController');
const { isAuthenticated } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/acl');

// Apply authentication & permission middleware to all procurement routes
router.use(isAuthenticated);
router.use(checkPermission('manage_procurement'));

// Procurement views and actions
router.get('/', controller.index);
router.get('/create', controller.create);
router.post('/create', controller.store);
router.get('/:id', controller.detail);
router.post('/:id/edit', controller.update);
router.post('/:id/delete', controller.destroy);
router.post('/:id/submit', controller.submit);
router.get('/:id/export', controller.exportPDF);

module.exports = router;

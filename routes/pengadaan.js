const express = require('express');
const router = express.Router();
const controller = require('../controllers/pengadaanController');
const { isAuthenticated } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/acl');

// Apply authentication & permission middleware to all procurement routes
router.use(isAuthenticated);
router.use(checkPermission('manage_procurement'));

// Procurement routes
router.get('/', controller.index);
router.get('/create', controller.create);
router.post('/create', controller.store);
router.get('/api/request/:requestNumber/items', controller.requestItems);
router.get('/:id', controller.detail);

module.exports = router;

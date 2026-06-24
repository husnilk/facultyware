const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/acl');
const upload = require('../middlewares/upload');
const ctrl = require('../controllers/equipmentController');

// Export (sebelum /:id agar tidak conflict)
router.get('/export', isAuthenticated, checkPermission('equipments.export'), ctrl.exportData);

// Index + Search
router.get('/', isAuthenticated, checkPermission('equipments.view'), ctrl.index);

// Create
router.get('/create', isAuthenticated, checkPermission('equipments.create'), ctrl.create);
router.post('/', isAuthenticated, checkPermission('equipments.create'),
  upload.single('photo'), ctrl.validateEquipment, ctrl.store);

// Show
router.get('/:id', isAuthenticated, checkPermission('equipments.view'), ctrl.show);

// Edit
router.get('/:id/edit', isAuthenticated, checkPermission('equipments.edit'), ctrl.edit);
// Update — daftarkan POST & PUT: form kirim _method=PUT (method-override ubah POST→PUT)
const updateEquipment = [isAuthenticated, checkPermission('equipments.edit'),
  upload.single('photo'), ctrl.validateEquipment, ctrl.update];
router.post('/:id', updateEquipment);
router.put('/:id', updateEquipment);

// Delete
router.delete('/:id', isAuthenticated, checkPermission('equipments.delete'), ctrl.destroy);

module.exports = router;

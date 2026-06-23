var express = require('express');
var router = express.Router();
const adminController = require('../controllers/adminController');
const { checkPermission } = require('../middlewares/acl');

router.get('/events', checkPermission('manage_events'), adminController.listEvents);
router.post('/events/add', checkPermission('manage_events'), adminController.addEvent);
router.post('/events/publish/:id', checkPermission('manage_events'), adminController.publishEvent);
router.post('/events/delete/:id', adminController.deleteEvent);
router.get('/api/committee/:id', adminController.apiCommittee);
router.get('/api/events/active', adminController.apiActiveEvents);
router.get('/api/events/deleted', adminController.apiDeletedEvents);
router.get('/panitia/export/:id', adminController.exportExcel);

module.exports = router;
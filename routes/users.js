const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { checkPermission } = require('../middlewares/acl');

// All user management routes require 'manage_users' permission
router.use(checkPermission('manage_users'));

router.get('/', usersController.list);
router.get('/new', usersController.newUser);
router.post('/', usersController.createUser);
router.get('/:id', usersController.detailUser);
router.get('/:id/edit', usersController.editUser);
router.post('/:id/status', usersController.toggleStatus);
router.post('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;

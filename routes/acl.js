const express = require("express");
const router = express.Router();
const aclController = require("../controllers/aclController");
const { isAuthenticated } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/acl");

// All ACL routes require authentication and manage_acl permission
router.use(isAuthenticated, checkPermission("manage_acl"));

router.get("/", aclController.index);
router.get("/roles/new", aclController.newRole);
router.post("/roles", aclController.createRole);
router.get("/roles/:id/edit", aclController.editRole);
router.post("/roles/:id", aclController.updateRole);
router.delete("/roles/:id", aclController.deleteRole);

router.get("/permissions", aclController.permissionsIndex);
router.post("/permissions", aclController.createPermission);
router.get("/permissions/:id", aclController.getPermission);
router.get("/permissions/:id/edit", aclController.editPermission);
router.post("/permissions/:id", aclController.updatePermission);
router.delete("/permissions/:id", aclController.deletePermission);

module.exports = router;

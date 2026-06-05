const db = require("../lib/db");

/**
 * ACL Middleware to check if a user has the required permission(s).
 * 
 * @param {string|string[]} requiredPermissions - A single permission or an array of permissions.
 * If an array is provided, the user must have at least one of the permissions.
 * 
 * Database Schema Requirements:
 * 
 * 1. roles: id, name
 * 2. permissions: id, name
 * 3. role_has_permissions: role_id, permission_id
 * 4. user_has_roles: user_id, role_id
 */

const checkPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const permissionsArray = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    try {
      // DB uses Spatie Laravel Permission pattern:
      // model_has_roles  (role_id, model_type, model_id)  → model_id = users.id
      // role_has_permissions (permission_id, role_id)
      // permissions (id, name, guard_name)
      const modelTypes = ['App\\Models\\User', 'App\\User'];
      const query = `
        SELECT DISTINCT p.name 
        FROM permissions p
        JOIN role_has_permissions rhp ON p.id = rhp.permission_id
        JOIN model_has_roles mhr ON rhp.role_id = mhr.role_id
        WHERE mhr.model_id = ? AND mhr.model_type IN (?) AND p.name IN (?)
      `;

      const [rows] = await db.query(query, [req.session.userId, modelTypes, permissionsArray]);
      if (rows.length > 0) {
        return next();
      }

      const directQuery = `
        SELECT DISTINCT p.name
        FROM permissions p
        JOIN model_has_permissions mhp ON p.id = mhp.permission_id
        WHERE mhp.model_id = ? AND mhp.model_type IN (?) AND p.name IN (?)
      `;

      const [directRows] = await db.query(directQuery, [req.session.userId, modelTypes, permissionsArray]);
      if (directRows.length > 0) {
        return next();
      }

      const [permRows] = await db.query('SELECT COUNT(*) AS total FROM permissions');
      const [roleRows] = await db.query('SELECT COUNT(*) AS total FROM role_has_permissions');
      const [modelRoleRows] = await db.query('SELECT COUNT(*) AS total FROM model_has_roles');
      const [modelPermRows] = await db.query('SELECT COUNT(*) AS total FROM model_has_permissions');
      const hasPermissionData = permRows[0].total > 0 || roleRows[0].total > 0 || modelRoleRows[0].total > 0 || modelPermRows[0].total > 0;

      if (!hasPermissionData) {
        const userQuery = await db.query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
        const user = userQuery[0][0];
        const userId = user?.id;
        const userName = user?.name?.toLowerCase();
        const userEmail = user?.email?.toLowerCase();

        if (process.env.MANAGER_USER_IDS) {
          const allowedIds = process.env.MANAGER_USER_IDS.split(',').map((id) => id.trim()).filter(Boolean).map(Number);
          if (allowedIds.includes(userId)) {
            return next();
          }
        }
        if (process.env.MANAGER_USERS) {
          const allowedUsers = process.env.MANAGER_USERS.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
          if (allowedUsers.includes(userName) || allowedUsers.includes(userEmail)) {
            return next();
          }
        }

        if (userId === 1 || userName === 'admin' || userEmail === 'admin@fakultas.ac.id') {
          return next();
        }
      }

      // If no matching permission found, return Forbidden
      res.status(403).render("error", {
        message: "Forbidden: You do not have permission to access this resource.",
        error: { status: 403, stack: "" }
      });
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  checkPermission
};

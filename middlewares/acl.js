const db = require("../lib/db");

/**
 * ACL Middleware to check if a user has the required permission(s).
 * 
 * @param {string|string[]} requiredPermissions - A single permission or an array of permissions.
 * If an array is provided, the user must have at least one of the permissions.
 * 
 * Database Schema (Spatie-style):
 * 
 * 1. roles: id, name, guard_name
 * 2. permissions: id, name, guard_name
 * 3. role_has_permissions: role_id, permission_id
 * 4. model_has_roles: role_id, model_type, model_id  <-- BUKAN user_has_roles!
 *    model_type = 'User', model_id = users.id
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
      // Query menggunakan model_has_roles (Spatie-style)
      const query = `
        SELECT DISTINCT p.name 
        FROM permissions p
        JOIN role_has_permissions rhp ON p.id = rhp.permission_id
        JOIN model_has_roles mhr ON rhp.role_id = mhr.role_id
        WHERE mhr.model_id = ? AND mhr.model_type = 'User' AND p.name IN (?)
      `;

      const [rows] = await db.query(query, [req.session.userId, permissionsArray]);

      if (rows.length > 0) {
        return next();
      }

      // If no matching permission found, return Forbidden
      res.status(403).render("error", {
        message: "Kamu tidak memiliki izin untuk mengakses halaman ini.",
        error: { status: 403, stack: "" },
        user: req.session?.email || null,
      });
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Memuat seluruh permission milik user yang sedang login ke res.locals,
 * sehingga view bisa menampilkan/menyembunyikan elemen sesuai hak akses.
 *
 * Menyediakan helper `can(permission)` di setiap template EJS:
 *   <% if (can('equipments.create')) { %> ... <% } %>
 */
const loadPermissions = async (req, res, next) => {
  // Default: tidak ada izin
  res.locals.permissions = [];
  res.locals.can = () => false;

  if (!req.session.userId) {
    return next();
  }

  try {
    const [rows] = await db.query(
      `SELECT DISTINCT p.name
         FROM permissions p
         JOIN role_has_permissions rhp ON p.id = rhp.permission_id
         JOIN model_has_roles mhr ON rhp.role_id = mhr.role_id
        WHERE mhr.model_id = ? AND mhr.model_type = 'User'`,
      [req.session.userId]
    );
    const perms = rows.map((r) => r.name);
    res.locals.permissions = perms;
    res.locals.can = (perm) => perms.includes(perm);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkPermission,
  loadPermissions,
};

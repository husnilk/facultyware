const db = require("../lib/db");

/**
 * ACL Middleware to check if a user has the required permission(s).
 * 
 * @param {string|string[]} requiredPermissions - A single permission or an array of permissions.
 * If an array is provided, the user must have at least one of the permissions.
 */

const checkPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    if (process.env.NODE_ENV !== 'production' && process.env.DEV_NO_AUTH === '1') {
      return next();
    }

    const isApi = req.path.startsWith('/api') || (req.headers.accept && req.headers.accept.includes('application/json'));

    if (!req.session.userId) {
      if (isApi) {
        return res.status(401).json({ message: "Unauthorized: Session expired or not logged in" });
      } else {
        return res.redirect("/login?expired=1");
      }
    }

    const permissionsArray = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    try {
      // Query to check if the user has a role that contains any of the required permissions
      const query = `
        SELECT DISTINCT p.name 
        FROM permissions p
        JOIN role_has_permissions rhp ON rhp.permission_id = p.id
        JOIN model_has_roles mhr ON mhr.role_id = rhp.role_id
        WHERE mhr.model_type = 'App\\\\Models\\\\User'
          AND mhr.model_id = ? 
          AND p.name IN (?)
      `;

      const [rows] = await db.query(query, [req.session.userId, permissionsArray]);

      if (rows.length > 0) {
        return next();
      }

      // If no matching permission found, return Forbidden
      if (isApi) {
        return res.status(403).json({ message: "Forbidden" });
      } else {
        return res.status(403).render("error", {
          message: "Akunmu tidak memiliki izin untuk membuka halaman ini.",
          error: { status: 403, stack: "" }
        });
      }
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  checkPermission
};

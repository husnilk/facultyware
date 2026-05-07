const db = require("../lib/db");

const index = async (req, res, next) => {
  try {
    const [roles] = await db.query("SELECT * FROM roles");
    
    // Fetch role-permission mappings
    const [rolePermissions] = await db.query(`
      SELECT rhp.role_id, p.name as permission_name
      FROM role_has_permissions rhp
      JOIN permissions p ON rhp.permission_id = p.id
    `);

    // Group permissions by role_id
    const roleMap = roles.map(role => {
      return {
        ...role,
        permissions: rolePermissions
          .filter(rp => rp.role_id === role.id)
          .map(rp => rp.permission_name)
      };
    });

    res.render("acl", {
      title: "Role Management",
      roles: roleMap,
      user: req.session.username
    });
  } catch (err) {
    next(err);
  }
};

const permissionsIndex = async (req, res, next) => {
  try {
    const [permissions] = await db.query("SELECT * FROM permissions ORDER BY name ASC");
    res.render("acl/permissions", {
      title: "Permission Management",
      permissions,
      user: req.session.username
    });
  } catch (err) {
    next(err);
  }
};

const newRole = async (req, res, next) => {
  try {
    const [permissions] = await db.query("SELECT * FROM permissions ORDER BY name ASC");
    res.render("acl/new_role", {
      title: "Create New Role",
      permissions,
      user: req.session.username
    });
  } catch (err) {
    next(err);
  }
};

const createRole = async (req, res, next) => {
  const { name, permissions } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query("INSERT INTO roles (name) VALUES (?)", [name]);
    const roleId = result.insertId;

    if (permissions) {
      const perms = Array.isArray(permissions) ? permissions : [permissions];
      for (const permId of perms) {
        await connection.query("INSERT INTO role_has_permissions (role_id, permission_id) VALUES (?, ?)", [roleId, permId]);
      }
    }

    await connection.commit();
    res.redirect("/acl");
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

const editRole = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [[role]] = await db.query("SELECT * FROM roles WHERE id = ?", [id]);
    if (!role) return res.status(404).send("Role not found");

    const [allPermissions] = await db.query("SELECT * FROM permissions ORDER BY name ASC");
    const [rolePermissions] = await db.query("SELECT permission_id FROM role_has_permissions WHERE role_id = ?", [id]);
    
    role.permissionIds = rolePermissions.map(rp => rp.permission_id);

    res.render("acl/edit_role", {
      title: "Edit Role",
      role,
      allPermissions,
      user: req.session.username
    });
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  const { id } = req.params;
  const { name, permissions } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query("UPDATE roles SET name = ? WHERE id = ?", [name, id]);
    await connection.query("DELETE FROM role_has_permissions WHERE role_id = ?", [id]);

    if (permissions) {
      const perms = Array.isArray(permissions) ? permissions : [permissions];
      for (const permId of perms) {
        await connection.query("INSERT INTO role_has_permissions (role_id, permission_id) VALUES (?, ?)", [id, permId]);
      }
    }

    await connection.commit();
    res.redirect("/acl");
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

const deleteRole = async (req, res, next) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM roles WHERE id = ?", [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const createPermission = async (req, res, next) => {
  const { name } = req.body;
  try {
    await db.query("INSERT INTO permissions (name) VALUES (?)", [name]);
    res.redirect("/acl/permissions");
  } catch (err) {
    next(err);
  }
};

const updatePermission = async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    await db.query("UPDATE permissions SET name = ? WHERE id = ?", [name, id]);
    
    if (req.headers["hx-request"]) {
      return res.render("partials/acl/permission-row", { 
        permission: { id, name },
        editing: false,
        layout: false 
      });
    }
    
    res.redirect("/acl/permissions");
  } catch (err) {
    next(err);
  }
};

const deletePermission = async (req, res, next) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM permissions WHERE id = ?", [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const getPermission = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [[permission]] = await db.query("SELECT * FROM permissions WHERE id = ?", [id]);
    if (!permission) return res.status(404).send("Permission not found");
    
    res.render("partials/acl/permission-row", { 
      permission,
      editing: false,
      layout: false 
    });
  } catch (err) {
    next(err);
  }
};

const editPermission = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [[permission]] = await db.query("SELECT * FROM permissions WHERE id = ?", [id]);
    if (!permission) return res.status(404).send("Permission not found");
    
    res.render("partials/acl/permission-row", { 
      permission,
      editing: true,
      layout: false 
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  permissionsIndex,
  getPermission,
  editPermission,
  newRole,
  createRole,
  editRole,
  updateRole,
  deleteRole,
  createPermission,
  updatePermission,
  deletePermission
};

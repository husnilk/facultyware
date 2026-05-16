const db = require("../lib/db");
const bcrypt = require("bcryptjs");

const list = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT u.id, u.username, u.fullname, u.email, u.active, GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_has_roles uhr ON u.id = uhr.user_id
      LEFT JOIN roles r ON uhr.role_id = r.id
    `;
    const params = [];

    if (search) {
      query += ` WHERE u.username LIKE ? OR u.fullname LIKE ? OR u.email LIKE ?`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ` GROUP BY u.id ORDER BY u.id DESC`;

    const [users] = await db.query(query, params);

    if (req.headers["hx-request"] && !req.headers["hx-boosted"]) {
      return res.render("partials/users/table_rows", { users, layout: false });
    }

    res.render("users/index", {
      title: "User Management",
      users,
      user: req.session.username,
      search
    });
  } catch (err) {
    next(err);
  }
};

const newUser = async (req, res, next) => {
  try {
    const [roles] = await db.query("SELECT * FROM roles ORDER BY name ASC");
    res.render("users/new", {
      title: "Create New User",
      roles,
      user: req.session.username
    });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  const { username, password, fullname, email, roles, active } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);
    const activeStatus = active === 'on' || active === '1' ? 1 : 0;

    const [result] = await connection.query(
      "INSERT INTO users (username, password, fullname, email, active) VALUES (?, ?, ?, ?, ?)",
      [username, hashedPassword, fullname, email, activeStatus]
    );
    const userId = result.insertId;

    if (roles) {
      const roleIds = Array.isArray(roles) ? roles : [roles];
      for (const roleId of roleIds) {
        await connection.query(
          "INSERT INTO user_has_roles (user_id, role_id) VALUES (?, ?)",
          [userId, roleId]
        );
      }
    }

    await connection.commit();
    res.redirect("/users");
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

const editUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [[userRecord]] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (!userRecord) return res.status(404).send("User not found");

    const [roles] = await db.query("SELECT * FROM roles ORDER BY name ASC");
    const [userRoles] = await db.query(
      "SELECT role_id FROM user_has_roles WHERE user_id = ?",
      [id]
    );
    
    userRecord.roleIds = userRoles.map(ur => ur.role_id);

    res.render("users/edit", {
      title: "Edit User",
      userRecord,
      roles,
      user: req.session.username
    });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { username, password, fullname, email, roles, active } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const activeStatus = active === 'on' || active === '1' ? 1 : 0;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await connection.query(
        "UPDATE users SET username = ?, password = ?, fullname = ?, email = ?, active = ? WHERE id = ?",
        [username, hashedPassword, fullname, email, activeStatus, id]
      );
    } else {
      await connection.query(
        "UPDATE users SET username = ?, fullname = ?, email = ?, active = ? WHERE id = ?",
        [username, fullname, email, activeStatus, id]
      );
    }

    await connection.query("DELETE FROM user_has_roles WHERE user_id = ?", [id]);
    if (roles) {
      const roleIds = Array.isArray(roles) ? roles : [roles];
      for (const roleId of roleIds) {
        await connection.query(
          "INSERT INTO user_has_roles (user_id, role_id) VALUES (?, ?)",
          [id, roleId]
        );
      }
    }

    await connection.commit();
    res.redirect("/users");
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const detailUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [[userRecord]] = await db.query(`
      SELECT u.id, u.username, u.fullname, u.email, u.active, u.created_at, GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_has_roles uhr ON u.id = uhr.user_id
      LEFT JOIN roles r ON uhr.role_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);
    
    if (!userRecord) return res.status(404).send("User not found");

    res.render("users/detail", {
      title: "User Details",
      userRecord,
      user: req.session.username
    });
  } catch (err) {
    next(err);
  }
};

const toggleStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const newStatus = parseInt(status);
    await db.query("UPDATE users SET active = ? WHERE id = ?", [newStatus, id]);
    
    // If it's an HTMX request, we might want to return a partial or just redirect
    if (req.headers["hx-request"]) {
      // Return to the detail page or a partial
      return res.redirect(`/users/${id}`);
    }
    
    res.redirect(`/users/${id}`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  newUser,
  createUser,
  editUser,
  updateUser,
  deleteUser,
  detailUser,
  toggleStatus
};

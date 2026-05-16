const db = require("../lib/db");

const list = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT u.*, p.name as parent_name 
      FROM organization_units u
      LEFT JOIN organization_units p ON u.parent_id = p.id
    `;
    const params = [];

    if (search) {
      query += ` WHERE u.name LIKE ? OR u.code LIKE ? OR u.type LIKE ?`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY u.id DESC`;

    const [units] = await db.query(query, params);

    if (req.headers["hx-request"] && !req.headers["hx-boosted"]) {
      return res.render("partials/units/table_rows", { units, layout: false });
    }

    res.render("units/index", {
      title: "Organization Units",
      units,
      user: req.session.username,
      search
    });
  } catch (err) {
    next(err);
  }
};

const newUnit = async (req, res, next) => {
  try {
    const [parents] = await db.query("SELECT id, name FROM organization_units ORDER BY name ASC");
    res.render("units/new", {
      title: "Create New Unit",
      parents,
      user: req.session.username
    });
  } catch (err) {
    next(err);
  }
};

const createUnit = async (req, res, next) => {
  const { name, code, parent_id, type, description } = req.body;
  try {
    await db.query(
      "INSERT INTO organization_units (name, code, parent_id, type, description) VALUES (?, ?, ?, ?, ?)",
      [name, code, parent_id || null, type, description]
    );
    res.redirect("/units");
  } catch (err) {
    next(err);
  }
};

const editUnit = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [[unit]] = await db.query("SELECT * FROM organization_units WHERE id = ?", [id]);
    if (!unit) return res.status(404).send("Unit not found");

    const [parents] = await db.query("SELECT id, name FROM organization_units WHERE id != ? ORDER BY name ASC", [id]);
    
    res.render("units/edit", {
      title: "Edit Unit",
      unit,
      parents,
      user: req.session.username
    });
  } catch (err) {
    next(err);
  }
};

const updateUnit = async (req, res, next) => {
  const { id } = req.params;
  const { name, code, parent_id, type, description } = req.body;
  try {
    await db.query(
      "UPDATE organization_units SET name = ?, code = ?, parent_id = ?, type = ?, description = ? WHERE id = ?",
      [name, code, parent_id || null, type, description, id]
    );
    res.redirect("/units");
  } catch (err) {
    next(err);
  }
};

const deleteUnit = async (req, res, next) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM organization_units WHERE id = ?", [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const detailUnit = async (req, res, next) => {
  const { id } = req.params;
  try {
    const [[unit]] = await db.query(`
      SELECT u.*, p.name as parent_name 
      FROM organization_units u
      LEFT JOIN organization_units p ON u.parent_id = p.id
      WHERE u.id = ?
    `, [id]);
    
    if (!unit) return res.status(404).send("Unit not found");

    res.render("units/detail", {
      title: "Unit Details",
      unit,
      user: req.session.username
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  newUnit,
  createUnit,
  editUnit,
  updateUnit,
  deleteUnit,
  detailUnit
};

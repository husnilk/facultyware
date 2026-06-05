const db = require('../lib/db');

// 1. Equipment Loans Dashboard
const index = async (req, res, next) => {
  try {
    const userId = req.session.userId; // this is users.id
    
    const [userRows] = await db.query(`SELECT name, email FROM users WHERE id = ?`, [userId]);
    const currentUser = userRows[0];
    // Fetch loan data for the logged-in user (employee_id matches users.id in this app)
    const [rows] = await db.query(`
      SELECT el.*, a.name AS equipment_name, a.code AS asset_code 
      FROM equipment_loans el
      JOIN equipments eq ON el.equipment_id = eq.id
      JOIN assets a ON eq.asset_id = a.id
      WHERE el.employee_id = ?
      ORDER BY el.created_at DESC
    `, [userId]);

    res.render('equipment-loans/index', { 
      title: 'Peminjaman Peralatan', 
      data: rows, 
      user: currentUser
    
    });
  } catch (err) {
    next(err);
  }
};

// 2A. Show Create Page
const createPage = async (req, res, next) => {
  try {
    // Fetch available equipments for dropdown
    const [equipments] = await db.query(`
      SELECT eq.id, a.name AS equipment_name, a.code AS asset_code 
      FROM equipments eq
      JOIN assets a ON eq.asset_id = a.id
      WHERE a.status = 'available'
    `);
    res.render('equipment-loans/create', { title: 'New Loan Request', equipments });
  } catch (err) {
    next(err);
  }
};

// 2B. Process Create Request
const create = async (req, res, next) => {
  const { equipment_id, start_date, end_date } = req.body;
  const userId = req.session.userId;

  try {
    await db.query(`
      INSERT INTO equipment_loans (equipment_id, employee_id, start_date, end_date, status, approved_by_id) 
      VALUES (?, ?, ?, ?, 'requested', 1)
    `, [equipment_id, userId, start_date, end_date]);
    
    res.redirect('/equipment-loans');
  } catch (err) {
    next(err);
  }
};

// 3A. Show Edit Page
const editPage = async (req, res, next) => {
  const loanId = req.params.id;
  const userId = req.session.userId;

  try {
    // Check if data exists and is still 'requested'
    const [rows] = await db.query('SELECT * FROM equipment_loans WHERE id = ? AND employee_id = ?', [loanId, userId]);
    if (rows.length === 0) return res.status(404).send('Data not found');
    if (rows[0].status !== 'requested') return res.status(403).send('Only requested loans can be edited');

    // Fetch equipments for dropdown
    const [equipments] = await db.query(`
      SELECT eq.id, a.name AS equipment_name, a.code AS asset_code 
      FROM equipments eq
      JOIN assets a ON eq.asset_id = a.id
    `);

    res.render('equipment-loans/edit', { title: 'Edit Loan Request', loan: rows[0], equipments });
  } catch (err) {
    next(err);
  }
};

// 3B. Process Update Request
const update = async (req, res, next) => {
  const loanId = req.params.id;
  const userId = req.session.userId;
  const { equipment_id, start_date, end_date } = req.body;

  try {
    await db.query(`
      UPDATE equipment_loans 
      SET equipment_id = ?, start_date = ?, end_date = ? 
      WHERE id = ? AND employee_id = ? AND status = 'requested'
    `, [equipment_id, start_date, end_date, loanId, userId]);
    
    res.redirect('/equipment-loans');
  } catch (err) {
    next(err);
  }
};

// 4. Process Cancel Request (Update status to rejected)
const cancel = async (req, res, next) => {
  const loanId = req.params.id;
  const userId = req.session.userId;

  try {
    await db.query(
      'UPDATE equipment_loans SET status = "cancelled" WHERE id = ? AND employee_id = ? AND status = "requested"',
      [loanId, userId]
    );
    res.redirect('/equipment-loans');
  } catch (err) {
    next(err);
  }
};

module.exports = { index, createPage, create, editPage, update, cancel };
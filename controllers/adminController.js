const db = require('../lib/db');
const ExcelJS = require('exceljs');

exports.listEvents = async (req, res) => {
    const [events] = await db.query('SELECT * FROM events');
    res.render('admin/events', { events });
};

exports.addEvent = async (req, res) => {
    await db.query('INSERT INTO events (name, status) VALUES (?, "draft")', [req.body.name]);
    res.redirect('/admin/events');
};

exports.publishEvent = async (req, res) => {
    await db.query('UPDATE events SET status = "published" WHERE id = ?', [req.params.id]);
    res.redirect('/admin/events');
};

exports.apiCommittee = async (req, res) => {
    const [data] = await db.query('SELECT * FROM committee WHERE event_id = ?', [req.params.id]);
    res.json(data);
};

exports.exportExcel = async (req, res) => {
    const [rows] = await db.query('SELECT * FROM committee WHERE event_id = ?', [req.params.id]);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Panitia');
    sheet.columns = [{header: 'Nama', key: 'name', width: 30}, {header: 'Role', key: 'role', width: 20}];
    sheet.addRows(rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=panitia.xlsx');
    await workbook.xlsx.write(res);
    res.end();
};
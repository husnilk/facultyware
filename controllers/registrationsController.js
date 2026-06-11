const db = require('../lib/db');
const crypto = require('crypto');

// Halaman katalog event untuk user
exports.index = async (req, res, next) => {
    try {
        const [events] = await db.query(
            'SELECT * FROM events WHERE status = "published" ORDER BY start_date DESC'
        );
        res.render('registrations/index', { events, title: 'Katalog Event', user: req.session.username });
    } catch (err) {
        next(err);
    }
};

// Halaman detail event
exports.detail = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM events WHERE id = ? AND status = "published"', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).render('error', { message: 'Event tidak ditemukan atau belum dipublish', error: { status: 404 } });
        }
        
        const event = rows[0];
        
        // Cek apakah user sudah daftar
        let isRegistered = false;
        if (req.session.userId) {
            const [regRows] = await db.query(
                'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
                [event.id, req.session.userId]
            );
            if (regRows.length > 0) {
                isRegistered = true;
            }
        }
        
        res.render('registrations/detail', { event, isRegistered, title: event.title, user: req.session.username });
    } catch (err) {
        next(err);
    }
};

// Form pendaftaran
exports.form = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM events WHERE id = ? AND status = "published"', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).render('error', { message: 'Event tidak ditemukan', error: { status: 404 } });
        }
        const event = rows[0];
        
        // Cek jika sudah terdaftar
        const [regRows] = await db.query(
            'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
            [event.id, req.session.userId]
        );
        
        if (regRows.length > 0) {
            return res.redirect(`/tickets/${regRows[0].ticket_number}`);
        }
        
        res.render('registrations/form', { event, title: `Daftar - ${event.title}`, user: req.session.username });
    } catch (err) {
        next(err);
    }
};

// Proses pendaftaran
exports.store = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;
        const notes = req.body.notes || '';
        
        const [events] = await db.query('SELECT * FROM events WHERE id = ? AND status = "published"', [id]);
        if (events.length === 0) {
            return res.status(404).render('error', { message: 'Event tidak ditemukan', error: { status: 404 } });
        }
        
        // Cek jika sudah terdaftar
        const [existing] = await db.query(
            'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
            [id, userId]
        );
        if (existing.length > 0) {
            return res.redirect(`/tickets/${existing[0].ticket_number}`);
        }
        
        // Generate nomor registrasi dan nomor tiket
        const regNumber = `REG-${Date.now()}-${userId}-${id}`;
        const ticketNumber = `TIX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        
        await db.query(
            `INSERT INTO event_registrations 
            (event_id, user_id, registration_number, registered_at, attendance_status, notes, ticket_number, issued_at) 
            VALUES (?, ?, ?, NOW(), 'registered', ?, ?, NOW())`,
            [id, userId, regNumber, notes, ticketNumber]
        );
        
        res.redirect(`/tickets/${ticketNumber}`);
        
    } catch (err) {
        next(err);
    }
};

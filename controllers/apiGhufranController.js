const db = require('../lib/db');
const crypto = require('crypto');
const generateQrCode = require('../utils/generateQrCode');

/**
 * REST API: Get list of published events with searching and pagination
 */
exports.getEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.q || '';
        
        let query = 'SELECT * FROM events WHERE status = "published"';
        const queryParams = [];
        
        if (search) {
            query += ' AND (title LIKE ? OR description LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        // Count total
        const [countResult] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as subquery`, queryParams);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);
        
        query += ' ORDER BY start_date DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);
        
        const [events] = await db.query(query, queryParams);
        
        res.status(200).json({
            status: 'success',
            data: events,
            meta: {
                current_page: page,
                total_pages: totalPages,
                total_items: totalItems,
                limit
            }
        });
    } catch (err) {
        console.error('API getEvents Error:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

/**
 * REST API: Register to an event
 */
exports.registerEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        let { userId, full_name, address, email, phone, notes } = req.body;
        
        if (!userId) {
            return res.status(400).json({ status: 'error', message: 'userId is required' });
        }
        
        const [events] = await db.query('SELECT * FROM events WHERE id = ? AND status = "published"', [eventId]);
        if (events.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Event not found or not published' });
        }
        
        // Check if already registered
        const [existing] = await db.query(
            'SELECT * FROM event_registrations WHERE event_id = ? AND user_id = ?',
            [eventId, userId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ 
                status: 'error', 
                message: 'User already registered to this event',
                data: { ticket_number: existing[0].ticket_number }
            });
        }
        
        // Prefill from users table if not provided
        const [users] = await db.query('SELECT name, email FROM users WHERE id = ?', [userId]);
        if (users.length > 0) {
            if (!full_name) full_name = users[0].name;
            if (!email) email = users[0].email;
        }
        
        // Generate reg & ticket
        const regNumber = `REG-${Date.now()}-${userId}-${eventId}`;
        const ticketNumber = `TIX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        
        await db.query(
            `INSERT INTO event_registrations 
            (event_id, user_id, registration_number, registered_at, attendance_status, full_name, address, email, phone, notes, ticket_number, issued_at) 
            VALUES (?, ?, ?, NOW(), 'registered', ?, ?, ?, ?, ?, ?, NOW())`,
            [eventId, userId, regNumber, full_name || '', address || '', email || '', phone || '', notes || '', ticketNumber]
        );
        
        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: {
                ticket_number: ticketNumber,
                registration_number: regNumber
            }
        });
        
    } catch (err) {
        console.error('API registerEvent Error:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

/**
 * REST API: Get ticket details
 */
exports.getTicketDetail = async (req, res) => {
    try {
        const ticketNumber = req.params.ticketNumber;
        
        const [rows] = await db.query(
            `SELECT r.*, e.title, e.start_date, e.start_time, e.venue, e.online_link, e.delivery_mode 
             FROM event_registrations r 
             JOIN events e ON r.event_id = e.id 
             WHERE r.ticket_number = ?`,
            [ticketNumber]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Ticket not found' });
        }
        
        const registration = rows[0];
        const qrCodeDataUri = await generateQrCode(registration.ticket_number);
        
        res.status(200).json({
            status: 'success',
            data: {
                ticket: registration,
                qr_code: qrCodeDataUri
            }
        });
        
    } catch (err) {
        console.error('API getTicketDetail Error:', err);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

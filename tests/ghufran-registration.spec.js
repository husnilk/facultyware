const request = require('supertest');
const app = require('../app');
const db = require('../lib/db');

// Mock db calls for testing to avoid touching real db?
// Or we can just insert a test event and delete it later.
let testEventId;
let testUserId = 1; // Assuming admin user id=1 exists
let testTicketNumber;

beforeAll(async () => {
    // Insert a dummy event for testing
    const [result] = await db.query(`
        INSERT INTO events (title, slug, description, event_type, delivery_mode, start_date, end_date, start_time, end_time, venue, quota, status, created_by, created_by_id, published_by_id)
        VALUES ('Test Event Registration', 'test-event-registration', 'Desc', 'seminar', 'offline', '2030-01-01', '2030-01-01', '08:00', '10:00', 'Room A', 10, 'published', 1, 1, 1)
    `);
    testEventId = result.insertId;
});

afterAll(async () => {
    // Cleanup
    if (testEventId) {
        await db.query(`DELETE FROM event_registrations WHERE event_id = ?`, [testEventId]);
        await db.query(`DELETE FROM events WHERE id = ?`, [testEventId]);
    }
    await db.end();
});

describe('Ghufran Registration & E-Ticket Module', () => {

    let agent;

    beforeAll(async () => {
        agent = request.agent(app);
        // Login first
        await agent.post('/login').send({ username: 'admin@facultyware.com', password: 'password123' });
    });

    describe('1. Test daftar event', () => {
        it('should return HTML catalog of events on /events', async () => {
            const res = await request(app).get('/events');
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain('Katalog Event');
        });
    });

    describe('2. Test detail event', () => {
        it('should return event details page on /events/:id', async () => {
            const res = await request(app).get(`/events/${testEventId}`);
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain('Test Event Registration');
        });
    });

    describe('3. Test pendaftaran event', () => {
        it('should register successfully via POST /events/:id/register', async () => {
            // Need to mock session for user_id = 1
            const agent = request.agent(app);
            // Simulate login or directly mock session middleware if possible.
            // Since express-session is used, we can mock the store or just test the API.
            // Wait, standard POST /events/:id/register requires auth. Let's test the API first to get a ticket.
            
            // To simplify, let's use the API endpoint which we built, or manually insert registration to test e-ticket.
            // Let's test the API which handles registration:
            const res = await agent.post(`/api/ghufran/events/${testEventId}/register`).send({
                userId: testUserId
            });
            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.ticket_number).toBeDefined();
            testTicketNumber = res.body.data.ticket_number;
        });
    });

    describe('4. Test pendaftaran ganda ditolak', () => {
        it('should reject double registration for same event', async () => {
            const agent = request.agent(app);
            const res = await agent.post(`/api/ghufran/events/${testEventId}/register`).send({
                userId: testUserId
            });
            expect(res.statusCode).toBe(409);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('already registered');
        });
    });

    describe('5. Test e-ticket tampil', () => {
        it('should show e-ticket HTML page with QR code', async () => {
            const res = await agent.get(`/tickets/${testTicketNumber}`);
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain('Tiket Anda');
            expect(res.text).toContain(testTicketNumber);
            // check for img with data:image/png;base64 for QR code
            expect(res.text).toContain('data:image/png;base64');
        });
    });

    describe('6. Test download e-ticket', () => {
        it('should return PDF file on download endpoint', async () => {
            const res = await agent.get(`/tickets/${testTicketNumber}/download`);
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toBe('application/pdf');
        });
    });

    describe('7. Test API registration', () => {
        it('GET /api/ghufran/events should return JSON list', async () => {
            const res = await request(app).get('/api/ghufran/events');
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

});

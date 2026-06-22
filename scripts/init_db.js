require('dotenv').config();
const db = require('../lib/db');
const bcrypt = require('bcrypt');

async function seedDatabase() {
    try {
        console.log('Memulai proses seeding database...');

        // 1. Buat 4 Roles
        const roles = ['pegawai', 'atasan_lvl_1', 'atasan_lvl_2', 'admin'];
        for (const role of roles) {
            await db.execute('INSERT IGNORE INTO roles (name, guard_name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', [role, 'web']);
        }
        console.log('✅ Roles berhasil dibuat!');

        // 2. Siapkan Password '123456' yang di-hash dengan bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('123456', saltRounds);

        // 3. Data 4 Akun Dummy
        const users = [
            { name: 'Pegawai', email: 'pegawai@faculty.com', role: 'pegawai' },
            { name: 'Atasan 1', email: 'atasan1@faculty.com', role: 'atasan_lvl_1' },
            { name: 'Atasan 2', email: 'atasan2@facultyw.com', role: 'atasan_lvl_2' },
            { name: 'Admin', email: 'admin@faculty.com', role: 'admin' }
        ];

        // 4. Masukkan User dan Hubungkan dengan Role (model_has_roles)
        for (const u of users) {
            // Insert User
            const [userResult] = await db.execute(
                'INSERT IGNORE INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
                [u.name, u.email, hashedPassword]
            );
            
            const userId = userResult.insertId;

            // Ambil ID Role
            const [roleResult] = await db.execute('SELECT id FROM roles WHERE name = ?', [u.role]);
            const roleId = roleResult[0].id;

            // Insert ke model_has_roles
            if (userId) {
                await db.execute(
                    'INSERT IGNORE INTO model_has_roles (role_id, model_type, model_id) VALUES (?, ?, ?)',
                    [roleId, 'User', userId] // Sesuai dengan skema Spatie Laravel (model_type = 'User' atau 'App\\Models\\User')
                );
            }
        }
        
        console.log('✅ 4 Akun Dummy berhasil dibuat dengan password: "123456"');
        process.exit();
    } catch (error) {
        console.error('❌ Gagal melakukan seeding:', error);
        process.exit(1);
    }
}

seedDatabase();
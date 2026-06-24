const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'tb_b5',
    port: 3307
  });

  try {
    console.log('Creating travel_cost_components table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS travel_cost_components (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT
      )
    `);

    console.log('Creating travel_expenses table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS travel_expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        official_travel_id INT NOT NULL,
        employee_id INT NOT NULL,
        travel_cost_component_id INT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        description TEXT,
        receipt_file VARCHAR(255),
        submitted_at DATETIME,
        verified_at DATETIME,
        status ENUM('submitted', 'approved', 'rejected') DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating official_travel_documents table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS official_travel_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        official_travel_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating official_travel_itineraries table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS official_travel_itineraries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        official_travel_id INT NOT NULL,
        date DATE NOT NULL,
        location VARCHAR(255) NOT NULL,
        activity VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating official_travel_members table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS official_travel_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        official_travel_id INT NOT NULL,
        employee_id INT NOT NULL,
        report_date DATE,
        summary TEXT,
        attachment VARCHAR(255),
        role VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert mock cost components if table is empty
    const [components] = await connection.query('SELECT COUNT(*) as count FROM travel_cost_components');
    if (components[0].count === 0) {
      console.log('Inserting default travel cost components...');
      await connection.query(`
        INSERT INTO travel_cost_components (name, code, description) VALUES
        ('Transportasi', 'TRANS', 'Biaya tiket pesawat, kereta, bus, atau taksi'),
        ('Akomodasi', 'AKOM', 'Biaya penginapan atau hotel'),
        ('Uang Saku', 'SAKU', 'Uang saku harian perjalanan dinas'),
        ('Konsumsi', 'KONS', 'Biaya makan dan konsumsi selama perjalanan dinas'),
        ('Lain-lain', 'LAIN', 'Biaya pendukung lainnya')
      `);
    }

    console.log('All local tables checked/created successfully!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await connection.end();
  }
}

main();

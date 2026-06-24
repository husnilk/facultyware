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
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);

    for (const tableName of tableNames) {
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      console.log(`Table: ${tableName} -> ${rows[0].count} rows`);
      if (rows[0].count > 0) {
        const [samples] = await connection.query(`SELECT * FROM \`${tableName}\` LIMIT 3`);
        console.log('Sample rows:', samples);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

main();

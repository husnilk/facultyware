const mysql = require('mysql2/promise');

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'tb_b5',
      port: 3307
    });
    console.log('Connected successfully to tb_b5 on 3307!');
  } catch (err) {
    console.error('Failed to connect:', err.message);
    process.exit(1);
  }

  try {
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:', tables.map(row => Object.values(row)[0]));

    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);
      console.log(`\nTable: ${tableName}`);
      console.table(columns.map(col => ({
        Field: col.Field,
        Type: col.Type,
        Null: col.Null,
        Key: col.Key,
        Default: col.Default,
        Extra: col.Extra
      })));
    }
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await connection.end();
  }
}

main();

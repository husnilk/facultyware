const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    port: 3307
  });

  try {
    const [dbs] = await connection.query('SHOW DATABASES');
    const dbNames = dbs.map(row => Object.values(row)[0]);

    for (const dbName of dbNames) {
      if (['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) continue;
      
      try {
        const [tables] = await connection.query(`SHOW TABLES FROM \`${dbName}\``);
        console.log(`Database: ${dbName} -> tables:`, tables.map(row => Object.values(row)[0]));
      } catch (err) {
        console.error(`Error reading database ${dbName}:`, err.message);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

main();

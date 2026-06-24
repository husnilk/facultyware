const mysql = require('mysql2/promise');
const fs = require('fs');

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
    
    let output = `Tables in tb_b5:\n${tableNames.join(', ')}\n\n`;

    for (const tableName of tableNames) {
      const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);
      output += `========================================\n`;
      output += `Table: ${tableName}\n`;
      output += `========================================\n`;
      output += `Field | Type | Null | Key | Default | Extra\n`;
      output += `----------------------------------------\n`;
      for (const col of columns) {
        output += `${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default} | ${col.Extra}\n`;
      }
      output += `\n`;
    }

    fs.writeFileSync('scripts/schema_info.txt', output);
    console.log('Schema info saved to scripts/schema_info.txt');
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

main();

const mysql = require('mysql2/promise');

async function main() {
  const host = '127.0.0.1';
  const port = 3306;
  const passwords = [
    '', 'root', 'admin', 'password', '123456', 'mysql',
    'admin123', 'root123', '12345678', 'password123',
    'pweb', 'tbb5', 'tbb5_pweb', 'facultyware', 'husnilk'
  ];

  let connection;
  for (const password of passwords) {
    try {
      console.log(`Trying host:${host}:${port}, user:root, password:"${password}"...`);
      connection = await mysql.createConnection({
        host: host,
        user: 'root',
        password: password,
        port: port
      });
      console.log(`Connected successfully on host:${host}:${port} with password: "${password}"!`);
      const [dbs] = await connection.query('SHOW DATABASES');
      console.log('Databases available:', dbs.map(row => Object.values(row)[0]));
      break;
    } catch (e) {
      // console.error(`Failed: ${e.message}`);
    }
  }

  if (connection) {
    await connection.end();
  } else {
    console.log('Failed to connect to port 3306 with all passwords.');
  }
}

main();

const mysql = require('mysql2/promise');

async function main() {
  const sockets = [
    '/tmp/mysql.sock',
    '/var/mysql/mysql.sock',
    '/var/run/mysqld/mysqld.sock',
    '/tmp/mysql.sock.lock'
  ];

  for (const socket of sockets) {
    try {
      console.log(`Trying socket path: ${socket}...`);
      const connection = await mysql.createConnection({
        socketPath: socket,
        user: 'root',
        password: ''
      });
      console.log(`Connected successfully via socket: ${socket}!`);
      const [dbs] = await connection.query('SHOW DATABASES');
      console.log('Databases:', dbs.map(row => Object.values(row)[0]));
      await connection.end();
    } catch (e) {
      console.error(`  Error: ${e.message}`);
    }
  }
}

main();

const bcrypt = require('bcryptjs');

async function main() {
  const hash = '$2b$10$LZ5DR2jFPvAOpD/bV5BF9ed6hqbQqUAISt5m5vh0Ou3lM2PjFD7AK';
  
  const passwordsToTest = ['pegawai', 'pimpinan', 'password', 'admin', '123456'];
  for (const pw of passwordsToTest) {
    const isMatch = await bcrypt.compare(pw, hash);
    console.log(`Password "${pw}" matches? ${isMatch}`);
  }
}

main();

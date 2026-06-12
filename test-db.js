const db = require('./lib/db');

async function main() {
  try {
    const [units] = await db.query('SELECT * FROM organization_units');
    console.log('=== Organization Units ===', units);

    const [statuses] = await db.query('SELECT * FROM employment_statuses');
    console.log('=== Employment Statuses ===', statuses);
    
    const [roles] = await db.query('SELECT * FROM roles');
    console.log('=== Roles ===', roles);
  } catch (err) {
    console.error('Error during query:', err);
  } finally {
    process.exit(0);
  }
}

main();

const assert = require('assert');
const db = require('../lib/db');
const ctrl = require('../controllers/equipmentManagerController');

const originalQuery = db.query;

async function runTests() {
  try {
    await testRejectLoan();
    await testCancelLoans();
    await testExportCSV();
    console.log('All tests passed.');
  } finally {
    db.query = originalQuery;
  }
}

async function testRejectLoan() {
  let capturedSql;
  let capturedParams;

  db.query = async (sql, params) => {
    capturedSql = sql;
    capturedParams = params;
    return [{ affectedRows: 1 }];
  };

  const req = {
    params: { id: '10' },
    session: { userId: 99 },
    get: () => '/manager'
  };

  let redirected;
  const res = {
    redirect: (url) => { redirected = url; }
  };

  await ctrl.rejectLoan(req, res, (err) => { throw err; });

  assert.strictEqual(redirected, '/manager');
  assert.ok(capturedSql.includes('UPDATE equipment_loans'));
  assert.deepStrictEqual(capturedParams, [99, 99, '10']);
}

async function testCancelLoans() {
  let capturedSql;
  let capturedParams;

  db.query = async (sql, params) => {
    capturedSql = sql;
    capturedParams = params;
    return [{ affectedRows: 2 }];
  };

  const req = {
    body: { 'ids[]': ['10', '11'] },
    session: { userId: 12 },
    get: () => '/manager?status=approved'
  };

  let redirected;
  const res = {
    redirect: (url) => { redirected = url; }
  };

  await ctrl.cancelLoans(req, res, (err) => { throw err; });

  assert.strictEqual(redirected, '/manager?status=approved');
  assert.ok(capturedSql.includes('UPDATE equipment_loans'));
  assert.deepStrictEqual(capturedParams, [12, 12, ['10', '11']]);
}

async function testExportCSV() {
  db.query = async () => [[
    {
      asset_code: 'AST-001',
      equipment_name: 'Laptop Dell Latitude 5520',
      employee_name: 'Budi Santoso',
      start_date: '2025-02-01',
      end_date: '2025-02-07',
      status: 'approved',
      created_at: '2025-01-30 02:00:00'
    }
  ]];

  const req = { query: {} };
  const headers = {};
  const res = {
    setHeader: (name, value) => { headers[name.toLowerCase()] = value; },
    send: (csv) => {
      assert.ok(csv.includes('Kode Aset'));
      assert.ok(csv.includes('Laptop Dell Latitude 5520'));
      assert.ok(csv.includes('Budi Santoso'));
      assert.ok(csv.includes('Disetujui'));
      assert.ok(csv.includes('2025'));
    }
  };

  await ctrl.exportCSV(req, res, (err) => { throw err; });

  assert.strictEqual(headers['content-type'], 'text/csv; charset=utf-8');
  assert.ok(headers['content-disposition'].includes('status-peminjaman-'));
}

runTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});

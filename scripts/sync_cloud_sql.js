// Sinkronisasi skema Cloud SQL dengan semua migrasi lokal.
// Jalankan sekali setelah import dump awal ke Cloud SQL.
//
// Penggunaan:
//   node scripts/sync_cloud_sql.js --host=IP --user=facultyware_app --password=PASS --database=facultyware
//
// Atau set variabel env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

const mysql = require('mysql2/promise');

const args = process.argv.slice(2).reduce((a, v) => {
  const [k, ...rest] = v.replace(/^--/, '').split('=');
  a[k] = rest.join('=');
  return a;
}, {});

const cfg = {
  host: args.host || process.env.DB_HOST,
  user: args.user || process.env.DB_USER,
  password: args.password || process.env.DB_PASSWORD,
  database: args.database || process.env.DB_NAME || 'facultyware',
  ssl: { rejectUnauthorized: false },
};

let conn;

async function col(table, column) {
  const [r] = await conn.query(
    `SELECT COUNT(*) n FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND column_name=?`,
    [table, column]);
  return r[0].n > 0;
}
async function tbl(table) {
  const [r] = await conn.query(
    `SELECT COUNT(*) n FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?`,
    [table]);
  return r[0].n > 0;
}
async function fk(table, name) {
  const [r] = await conn.query(
    `SELECT COUNT(*) n FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name=? AND constraint_name=? AND constraint_type='FOREIGN KEY'`,
    [table, name]);
  return r[0].n > 0;
}
async function run(sql, label) {
  try { await conn.query(sql); console.log('  +', label); }
  catch (e) { console.log('  !', label, '-', e.message); }
}

async function main() {
  console.log(`Koneksi ke ${cfg.host} sebagai ${cfg.user}...`);
  conn = await mysql.createConnection(cfg);
  console.log('OK\n');

  // 1. inventory_requests.title
  console.log('[1/7] inventory_requests.title');
  if (await col('inventory_requests', 'title')) {
    console.log('  - sudah ada');
  } else {
    await run(`ALTER TABLE inventory_requests ADD COLUMN title varchar(255) DEFAULT NULL AFTER request_number`,
      'kolom title ditambahkan');
  }

  // 2. inventory_requests.inventory_procurement_id + FK
  console.log('\n[2/7] inventory_requests.inventory_procurement_id');
  if (await col('inventory_requests', 'inventory_procurement_id')) {
    console.log('  - kolom sudah ada');
  } else {
    await run(`ALTER TABLE inventory_requests ADD COLUMN inventory_procurement_id bigint(20) unsigned DEFAULT NULL AFTER status`,
      'kolom inventory_procurement_id ditambahkan');
  }
  if (await fk('inventory_requests', 'fk_req_procurement')) {
    console.log('  - FK fk_req_procurement sudah ada');
  } else {
    await run(`ALTER TABLE inventory_requests ADD CONSTRAINT fk_req_procurement FOREIGN KEY (inventory_procurement_id) REFERENCES inventory_procurements (id) ON DELETE SET NULL`,
      'FK fk_req_procurement ditambahkan');
  }

  // 3. inventory_purchases.status enum + approval columns
  console.log('\n[3/7] inventory_purchases approval PO');
  await run(`ALTER TABLE inventory_purchases MODIFY COLUMN status ENUM('draft','pending','approved','rejected','completed') NOT NULL DEFAULT 'pending'`,
    'enum status diperluas');
  if (await col('inventory_purchases', 'approved_by')) {
    console.log('  - kolom approval sudah ada');
  } else {
    await run(`ALTER TABLE inventory_purchases ADD COLUMN approved_by bigint(20) unsigned DEFAULT NULL AFTER status, ADD COLUMN approved_at timestamp NULL DEFAULT NULL AFTER approved_by, ADD COLUMN approval_notes text DEFAULT NULL AFTER approved_at`,
      'kolom approved_by/approved_at/approval_notes ditambahkan');
  }
  if (await fk('inventory_purchases', 'fk_po_approver')) {
    console.log('  - FK fk_po_approver sudah ada');
  } else {
    await run(`ALTER TABLE inventory_purchases ADD CONSTRAINT fk_po_approver FOREIGN KEY (approved_by) REFERENCES employees (id) ON DELETE SET NULL`,
      'FK fk_po_approver ditambahkan');
  }

  // 4. suppliers table + supplier_id
  console.log('\n[4/7] suppliers & supplier_id');
  if (await tbl('suppliers')) {
    console.log('  - tabel suppliers sudah ada');
  } else {
    await run(`CREATE TABLE suppliers (id bigint(20) unsigned NOT NULL AUTO_INCREMENT, name varchar(255) NOT NULL, code varchar(100) NOT NULL UNIQUE, email varchar(255) DEFAULT NULL, phone varchar(100) DEFAULT NULL, address text DEFAULT NULL, created_at timestamp NULL DEFAULT NULL, updated_at timestamp NULL DEFAULT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      'tabel suppliers dibuat');
  }
  if (await col('inventory_purchases', 'supplier_id')) {
    console.log('  - kolom supplier_id sudah ada');
  } else {
    await run(`ALTER TABLE inventory_purchases ADD COLUMN supplier_id bigint(20) unsigned DEFAULT NULL AFTER inventory_procurement_id`,
      'kolom supplier_id ditambahkan');
  }
  if (await fk('inventory_purchases', 'fk_ip_supplier')) {
    console.log('  - FK fk_ip_supplier sudah ada');
  } else {
    await run(`ALTER TABLE inventory_purchases ADD CONSTRAINT fk_ip_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE SET NULL`,
      'FK fk_ip_supplier ditambahkan');
  }

  // 5. Fix FK inventory_procurement_id di purchases
  console.log('\n[5/7] inventory_purchases FK fix');
  // Hapus FK lama yang salah arah (ke inventory_requests) jika ada
  if (await fk('inventory_purchases', 'fk_ip_request')) {
    await run(`ALTER TABLE inventory_purchases DROP FOREIGN KEY fk_ip_request`, 'FK salah fk_ip_request (-> inventory_requests) dihapus');
  }
  // Pasang FK yang benar ke inventory_procurements
  if (await fk('inventory_purchases', 'fk_ip_procurement')) {
    console.log('  - FK fk_ip_procurement sudah ada');
  } else {
    await run(`UPDATE inventory_purchases ip LEFT JOIN inventory_procurements pr ON pr.id = ip.inventory_procurement_id SET ip.inventory_procurement_id = NULL WHERE ip.inventory_procurement_id IS NOT NULL AND pr.id IS NULL`,
      'referensi menggantung di-NULL-kan');
    await run(`ALTER TABLE inventory_purchases ADD CONSTRAINT fk_ip_procurement FOREIGN KEY (inventory_procurement_id) REFERENCES inventory_procurements (id) ON DELETE SET NULL`,
      'FK fk_ip_procurement (-> inventory_procurements) ditambahkan');
  }

  // 6. Receiving schema
  console.log('\n[6/7] receiving schema');
  if (await tbl('inventory_receiving_attachments')) {
    console.log('  - tabel inventory_receiving_attachments sudah ada');
  } else {
    await run(`CREATE TABLE inventory_receiving_attachments (id bigint(20) unsigned NOT NULL AUTO_INCREMENT, inventory_purchase_id bigint(20) unsigned NOT NULL, file_path varchar(255) NOT NULL, original_name varchar(255) DEFAULT NULL, mime_type varchar(100) DEFAULT NULL, size int(11) DEFAULT NULL, created_at timestamp NULL DEFAULT NULL, PRIMARY KEY (id), KEY idx_ira_purchase (inventory_purchase_id), CONSTRAINT fk_ira_purchase FOREIGN KEY (inventory_purchase_id) REFERENCES inventory_purchases (id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      'tabel inventory_receiving_attachments dibuat');
  }
  for (const [name, def] of [['received_quantity', 'int(11) DEFAULT NULL'], ['received_defective', 'int(11) DEFAULT NULL'], ['received_note', 'varchar(255) DEFAULT NULL']]) {
    if (await col('inventory_purchase_items', name)) {
      console.log(`  - kolom ${name} sudah ada`);
    } else {
      await run(`ALTER TABLE inventory_purchase_items ADD COLUMN ${name} ${def}`, `kolom ${name} ditambahkan`);
    }
  }
  if (await col('inventory_purchase_items', 'received_condition')) {
    await run(`ALTER TABLE inventory_purchase_items DROP COLUMN received_condition`, 'kolom usang received_condition di-DROP');
  }

  // 7. express_sessions (sudah di dump, tapi pastikan)
  console.log('\n[7/7] express_sessions');
  if (await tbl('express_sessions')) {
    console.log('  - tabel express_sessions sudah ada');
  } else {
    await run(`CREATE TABLE express_sessions (session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL, expires INT UNSIGNED NOT NULL, data MEDIUMTEXT COLLATE utf8mb4_bin NULL, PRIMARY KEY (session_id))`,
      'tabel express_sessions dibuat');
  }

  console.log('\n=== Selesai! Semua migrasi tersinkronisasi. ===');
  await conn.end();
}

main().catch(e => { console.error('GAGAL:', e.message); process.exit(1); });

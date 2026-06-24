require('dotenv').config();
const db = require('../lib/db');

const categories = [
  { code: 'KOM', name: 'Komputer & Laptop',       description: 'Perangkat komputer desktop, laptop, dan aksesorisnya' },
  { code: 'PRN', name: 'Printer & Scanner',        description: 'Perangkat cetak dan pemindai dokumen' },
  { code: 'PRY', name: 'Proyektor & Layar',        description: 'Proyektor, layar proyeksi, dan perangkat presentasi' },
  { code: 'JAR', name: 'Jaringan & Komunikasi',    description: 'Router, switch, access point, dan perangkat jaringan' },
  { code: 'AUD', name: 'Audio & Video',            description: 'Speaker, mikrofon, kamera, dan perangkat multimedia' },
  { code: 'FUR', name: 'Furnitur & Perlengkapan',  description: 'Meja, kursi, lemari, dan perlengkapan kantor' },
];

const equipments = [
  // Komputer & Laptop
  {
    name: 'Laptop Dell Latitude 5420',
    code: 'IT-LAP-001',
    acquisition_type: 'procurement',
    acquisition_date: '2022-03-15',
    acquisition_cost: 14500000,
    condition: 'good',
    status: 'in_use',
    cat: 'KOM',
    brand: 'Dell', model: 'Latitude 5420', serial_number: 'DL5420-001',
    specification: 'Intel Core i5-1135G7, RAM 8GB DDR4, SSD 256GB, Layar 14" FHD',
    useful_life: 5,
  },
  {
    name: 'Laptop HP EliteBook 840',
    code: 'IT-LAP-002',
    acquisition_type: 'procurement',
    acquisition_date: '2022-03-15',
    acquisition_cost: 16200000,
    condition: 'good',
    status: 'in_use',
    cat: 'KOM',
    brand: 'HP', model: 'EliteBook 840 G8', serial_number: 'HP840-002',
    specification: 'Intel Core i7-1165G7, RAM 16GB DDR4, SSD 512GB, Layar 14" FHD IPS',
    useful_life: 5,
  },
  {
    name: 'Laptop Lenovo ThinkPad E15',
    code: 'IT-LAP-003',
    acquisition_type: 'procurement',
    acquisition_date: '2021-08-20',
    acquisition_cost: 12800000,
    condition: 'minor_damage',
    status: 'maintenance',
    cat: 'KOM',
    brand: 'Lenovo', model: 'ThinkPad E15 Gen 2', serial_number: 'LNV-E15-003',
    specification: 'AMD Ryzen 5 5500U, RAM 8GB, SSD 512GB, Layar 15.6" FHD',
    useful_life: 5,
  },
  {
    name: 'PC Desktop Rakitan Lab 1',
    code: 'IT-DES-001',
    acquisition_type: 'procurement',
    acquisition_date: '2020-01-10',
    acquisition_cost: 8500000,
    condition: 'minor_damage',
    status: 'in_use',
    cat: 'KOM',
    brand: 'Rakitan', model: 'Custom PC 2020', serial_number: 'RAK-DES-001',
    specification: 'Intel Core i5-9400, RAM 8GB DDR4, HDD 1TB + SSD 128GB, GPU GTX 1050',
    useful_life: 5,
  },
  {
    name: 'PC Desktop Rakitan Lab 2',
    code: 'IT-DES-002',
    acquisition_type: 'procurement',
    acquisition_date: '2020-01-10',
    acquisition_cost: 8500000,
    condition: 'good',
    status: 'in_use',
    cat: 'KOM',
    brand: 'Rakitan', model: 'Custom PC 2020', serial_number: 'RAK-DES-002',
    specification: 'Intel Core i5-9400, RAM 8GB DDR4, HDD 1TB + SSD 128GB, GPU GTX 1050',
    useful_life: 5,
  },
  // Printer & Scanner
  {
    name: 'Printer Canon PIXMA G3010',
    code: 'IT-PRN-001',
    acquisition_type: 'procurement',
    acquisition_date: '2021-05-12',
    acquisition_cost: 1850000,
    condition: 'good',
    status: 'available',
    cat: 'PRN',
    brand: 'Canon', model: 'PIXMA G3010', serial_number: 'CAN-G3010-001',
    specification: 'Printer Ink Tank Warna, Cetak/Salin/Pindai, Koneksi WiFi, A4',
    useful_life: 4,
  },
  {
    name: 'Printer Epson L3210',
    code: 'IT-PRN-002',
    acquisition_type: 'procurement',
    acquisition_date: '2022-09-01',
    acquisition_cost: 2100000,
    condition: 'good',
    status: 'in_use',
    cat: 'PRN',
    brand: 'Epson', model: 'EcoTank L3210', serial_number: 'EPS-L3210-002',
    specification: 'All-in-One Ink Tank, Print/Scan/Copy, USB, Kecepatan 10 ppm',
    useful_life: 4,
  },
  {
    name: 'Printer Laser HP LaserJet M107w',
    code: 'IT-PRN-003',
    acquisition_type: 'procurement',
    acquisition_date: '2020-11-20',
    acquisition_cost: 1950000,
    condition: 'major_damage',
    status: 'retired',
    cat: 'PRN',
    brand: 'HP', model: 'LaserJet M107w', serial_number: 'HP-M107-003',
    specification: 'Printer Laser Hitam Putih, WiFi, USB, Kecepatan 20 ppm',
    useful_life: 4,
  },
  // Proyektor & Layar
  {
    name: 'Proyektor Epson EB-X41',
    code: 'IT-PRY-001',
    acquisition_type: 'procurement',
    acquisition_date: '2021-07-05',
    acquisition_cost: 5800000,
    condition: 'good',
    status: 'available',
    cat: 'PRY',
    brand: 'Epson', model: 'EB-X41', serial_number: 'EPS-EBX41-001',
    specification: '3600 Lumens, XGA 1024x768, HDMI/VGA, Zoom 1.2x, Lamp 6000 jam',
    useful_life: 6,
  },
  {
    name: 'Proyektor BenQ MX550',
    code: 'IT-PRY-002',
    acquisition_type: 'grant',
    acquisition_date: '2022-01-15',
    acquisition_cost: null,
    condition: 'good',
    status: 'in_use',
    cat: 'PRY',
    brand: 'BenQ', model: 'MX550', serial_number: 'BNQ-MX550-002',
    specification: '3600 Lumens, XGA, HDMI/VGA/USB, SmartEco Mode, Lamp 10000 jam',
    useful_life: 6,
  },
  {
    name: 'Layar Proyektor 100 inch',
    code: 'IT-PRY-003',
    acquisition_type: 'procurement',
    acquisition_date: '2021-07-05',
    acquisition_cost: 850000,
    condition: 'good',
    status: 'available',
    cat: 'PRY',
    brand: 'Brite', model: 'Manual Screen 100"', serial_number: 'BRT-SCR-003',
    specification: 'Layar Proyeksi Manual 100 inch, Rasio 4:3, Bahan Matte White',
    useful_life: 8,
  },
  // Jaringan
  {
    name: 'Switch Cisco Catalyst 2960',
    code: 'IT-JAR-001',
    acquisition_type: 'procurement',
    acquisition_date: '2019-06-10',
    acquisition_cost: 9500000,
    condition: 'good',
    status: 'in_use',
    cat: 'JAR',
    brand: 'Cisco', model: 'Catalyst WS-C2960-24TT-L', serial_number: 'CSC-2960-001',
    specification: '24-Port 10/100 + 2 Uplink Gigabit, Layer 2 Managed Switch',
    useful_life: 7,
  },
  {
    name: 'Access Point Ubiquiti UniFi AP AC',
    code: 'IT-JAR-002',
    acquisition_type: 'procurement',
    acquisition_date: '2021-03-22',
    acquisition_cost: 2200000,
    condition: 'good',
    status: 'in_use',
    cat: 'JAR',
    brand: 'Ubiquiti', model: 'UniFi AP AC Lite', serial_number: 'UBQ-APAC-002',
    specification: 'Dual-Band 2.4/5GHz, 867 Mbps, PoE, Indoor Ceiling Mount',
    useful_life: 5,
  },
  // Audio & Video
  {
    name: 'Kamera DSLR Canon EOS 2000D',
    code: 'IT-AUD-001',
    acquisition_type: 'procurement',
    acquisition_date: '2020-08-17',
    acquisition_cost: 5200000,
    condition: 'good',
    status: 'available',
    cat: 'AUD',
    brand: 'Canon', model: 'EOS 2000D', serial_number: 'CAN-2000D-001',
    specification: '24.1 MP APS-C, Video Full HD, WiFi, Kit Lensa 18-55mm',
    useful_life: 6,
  },
  {
    name: 'Speaker Aktif Polytron PAS 8E28',
    code: 'IT-AUD-002',
    acquisition_type: 'procurement',
    acquisition_date: '2022-04-10',
    acquisition_cost: 750000,
    condition: 'good',
    status: 'in_use',
    cat: 'AUD',
    brand: 'Polytron', model: 'PAS 8E28', serial_number: 'PLT-PAS-002',
    specification: 'Speaker Aktif 2.0, Daya 60W, Bluetooth, USB/SD/FM Radio, AUX',
    useful_life: 4,
  },
  // Furnitur
  {
    name: 'Meja Rapat 12 Orang',
    code: 'FUR-MJR-001',
    acquisition_type: 'procurement',
    acquisition_date: '2018-09-01',
    acquisition_cost: 7500000,
    condition: 'minor_damage',
    status: 'in_use',
    cat: 'FUR',
    brand: 'Olympic', model: 'Conference Table 240cm', serial_number: 'OLY-MJR-001',
    specification: 'Meja Rapat Panjang 240x120cm, Bahan MDF, Kapasitas 12 orang',
    useful_life: 10,
  },
  {
    name: 'Kursi Ergonomis Staff',
    code: 'FUR-KRS-001',
    acquisition_type: 'procurement',
    acquisition_date: '2021-01-20',
    acquisition_cost: 1200000,
    condition: 'good',
    status: 'in_use',
    cat: 'FUR',
    brand: 'Chitose', model: 'Ergonomic Chair Series', serial_number: 'CTS-KRS-001',
    specification: 'Kursi Ergonomis dengan lumbar support, adjustable height, armrest',
    useful_life: 7,
  },
  {
    name: 'Lemari Arsip 2 Pintu',
    code: 'FUR-LMR-001',
    acquisition_type: 'procurement',
    acquisition_date: '2017-05-15',
    acquisition_cost: 2800000,
    condition: 'minor_damage',
    status: 'available',
    cat: 'FUR',
    brand: 'Brother', model: 'Steel Cabinet 2 Door', serial_number: 'BRO-LMR-001',
    specification: 'Lemari Baja 2 Pintu, 4 Rak, Kunci, Ukuran 90x45x180cm',
    useful_life: 15,
  },
];

async function seed() {
  const conn = await db.getConnection();
  try {
    console.log('=== FacultyWare Dummy Data Seeder ===\n');

    // 1. Seed categories
    console.log('[Kategori] Seeding...');
    const catIds = {};
    for (const c of categories) {
      const [existing] = await conn.query(
        'SELECT id FROM equipment_categories WHERE code = ?', [c.code]
      );
      if (existing.length > 0) {
        catIds[c.code] = existing[0].id;
        console.log(`  Kategori "${c.name}": sudah ada (id=${existing[0].id})`);
      } else {
        const [r] = await conn.query(
          `INSERT INTO equipment_categories (code, name, description, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [c.code, c.name, c.description]
        );
        catIds[c.code] = r.insertId;
        console.log(`  Kategori "${c.name}": DIBUAT (id=${r.insertId})`);
      }
    }

    // 2. Seed equipment assets
    console.log('\n[Aset] Seeding...');
    let created = 0, skipped = 0;
    for (const eq of equipments) {
      const [existing] = await conn.query(
        'SELECT id FROM assets WHERE code = ?', [eq.code]
      );
      if (existing.length > 0) {
        console.log(`  Aset "${eq.name}": sudah ada, dilewati`);
        skipped++;
        continue;
      }

      await conn.beginTransaction();
      try {
        const [assetResult] = await conn.query(
          `INSERT INTO assets
             (name, code, type, acquisition_type, acquisition_date,
              acquisition_cost, \`condition\`, status, created_at, updated_at)
           VALUES (?, ?, 'equipment', ?, ?, ?, ?, ?, NOW(), NOW())`,
          [eq.name, eq.code, eq.acquisition_type, eq.acquisition_date,
           eq.acquisition_cost, eq.condition, eq.status]
        );
        const assetId = assetResult.insertId;

        await conn.query(
          `INSERT INTO equipments
             (asset_id, category_id, brand, model, serial_number,
              specification, useful_life, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [assetId, catIds[eq.cat], eq.brand, eq.model,
           eq.serial_number, eq.specification, eq.useful_life]
        );

        await conn.commit();
        console.log(`  Aset "${eq.name}": DIBUAT (asset_id=${assetId})`);
        created++;
      } catch (err) {
        await conn.rollback();
        console.error(`  Aset "${eq.name}": GAGAL — ${err.message}`);
      }
    }

    console.log(`\n✅ Selesai! ${created} aset dibuat, ${skipped} dilewati.`);
    console.log(`   ${categories.length} kategori tersedia.`);
    process.exit(0);
  } catch (err) {
    await conn.rollback();
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    conn.release();
  }
}

seed();

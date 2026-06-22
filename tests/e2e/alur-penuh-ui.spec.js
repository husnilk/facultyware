// Alur penuh pengadaan lewat interaksi browser sungguhan: tiap form diisi dan
// tiap tombol diklik, sehingga rekaman video menampilkan langkah pengguna utuh.
// Melengkapi alur-penuh.spec.js yang memakai HTTP request untuk verifikasi cepat.
//
// Test menulis data lalu membersihkannya sendiri lewat DB pada afterAll.
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');
const { createTestDb } = require('./db');

// Jeda antarlangkah agar pergerakan jelas terlihat di video.
const beat = (page, ms = 1100) => page.waitForTimeout(ms);

// Perlambat setiap aksi (klik / isi) khusus file ini supaya video mudah diikuti.
test.use({ launchOptions: { slowMo: 450 } });

test.describe('Alur penuh pengadaan (UI)', () => {
  const db = createTestDb();
  const ctx = {};
  const stamp = Date.now();
  const judulPermintaan = `E2E UI Permintaan ${stamp}`;
  const judulPengadaan = `E2E UI Pengadaan ${stamp}`;
  const namaBarang = `Barang UI ${stamp}`;

  test('admin & wakil dekan menjalankan pengadaan dari permintaan hingga penerimaan final', async ({ page }) => {
    test.setTimeout(180_000);

    // Admin membuat permintaan (1 barang, jumlah 5).
    await login(page, 'admin');
    await page.goto('/procurement/create');
    await page.fill('#title', judulPermintaan);
    await page.locator('input[name="item_name"]').first().fill(namaBarang);
    await page.locator('input[name="quantity"]').first().fill('5');
    await beat(page);
    await Promise.all([
      page.waitForURL('**/procurement', { timeout: 15_000 }),
      page.getByRole('button', { name: 'Kirim Permintaan' }).click(),
    ]);

    let [rows] = await db.query(
      'SELECT id, request_number FROM inventory_requests WHERE title = ? ORDER BY id DESC LIMIT 1',
      [judulPermintaan]
    );
    expect(rows.length, 'permintaan tersimpan').toBe(1);
    ctx.reqId = rows[0].id;
    ctx.reqNumber = rows[0].request_number;

    // Wakil dekan menyetujui permintaan lewat dialog konfirmasi.
    await page.goto('/logout');
    await page.waitForURL('**/login', { timeout: 10_000 });
    await login(page, 'wadir');
    await page.goto(`/approval/${ctx.reqId}`);
    await expect(page.locator('h1')).toContainText('Detail Permintaan');
    await page.getByRole('button', { name: 'Setujui Permintaan' }).click();
    await expect(page.locator('#dialog-approve')).toBeVisible();
    await beat(page);
    await Promise.all([
      page.waitForURL('**/approval**', { timeout: 15_000 }),
      page.locator('#dialog-approve').getByRole('button', { name: 'Ya, Setujui' }).click(),
    ]);
    [rows] = await db.query('SELECT status FROM inventory_requests WHERE id = ?', [ctx.reqId]);
    expect(rows[0].status).toBe('approved');

    // Admin mengonsolidasi permintaan menjadi pengadaan (centang lalu simpan).
    await page.goto('/logout');
    await page.waitForURL('**/login', { timeout: 10_000 });
    await login(page, 'admin');
    await page.goto('/pengadaan/create');
    await page.fill('#title', judulPengadaan);
    const chk = page.locator(`.req-check[value="${ctx.reqNumber}"]`);
    await expect(chk).toBeVisible({ timeout: 5_000 });
    await chk.check();
    await beat(page);
    await Promise.all([
      page.waitForURL('**/pengadaan', { timeout: 15_000 }),
      page.getByRole('button', { name: 'Simpan Pengadaan' }).click(),
    ]);
    [rows] = await db.query(
      'SELECT id FROM inventory_procurements WHERE title = ? ORDER BY id DESC LIMIT 1',
      [judulPengadaan]
    );
    expect(rows.length, 'pengadaan tersimpan').toBe(1);
    ctx.procId = rows[0].id;

    // Admin membuat PO: pilih pengadaan, tunggu tabel harga, pilih supplier, isi harga.
    await page.goto('/purchase/create');
    await page.locator('#procurement_id').selectOption(String(ctx.procId));
    const priceInput = page.locator('input[name="prices[]"]').first();
    await expect(priceInput).toBeVisible({ timeout: 10_000 });
    const supplierSelect = page.locator('#supplier_id');
    const supplierValue = await supplierSelect.locator('option').nth(1).getAttribute('value');
    await supplierSelect.selectOption(supplierValue);
    await page.fill('#purchase_date', new Date().toISOString().slice(0, 10));
    await priceInput.fill('15000');
    await beat(page);
    await Promise.all([
      page.waitForURL('**/purchase', { timeout: 15_000 }),
      page.getByRole('button', { name: 'Simpan PO' }).click(),
    ]);
    [rows] = await db.query(
      'SELECT id, purchase_number FROM inventory_purchases WHERE inventory_procurement_id = ? ORDER BY id DESC LIMIT 1',
      [ctx.procId]
    );
    expect(rows.length, 'PO tersimpan').toBe(1);
    ctx.poId = rows[0].id;
    ctx.poNumber = rows[0].purchase_number;

    // Wakil dekan menyetujui PO (gerbang kedua, sadar-harga).
    await page.goto('/logout');
    await page.waitForURL('**/login', { timeout: 10_000 });
    await login(page, 'wadir');
    await page.goto(`/purchase/${ctx.poId}`);
    await expect(page.locator('h1')).toContainText('Detail Purchase Order');
    await Promise.all([
      page.waitForURL('**/purchase/**', { timeout: 15_000 }),
      page.getByRole('button', { name: 'Setujui PO' }).click(),
    ]);
    [rows] = await db.query('SELECT status FROM inventory_purchases WHERE id = ?', [ctx.poId]);
    expect(rows[0].status).toBe('approved');

    // Admin memverifikasi penerimaan: isi 3 baik, sisa cacat dihitung otomatis (2).
    await page.goto('/logout');
    await page.waitForURL('**/login', { timeout: 10_000 });
    await login(page, 'admin');
    const [pis] = await db.query(
      'SELECT id, item_id FROM inventory_purchase_items WHERE inventory_purchase_id = ?',
      [ctx.poId]
    );
    expect(pis.length).toBe(1);
    ctx.piId = pis[0].id;
    ctx.itemId = pis[0].item_id;

    await page.goto(`/receiving/${ctx.poId}/verify`);
    await expect(page.locator('h1')).toContainText('Verifikasi Penerimaan');
    const goodInput = page.locator(`input[name="good_qty[${ctx.piId}]"]`);
    const defInput = page.locator(`input[name="defective_qty[${ctx.piId}]"]`);
    await goodInput.fill('3');
    await page.waitForTimeout(300); // tunggu JS menghitung ulang cacat
    await expect(defInput).toHaveValue('2');
    await Promise.all([
      page.waitForURL('**/receiving/**', { timeout: 15_000 }),
      page.getByRole('button', { name: 'Simpan Verifikasi' }).click(),
    ]);
    [rows] = await db.query(
      'SELECT received_quantity, received_defective FROM inventory_purchase_items WHERE id = ?',
      [ctx.piId]
    );
    expect(Number(rows[0].received_quantity)).toBe(3);
    expect(Number(rows[0].received_defective)).toBe(2);

    // Admin mencatat barang ganti 2 lewat dialog untuk menutup yang cacat.
    await page.goto(`/receiving/${ctx.poId}/detail`);
    await expect(page.locator('h1')).toContainText('Detail Penerimaan');
    await page.getByRole('button', { name: 'Catat Barang Ganti' }).click();
    await expect(page.locator('#dialog-replacement')).toBeVisible();
    await beat(page);
    await page.locator('#repl-item').selectOption(String(ctx.itemId));
    await page.fill('#repl-qty', '2');
    await Promise.all([
      page.waitForURL('**/receiving/**', { timeout: 15_000 }),
      page.locator('#dialog-replacement').getByRole('button', { name: 'Simpan Barang Ganti' }).click(),
    ]);

    // Cacat tertutup & riwayat barang ganti tercatat.
    await page.goto(`/receiving/${ctx.poId}/detail`);
    await expect(page.locator('.cond-cacat')).toHaveCount(0);
    await expect(page.getByText('Riwayat Barang Ganti')).toBeVisible();
    await beat(page);

    // Konfirmasi final: catat ke buku besar, PO jadi Selesai, permintaan terpenuhi.
    await page.getByRole('button', { name: 'Konfirmasi Final' }).click();
    await expect(page.locator('#dialog-confirm')).toBeVisible();
    await beat(page);
    await Promise.all([
      page.waitForURL('**/receiving/**', { timeout: 15_000 }),
      page.locator('#dialog-confirm').getByRole('button', { name: 'Ya, Konfirmasi' }).click(),
    ]);

    // Penerimaan terkunci & status final terverifikasi di DB.
    await expect(page.getByText(/Penerimaan sudah final/i)).toBeVisible();
    [rows] = await db.query('SELECT status FROM inventory_purchases WHERE id = ?', [ctx.poId]);
    expect(rows[0].status).toBe('completed');
    [rows] = await db.query('SELECT status FROM inventory_requests WHERE id = ?', [ctx.reqId]);
    expect(rows[0].status).toBe('fulfilled');
    [rows] = await db.query('SELECT COUNT(*) AS n FROM inventory_transactions WHERE reference = ?', [ctx.poNumber]);
    expect(Number(rows[0].n), 'transaksi barang masuk tercatat').toBeGreaterThan(0);
    await beat(page);
  });

  // Bersih-bersih: hapus seluruh jejak data uji mengikuti relasi antar tabel.
  test.afterAll(async () => {
    const q = async (sql, p) => { try { await db.query(sql, p); } catch (e) { /* abaikan saat bersih-bersih */ } };
    if (ctx.poNumber) await q('DELETE FROM inventory_transactions WHERE reference = ?', [ctx.poNumber]);
    if (ctx.poId) {
      await q('DELETE FROM inventory_receiving_attachments WHERE inventory_purchase_id = ?', [ctx.poId]);
      await q('DELETE FROM inventory_purchase_items WHERE inventory_purchase_id = ?', [ctx.poId]);
      await q('DELETE FROM inventory_purchases WHERE id = ?', [ctx.poId]);
    }
    if (ctx.reqId) {
      await q('DELETE FROM inventory_request_approvals WHERE inventory_request_id = ?', [ctx.reqId]);
      await q('DELETE FROM inventory_request_details WHERE inventory_request_id = ?', [ctx.reqId]);
      await q('DELETE FROM inventory_requests WHERE id = ?', [ctx.reqId]);
    }
    if (ctx.procId) {
      await q('DELETE FROM inventory_procurement_items WHERE inventory_procurement_id = ?', [ctx.procId]);
      await q('DELETE FROM inventory_procurements WHERE id = ?', [ctx.procId]);
    }
    if (ctx.itemId) await q('DELETE FROM items WHERE id = ?', [ctx.itemId]);
    await db.end();
  });
});

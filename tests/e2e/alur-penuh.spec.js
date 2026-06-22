// Alur penuh lintas-role: permintaan -> disetujui Wadir -> dikonsolidasi jadi
// pengadaan -> PO -> disetujui Wadir -> verifikasi penerimaan (ada cacat) ->
// barang ganti menutup cacat.
//
// Test ini menulis data lalu membersihkannya sendiri lewat DB pada afterAll,
// memakai koneksi lib/db. Aksi POST yang sukses menjawab 302 (redirect); test
// tidak mengikuti redirect agar hasil tidak bergantung pada izin halaman tujuan,
// keberhasilan dipastikan lewat status 302 dan pengecekan langsung ke DB.
const { test, expect } = require('@playwright/test');
const { loginRequest, postNoRedirect } = require('./helpers');
const { createTestDb } = require('./db');

test.describe('Alur penuh pengadaan', () => {
  const db = createTestDb();
  const ctx = {};
  const stamp = Date.now();
  const judulPermintaan = `E2E Permintaan ${stamp}`;
  const judulPengadaan = `E2E Pengadaan ${stamp}`;
  const namaBarang = `Barang E2E ${stamp}`;

  test('permintaan disetujui, dikonsolidasi jadi PO, lalu barang ganti menutup cacat', async ({ page }) => {
    test.setTimeout(60_000);

    // Admin membuat permintaan (1 barang, jumlah 5).
    await loginRequest(page, 'admin');
    let r = await postNoRedirect(page, '/procurement/create', { title: judulPermintaan, item_name: namaBarang, quantity: '5' });
    expect(r.status(), 'buat permintaan').toBe(302);
    let [rows] = await db.query(
      'SELECT id, request_number FROM inventory_requests WHERE title = ? ORDER BY id DESC LIMIT 1',
      [judulPermintaan]
    );
    expect(rows.length, 'permintaan tersimpan').toBe(1);
    ctx.reqId = rows[0].id;
    ctx.reqNumber = rows[0].request_number;

    // Wakil dekan menyetujui permintaan.
    await loginRequest(page, 'wadir');
    r = await postNoRedirect(page, `/approval/${ctx.reqId}/approve`);
    expect(r.status(), 'setujui permintaan').toBe(302);
    [rows] = await db.query('SELECT status FROM inventory_requests WHERE id = ?', [ctx.reqId]);
    expect(rows[0].status).toBe('approved');

    // Admin mengonsolidasi permintaan menjadi satu pengadaan.
    await loginRequest(page, 'admin');
    r = await postNoRedirect(page, '/pengadaan/create', { title: judulPengadaan, request_number: ctx.reqNumber });
    expect(r.status(), 'buat pengadaan').toBe(302);
    [rows] = await db.query(
      'SELECT id FROM inventory_procurements WHERE title = ? ORDER BY id DESC LIMIT 1',
      [judulPengadaan]
    );
    expect(rows.length, 'pengadaan tersimpan').toBe(1);
    ctx.procId = rows[0].id;

    // Admin membuat PO dari pengadaan tersebut.
    const [sup] = await db.query('SELECT id FROM suppliers ORDER BY id LIMIT 1');
    expect(sup.length, 'butuh minimal 1 supplier').toBeGreaterThan(0);
    const today = new Date().toISOString().slice(0, 10);
    r = await postNoRedirect(page, '/purchase/create', {
      inventory_procurement_id: String(ctx.procId),
      supplier_id: String(sup[0].id),
      purchase_date: today,
      prices: '15000',
    });
    expect(r.status(), 'buat PO').toBe(302);
    [rows] = await db.query(
      'SELECT id, purchase_number FROM inventory_purchases WHERE inventory_procurement_id = ? ORDER BY id DESC LIMIT 1',
      [ctx.procId]
    );
    expect(rows.length, 'PO tersimpan').toBe(1);
    ctx.poId = rows[0].id;
    ctx.poNumber = rows[0].purchase_number;

    // Wakil dekan menyetujui PO (gerbang kedua, sadar-harga).
    await loginRequest(page, 'wadir');
    r = await postNoRedirect(page, `/purchase/${ctx.poId}/approve`);
    expect(r.status(), 'setujui PO').toBe(302);
    [rows] = await db.query('SELECT status FROM inventory_purchases WHERE id = ?', [ctx.poId]);
    expect(rows[0].status).toBe('approved');

    // Admin memverifikasi penerimaan: 3 baik, 2 cacat (dari 5 dipesan).
    await loginRequest(page, 'admin');
    const [pis] = await db.query(
      'SELECT id, item_id FROM inventory_purchase_items WHERE inventory_purchase_id = ?',
      [ctx.poId]
    );
    expect(pis.length).toBe(1);
    ctx.piId = pis[0].id;
    ctx.itemId = pis[0].item_id;
    r = await postNoRedirect(page, `/receiving/${ctx.poId}/verify`, {
      [`good_qty[${ctx.piId}]`]: '3',
      [`defective_qty[${ctx.piId}]`]: '2',
    });
    expect(r.status(), 'verifikasi penerimaan').toBe(302);
    [rows] = await db.query(
      'SELECT received_quantity, received_defective FROM inventory_purchase_items WHERE id = ?',
      [ctx.piId]
    );
    expect(Number(rows[0].received_quantity)).toBe(3);
    expect(Number(rows[0].received_defective)).toBe(2);

    // Admin mencatat barang ganti sebanyak 2 (menutup yang cacat).
    r = await postNoRedirect(page, '/receiving/replacement', {
      po_id: String(ctx.poId),
      item_id: String(ctx.itemId),
      quantity: '2',
    });
    expect(r.status(), 'catat barang ganti').toBe(302);

    // Pada detail penerimaan: cacat menjadi 0 & riwayat barang ganti tercatat.
    await page.goto(`/receiving/${ctx.poId}/detail`);
    await expect(page.getByRole('heading', { name: 'Detail Penerimaan' })).toBeVisible();
    await expect(page.locator('.cond-cacat')).toHaveCount(0);
    await expect(page.getByText('Riwayat Barang Ganti')).toBeVisible();
    // Total "Diterima Baik" menjadi penuh (5).
    await expect(page.locator('tfoot')).toContainText('5');
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

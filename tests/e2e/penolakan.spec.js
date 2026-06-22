// Jalur penolakan oleh wakil dekan pada dua gerbang: permintaan dan PO.
// Penolakan mengubah status menjadi 'rejected' dan menyimpan catatan alasan.
// Data uji ditulis lalu dibersihkan sendiri lewat DB pada afterAll.
const { test, expect } = require('@playwright/test');
const { loginRequest, postNoRedirect } = require('./helpers');
const { createTestDb } = require('./db');

test.describe('Penolakan oleh wakil dekan', () => {
  const db = createTestDb();
  const stamp = Date.now();
  const ctx = {};

  test('menolak permintaan dengan catatan lalu permintaan tak bisa dikonsolidasi', async ({ page }) => {
    const judul = `E2E Tolak Permintaan ${stamp}`;
    const catatan = 'Anggaran belum tersedia periode ini.';

    // Admin membuat permintaan.
    await loginRequest(page, 'admin');
    let r = await postNoRedirect(page, '/procurement/create', { title: judul, item_name: `Barang ${stamp}`, quantity: '3' });
    expect(r.status(), 'buat permintaan').toBe(302);
    let [rows] = await db.query(
      'SELECT id, request_number FROM inventory_requests WHERE title = ? ORDER BY id DESC LIMIT 1',
      [judul]
    );
    expect(rows.length).toBe(1);
    ctx.reqId = rows[0].id;
    const reqNumber = rows[0].request_number;

    // Wakil dekan menolak dengan catatan.
    await loginRequest(page, 'wadir');
    r = await postNoRedirect(page, `/approval/${ctx.reqId}/reject`, { notes: catatan });
    expect(r.status(), 'tolak permintaan').toBe(302);

    // Status permintaan menjadi 'rejected' dan catatan tersimpan.
    [rows] = await db.query('SELECT status FROM inventory_requests WHERE id = ?', [ctx.reqId]);
    expect(rows[0].status).toBe('rejected');
    [rows] = await db.query(
      'SELECT status, notes FROM inventory_request_approvals WHERE inventory_request_id = ? ORDER BY id DESC LIMIT 1',
      [ctx.reqId]
    );
    expect(rows[0].status).toBe('rejected');
    expect(rows[0].notes).toBe(catatan);

    // Permintaan yang ditolak tidak boleh muncul sebagai kandidat konsolidasi
    // (syarat konsolidasi: status 'approved' dan belum tergabung).
    [rows] = await db.query(
      `SELECT COUNT(*) AS n FROM inventory_requests
        WHERE request_number = ? AND status = 'approved' AND inventory_procurement_id IS NULL`,
      [reqNumber]
    );
    expect(Number(rows[0].n)).toBe(0);
  });

  test('menolak PO dengan catatan lalu PO keluar dari antrean persetujuan', async ({ page }) => {
    test.setTimeout(60_000);
    const judulPermintaan = `E2E Tolak PO Permintaan ${stamp}`;
    const judulPengadaan = `E2E Tolak PO Pengadaan ${stamp}`;
    const catatan = 'Harga melebihi pagu, ajukan ulang.';

    // Bangun rantai sampai PO berstatus 'pending'.
    await loginRequest(page, 'admin');
    let r = await postNoRedirect(page, '/procurement/create', { title: judulPermintaan, item_name: `Barang PO ${stamp}`, quantity: '4' });
    expect(r.status()).toBe(302);
    let [rows] = await db.query('SELECT id, request_number FROM inventory_requests WHERE title = ? ORDER BY id DESC LIMIT 1', [judulPermintaan]);
    ctx.poReqId = rows[0].id;
    const reqNumber = rows[0].request_number;

    await loginRequest(page, 'wadir');
    r = await postNoRedirect(page, `/approval/${ctx.poReqId}/approve`);
    expect(r.status()).toBe(302);

    await loginRequest(page, 'admin');
    r = await postNoRedirect(page, '/pengadaan/create', { title: judulPengadaan, request_number: reqNumber });
    expect(r.status()).toBe(302);
    [rows] = await db.query('SELECT id FROM inventory_procurements WHERE title = ? ORDER BY id DESC LIMIT 1', [judulPengadaan]);
    ctx.procId = rows[0].id;

    const [sup] = await db.query('SELECT id FROM suppliers ORDER BY id LIMIT 1');
    expect(sup.length, 'butuh minimal 1 supplier').toBeGreaterThan(0);
    r = await postNoRedirect(page, '/purchase/create', {
      inventory_procurement_id: String(ctx.procId),
      supplier_id: String(sup[0].id),
      purchase_date: new Date().toISOString().slice(0, 10),
      prices: '99000',
    });
    expect(r.status()).toBe(302);
    [rows] = await db.query('SELECT id, purchase_number, status FROM inventory_purchases WHERE inventory_procurement_id = ? ORDER BY id DESC LIMIT 1', [ctx.procId]);
    ctx.poId = rows[0].id;
    ctx.poNumber = rows[0].purchase_number;
    expect(rows[0].status, 'PO baru harus pending').toBe('pending');

    // Wakil dekan menolak PO dengan catatan.
    await loginRequest(page, 'wadir');
    r = await postNoRedirect(page, `/purchase/${ctx.poId}/reject`, { notes: catatan });
    expect(r.status(), 'tolak PO').toBe(302);

    // Status PO menjadi 'rejected', catatan tersimpan, dan tidak lagi pending.
    [rows] = await db.query('SELECT status, approval_notes FROM inventory_purchases WHERE id = ?', [ctx.poId]);
    expect(rows[0].status).toBe('rejected');
    expect(rows[0].approval_notes).toBe(catatan);
  });

  test.afterAll(async () => {
    const q = async (sql, p) => { try { await db.query(sql, p); } catch (e) { /* abaikan saat bersih-bersih */ } };
    // PO ditolak beserta rantainya.
    if (ctx.poId) {
      await q('DELETE FROM inventory_purchase_items WHERE inventory_purchase_id = ?', [ctx.poId]);
      await q('DELETE FROM inventory_purchases WHERE id = ?', [ctx.poId]);
    }
    if (ctx.procId) {
      await q('DELETE FROM inventory_procurement_items WHERE inventory_procurement_id = ?', [ctx.procId]);
      await q('DELETE FROM inventory_procurements WHERE id = ?', [ctx.procId]);
    }
    for (const id of [ctx.reqId, ctx.poReqId]) {
      if (!id) continue;
      await q('DELETE FROM inventory_request_approvals WHERE inventory_request_id = ?', [id]);
      await q('DELETE FROM inventory_request_details WHERE inventory_request_id = ?', [id]);
      await q('DELETE FROM inventory_requests WHERE id = ?', [id]);
    }
    await db.end();
  });
});

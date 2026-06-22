// Supplier: jalur sukses tambah data lewat form, dan penolakan saat supplier
// tidak dipilih ketika membuat PO. Data uji dibersihkan sendiri lewat DB.
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');
const { createTestDb } = require('./db');

test.describe('Supplier', () => {
  const db = createTestDb();
  const kode = `T${Date.now() % 1000000}`;
  const nama = `Supplier Uji ${kode}`;

  test('admin menambah supplier baru lalu muncul di daftar', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/supplier/create');
    await page.fill('input[name="name"]', nama);
    await page.fill('input[name="code"]', kode);
    await Promise.all([
      page.waitForURL('**/supplier', { timeout: 15_000 }),
      page.getByRole('button', { name: /Simpan/i }).click(),
    ]);

    await expect(page.locator('tbody tr', { hasText: nama })).toBeVisible();

    const [rows] = await db.query('SELECT name FROM suppliers WHERE code = ?', [kode]);
    expect(rows.length, 'supplier tersimpan di DB').toBe(1);
  });

  // Membuat PO tanpa memilih supplier ditolak oleh validasi field wajib.
  // Kondisi tabel supplier benar-benar kosong tidak diuji karena menghapus
  // seluruh supplier merusak data bersama yang dipakai test alur lain.
  test('membuat PO tanpa memilih supplier ditolak', async ({ page }) => {
    await login(page, 'admin');
    const resp = await page.request.post('/purchase/create', {
      form: {
        inventory_procurement_id: '999999',
        purchase_date: new Date().toISOString().slice(0, 10),
        prices: '15000',
      },
    });
    expect(await resp.text()).toContain('Field wajib diisi');
  });

  test.afterAll(async () => {
    try { await db.query('DELETE FROM suppliers WHERE code = ?', [kode]); } catch (e) { /* abaikan */ }
    await db.end();
  });
});

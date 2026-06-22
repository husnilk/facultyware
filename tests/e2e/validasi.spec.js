// Validasi masukan: tiap form menolak data yang tidak lengkap / tidak valid.
// Jalur "gagal isi" dipanggil lewat HTTP request agar tiap cabang validasi di
// controller teruji tanpa bergantung pada JavaScript sisi klien.
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('Validasi form Purchase Order', () => {
  test.beforeEach(async ({ page }) => login(page, 'admin'));

  test('menolak pembuatan PO ketika field wajib kosong', async ({ page }) => {
    const resp = await page.request.post('/purchase/create', { form: {} });
    expect(await resp.text()).toContain('Field wajib diisi');
  });

  test('menolak pembuatan PO ketika supplier tidak valid', async ({ page }) => {
    const resp = await page.request.post('/purchase/create', {
      form: {
        inventory_procurement_id: '999999',
        supplier_id: '999999',
        purchase_date: new Date().toISOString().slice(0, 10),
        prices: '15000',
      },
    });
    expect(await resp.text()).toContain('Supplier yang dipilih tidak valid');
  });
});

test.describe('Validasi form Supplier', () => {
  test.beforeEach(async ({ page }) => login(page, 'admin'));

  test('menolak supplier tanpa nama', async ({ page }) => {
    const resp = await page.request.post('/supplier/create', { form: { code: 'SUP-X' } });
    expect(await resp.text()).toContain('Nama supplier wajib diisi');
  });

  test('menolak supplier tanpa kode', async ({ page }) => {
    const resp = await page.request.post('/supplier/create', { form: { name: 'Supplier Uji' } });
    expect(await resp.text()).toContain('Kode supplier wajib diisi');
  });
});

test.describe('Validasi form Pengadaan', () => {
  test.beforeEach(async ({ page }) => login(page, 'admin'));

  test('menolak pengadaan tanpa judul', async ({ page }) => {
    const resp = await page.request.post('/pengadaan/create', {
      form: { request_number: 'REQ-DUMMY' },
    });
    expect(await resp.text()).toContain('Judul pengadaan wajib diisi');
  });

  test('menolak pengadaan tanpa permintaan terpilih', async ({ page }) => {
    const resp = await page.request.post('/pengadaan/create', {
      form: { title: 'Pengadaan Tanpa Permintaan' },
    });
    expect(await resp.text()).toContain('Pilih minimal satu permintaan');
  });
});

test.describe('Validasi penerimaan barang', () => {
  test.beforeEach(async ({ page }) => login(page, 'admin'));

  test('menolak retur ketika jumlah nol', async ({ page }) => {
    const resp = await page.request.post('/receiving/retur', {
      form: { po_id: '1', item_id: '1', quantity: '0' },
    });
    expect(resp.status()).toBe(400);
    expect(await resp.text()).toContain('tidak valid');
  });

  test('menolak retur ketika item tidak diisi', async ({ page }) => {
    const resp = await page.request.post('/receiving/retur', {
      form: { po_id: '1', quantity: '2' },
    });
    expect(resp.status()).toBe(400);
    expect(await resp.text()).toContain('tidak valid');
  });

  test('menolak barang ganti ketika jumlah tidak diisi', async ({ page }) => {
    const resp = await page.request.post('/receiving/replacement', {
      form: { po_id: '1', item_id: '1' },
    });
    expect(resp.status()).toBe(400);
    expect(await resp.text()).toContain('tidak valid');
  });
});

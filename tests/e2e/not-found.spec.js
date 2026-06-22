// Sumber daya tidak ada: detail dengan id yang tidak ada menjawab 404, dan aksi
// terhadap data yang tidak ada ditolak alih-alih membuat error tak tertangani.
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

const MISSING_ID = 99999999;

test.describe('Sumber daya tidak ditemukan', () => {
  test.beforeEach(async ({ page }) => login(page, 'admin'));

  test('detail PO yang tidak ada menjawab 404', async ({ page }) => {
    const resp = await page.goto(`/purchase/${MISSING_ID}`);
    expect(resp.status()).toBe(404);
  });

  test('detail permintaan yang tidak ada menjawab 404', async ({ page }) => {
    const resp = await page.goto(`/procurement/${MISSING_ID}`);
    expect(resp.status()).toBe(404);
  });

  test('detail pengadaan yang tidak ada menjawab 404', async ({ page }) => {
    const resp = await page.goto(`/pengadaan/${MISSING_ID}`);
    expect(resp.status()).toBe(404);
  });

  test('edit supplier yang tidak ada menjawab 404', async ({ page }) => {
    const resp = await page.goto(`/supplier/${MISSING_ID}/edit`);
    expect(resp.status()).toBe(404);
  });

  test('verifikasi penerimaan untuk PO yang tidak ada menjawab 404', async ({ page }) => {
    const resp = await page.request.post(`/receiving/${MISSING_ID}/verify`, { form: {} });
    expect(resp.status()).toBe(404);
  });

  test('menghapus permintaan yang tidak ada ditolak dengan JSON gagal', async ({ page }) => {
    const resp = await page.request.post(`/procurement/${MISSING_ID}/delete`);
    expect(resp.status()).toBe(404);
    expect(await resp.json()).toMatchObject({ success: false });
  });
});

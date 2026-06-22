// Mutasi data mandiri-bersih: membuat permintaan lalu menghapusnya kembali,
// memastikan jalur create dan delete bekerja tanpa meninggalkan data uji.
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('Membuat dan menghapus permintaan', () => {
  test('admin membuat permintaan baru lalu menghapusnya', async ({ page }) => {
    await login(page, 'admin');
    const judul = `Permintaan Uji Otomatis ${Date.now()}`;

    await page.goto('/procurement/create');
    await page.fill('#title', judul);
    await page.fill('input[name="item_name"]', 'Barang Uji');
    await page.fill('input[name="quantity"]', '2');
    await Promise.all([
      page.waitForURL('**/procurement**'),
      page.click('button[type="submit"]'),
    ]);

    const row = page.locator('tbody tr', { hasText: judul });
    await expect(row).toBeVisible();

    // Ambil id dari tautan Detail lalu hapus lewat endpoint.
    const href = await row.getByRole('link', { name: 'Detail' }).getAttribute('href');
    const id = href.match(/\/procurement\/(\d+)/)[1];
    const del = await page.request.post(`/procurement/${id}/delete`);
    expect(del.ok()).toBeTruthy();
    expect(await del.json()).toMatchObject({ success: true });
  });
});

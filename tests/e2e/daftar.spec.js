// Daftar data: pengurutan, pencarian, dan jalur parameter tidak valid yang harus
// kembali ke urutan default alih-alih gagal.
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('Daftar dan pengurutan', () => {
  test.beforeEach(async ({ page }) => login(page, 'admin'));

  for (const path of ['/purchase', '/pengadaan', '/procurement', '/supplier']) {
    test(`mengurutkan daftar pada halaman ${path}`, async ({ page }) => {
      await page.goto(path);
      const sel = page.locator('#sort-select');
      await expect(sel).toBeVisible();

      const second = await sel.locator('option').nth(1).getAttribute('value');
      await Promise.all([
        page.waitForURL(new RegExp(`sort=${second}`)),
        sel.selectOption(second),
      ]);
      await expect(page.locator('#sort-select')).toHaveValue(second);
    });
  }

  test('parameter urutkan tidak valid kembali ke urutan default', async ({ page }) => {
    await page.goto('/purchase?sort=ngawur');
    await expect(page.locator('#sort-select')).toHaveValue('terbaru');
  });

  test('menampilkan kotak pencarian pada daftar Purchase Order', async ({ page }) => {
    await page.goto('/purchase');
    await expect(page.locator('input[type="text"][name="search"]')).toBeVisible();
    const pager = page.getByText(/Halaman \d+ dari \d+/);
    if (await pager.count()) {
      await expect(pager.first()).toBeVisible();
    }
  });
});

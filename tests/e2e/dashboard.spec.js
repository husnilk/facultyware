// Dashboard: ringkasan dan log aktivitas tampil sesuai role.
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('Dashboard', () => {
  test('menampilkan ringkasan dan log aktivitas untuk admin', async ({ page }) => {
    await login(page, 'admin');
    await expect(page.getByRole('heading', { name: 'Total Permintaan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Menunggu Approval' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aktivitas Terbaru' })).toBeVisible();
  });

  test('menampilkan log aktivitas untuk wakil dekan', async ({ page }) => {
    await login(page, 'wadir');
    await expect(page.getByRole('heading', { name: 'Aktivitas Terbaru' })).toBeVisible();
  });
});

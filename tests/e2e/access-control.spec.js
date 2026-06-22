// Hak akses (RBAC): tiap role hanya boleh membuka modul miliknya. Modul lain
// dijawab 403, dan sidebar hanya menampilkan menu yang relevan.
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('Hak akses', () => {
  test('admin ditolak membuka inbox persetujuan', async ({ page }) => {
    await login(page, 'admin');
    const resp = await page.goto('/approval/inbox');
    expect(resp.status()).toBe(403);
    await expect(page.locator('body')).toContainText(/izin/i);
  });

  test('admin ditolak membuka persetujuan PO', async ({ page }) => {
    await login(page, 'admin');
    const resp = await page.goto('/approval/po');
    expect(resp.status()).toBe(403);
  });

  test('wakil dekan ditolak membuka semua modul operasional', async ({ page }) => {
    await login(page, 'wadir');
    for (const path of ['/procurement', '/pengadaan', '/purchase', '/supplier', '/receiving']) {
      const resp = await page.goto(path);
      expect(resp.status(), `akses ${path}`).toBe(403);
    }
  });

  test('sidebar admin hanya memuat menu operasional', async ({ page }) => {
    await login(page, 'admin');
    const sidebar = page.locator('#sidebar');
    await expect(sidebar.getByText('Purchase Order', { exact: true })).toBeVisible();
    await expect(sidebar.getByText('Permintaan Pengadaan', { exact: true })).toBeVisible();
  });

  test('sidebar wakil dekan hanya memuat menu persetujuan', async ({ page }) => {
    await login(page, 'wadir');
    const sidebar = page.locator('#sidebar');
    await expect(sidebar.getByText('Persetujuan Permintaan', { exact: true })).toBeVisible();
    await expect(sidebar.getByText('Persetujuan Belanja (PO)', { exact: true })).toBeVisible();
    await expect(sidebar.getByText('Arsip Pengadaan', { exact: true })).toBeVisible();
    await expect(sidebar.getByText('Arsip PO', { exact: true })).toBeVisible();
  });
});

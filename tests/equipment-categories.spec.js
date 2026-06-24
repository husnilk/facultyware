// @ts-check
const { test, expect } = require('@playwright/test');

// Helper login
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@facultyware.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/home/);
}

async function loginAsViewer(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'viewer@facultyware.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/home/);
}

test.describe('Kategori Aset — Admin', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('melihat daftar kategori', async ({ page }) => {
    await page.goto('/equipment-categories');
    await expect(page).toHaveURL(/\/equipment-categories/);
    await expect(page.locator('h1, .card-title').first()).toContainText('Kategori');
    await expect(page.locator('table')).toBeVisible();
  });

  test('tombol Tambah Kategori tersedia untuk admin', async ({ page }) => {
    await page.goto('/equipment-categories');
    await expect(page.locator('a[href="/equipment-categories/create"]')).toBeVisible();
  });

  test('tambah kategori baru', async ({ page }) => {
    const kode = 'TEST-' + Date.now();
    await page.goto('/equipment-categories/create');
    await page.fill('input[name="code"]', kode);
    await page.fill('input[name="name"]', 'Kategori Test Playwright');
    await page.fill('textarea[name="description"]', 'Dibuat oleh Playwright test');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/equipment-categories/);
    await expect(page.locator('.alert-success, [role="alert"]').first()).toBeVisible();
    await expect(page.locator(`text=${kode}`)).toBeVisible();
  });

  test('validasi — form kosong tidak bisa disimpan', async ({ page }) => {
    await page.goto('/equipment-categories/create');
    await page.click('button[type="submit"]');
    // Browser HTML5 validation atau server validation
    await expect(page).toHaveURL(/\/equipment-categories\/create/);
  });

  test('edit kategori', async ({ page }) => {
    // Ambil link edit dari baris pertama
    await page.goto('/equipment-categories');
    const editLink = page.locator('a[href*="/equipment-categories/"][href*="/edit"]').first();
    await editLink.click();

    await page.fill('input[name="name"]', 'Nama Diperbarui Playwright');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/equipment-categories/);
    await expect(page.locator('.alert-success, [role="alert"]').first()).toBeVisible();
  });

  test('pencarian kategori', async ({ page }) => {
    await page.goto('/equipment-categories');
    await page.fill('input[name="q"]', 'Komputer');
    await page.press('input[name="q"]', 'Enter');
    await expect(page).toHaveURL(/q=Komputer/);
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

});

test.describe('Kategori Aset — Viewer (ACL)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsViewer(page);
  });

  test('viewer bisa lihat daftar kategori', async ({ page }) => {
    await page.goto('/equipment-categories');
    await expect(page.locator('table')).toBeVisible();
  });

  test('viewer tidak melihat tombol Tambah Kategori', async ({ page }) => {
    await page.goto('/equipment-categories');
    await expect(page.locator('a[href="/equipment-categories/create"]')).toHaveCount(0);
  });

  test('viewer tidak bisa akses halaman tambah kategori → 403', async ({ page }) => {
    const response = await page.goto('/equipment-categories/create');
    await expect(response?.status()).toBe(403);
  });

});

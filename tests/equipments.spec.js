// @ts-check
const { test, expect } = require('@playwright/test');

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

test.describe('Aset Peralatan — Admin', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('melihat daftar aset', async ({ page }) => {
    await page.goto('/equipments');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('table tbody tr')).not.toHaveCount(0);
  });

  test('tombol Tambah Aset tersedia untuk admin', async ({ page }) => {
    await page.goto('/equipments');
    await expect(page.locator('a[href="/equipments/create"]')).toBeVisible();
  });

  test('tambah aset baru', async ({ page }) => {
    const kode = 'PLW-' + Date.now();
    await page.goto('/equipments/create');

    await page.fill('input[name="name"]', 'Laptop Test Playwright');
    await page.fill('input[name="code"]', kode);
    await page.selectOption('select[name="acquisition_type"]', 'procurement');
    await page.fill('input[name="acquisition_date"]', '2026-01-01');
    await page.selectOption('select[name="condition"]', 'good');
    await page.selectOption('select[name="status"]', 'available');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/equipments/);
    await expect(page.locator('.alert-success, [role="alert"]').first()).toBeVisible();
    await expect(page.locator(`text=${kode}`)).toBeVisible();
  });

  test('validasi — field wajib kosong tidak bisa disimpan', async ({ page }) => {
    await page.goto('/equipments/create');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/equipments\/create/);
  });

  test('melihat detail aset', async ({ page }) => {
    await page.goto('/equipments');
    // Klik link detail dari baris pertama
    await page.locator('table tbody tr').first().locator('a[href^="/equipments/"]').first().click();
    await expect(page).toHaveURL(/\/equipments\/\d+/);
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('edit aset', async ({ page }) => {
    await page.goto('/equipments');
    const editLink = page.locator('a[href*="/equipments/"][href*="/edit"]').first();
    await editLink.click();

    await page.fill('input[name="name"]', 'Aset Diperbarui Playwright');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/equipments/);
    await expect(page.locator('.alert-success, [role="alert"]').first()).toBeVisible();
  });

  test('pencarian aset berdasarkan nama', async ({ page }) => {
    await page.goto('/equipments');
    await page.fill('input[name="q"]', 'Laptop');
    await page.press('input[name="q"]', 'Enter');
    await expect(page).toHaveURL(/q=Laptop/);
    const rows = page.locator('table tbody tr');
    await expect(rows).not.toHaveCount(0);
  });

  test('filter aset berdasarkan kondisi', async ({ page }) => {
    await page.goto('/equipments');
    await page.selectOption('select[name="condition"]', 'good');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/condition=good/);
  });

  test('filter aset berdasarkan status', async ({ page }) => {
    await page.goto('/equipments');
    await page.selectOption('select[name="status"]', 'available');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/status=available/);
  });

  test('filter aset berdasarkan kategori', async ({ page }) => {
    await page.goto('/equipments');
    // Dropdown kategori tersedia
    const categorySelect = page.locator('select[name="category_id"]');
    await expect(categorySelect).toBeVisible();

    // Pilih kategori pertama yang tersedia (selain "Semua Kategori")
    const options = categorySelect.locator('option');
    const optionCount = await options.count();
    test.skip(optionCount < 2, 'Tidak ada kategori untuk difilter');

    const value = await options.nth(1).getAttribute('value');
    await categorySelect.selectOption(value);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(new RegExp(`category_id=${value}`));
    // Kolom Kategori muncul di header tabel
    await expect(page.locator('table thead', { hasText: 'Kategori' })).toBeVisible();
  });

  test('hapus aset yang baru ditambahkan', async ({ page }) => {
    // Terima dialog konfirmasi hapus (default Playwright men-dismiss/cancel)
    page.on('dialog', (dialog) => dialog.accept());

    // Tambah dulu aset untuk dihapus
    const kode = 'DEL-' + Date.now();
    await page.goto('/equipments/create');
    await page.fill('input[name="name"]', 'Aset Untuk Dihapus');
    await page.fill('input[name="code"]', kode);
    await page.selectOption('select[name="acquisition_type"]', 'procurement');
    await page.fill('input[name="acquisition_date"]', '2026-01-01');
    await page.selectOption('select[name="condition"]', 'good');
    await page.selectOption('select[name="status"]', 'available');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/equipments/);
    await expect(page.locator(`text=${kode}`)).toBeVisible();

    // Hapus via tombol di baris yang mengandung kode (aset terbaru ada di atas)
    const row = page.locator('tr').filter({ hasText: kode });
    await row.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/equipments/);
    await expect(page.locator('.alert-success, [role="alert"]').first()).toBeVisible();
    await expect(page.locator(`text=${kode}`)).toHaveCount(0);
  });

});

test.describe('Aset Peralatan — Viewer (ACL)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsViewer(page);
  });

  test('viewer bisa lihat daftar aset', async ({ page }) => {
    await page.goto('/equipments');
    await expect(page.locator('table')).toBeVisible();
  });

  test('viewer tidak melihat tombol Tambah Aset', async ({ page }) => {
    await page.goto('/equipments');
    await expect(page.locator('a[href="/equipments/create"]')).toHaveCount(0);
  });

  test('viewer tidak bisa akses halaman tambah aset → 403', async ({ page }) => {
    const response = await page.goto('/equipments/create');
    await expect(response?.status()).toBe(403);
  });

  test('viewer bisa export aset', async ({ page }) => {
    await page.goto('/equipments');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('a[href*="/equipments/export"][href*="csv"]').first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

});

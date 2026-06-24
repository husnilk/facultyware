const { test, expect } = require('@playwright/test');

async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'admin@fti.ac.id');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/admin/survey/rekap');
}

test.describe('Fitur Admin — Survey', () => {

  // REKAP
  test('halaman rekap tampil daftar survey', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator('h1')).toContainText('Rekap Jawaban Survey');
    await expect(page.locator('table')).toBeVisible();
  });

  test('search rekap berfungsi', async ({ page }) => {
    await loginAsAdmin(page);
    await page.fill('input[name="search"]', 'kepuasan');
    await page.click('button[type="submit"]');
    await expect(page.locator('body')).toContainText('Survey Kepuasan Layanan Akademik');
  });

  test('detail rekap per survey tampil', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/survey/rekap/1');
    await expect(page.locator('h1')).toContainText('Survey Kepuasan Layanan Akademik');
    await expect(page.locator('table')).toBeVisible();
  });

  // STATISTIK
  test('halaman statistik tampil daftar survey', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/survey/statistik');
    await expect(page.locator('h1')).toContainText('Statistik Survey');
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('detail statistik per survey tampil', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/survey/statistik/1');
    await expect(page.locator('h1')).toContainText('Survey Kepuasan Layanan Akademik');
    await expect(page.locator('body')).toContainText('Bagaimana penilaian Anda');
  });

  // EXPORT CSV
  test('export CSV error kalau belum ada data', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/survey/export/3');
    await expect(page.locator('body')).toContainText('Belum ada responden');
  });

  test('export CSV berhasil kalau ada data', async ({ page }) => {
    await loginAsAdmin(page);
    const response = await page.request.get('http://localhost:3000/admin/survey/export/1');
    expect([200, 302]).toContain(response.status());
  });

  // DASHBOARD AQILA
  test('dashboard responden tampil', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/responden');
    await expect(page.locator('h1')).toContainText('Dashboard Survey');
    await expect(page.locator('table')).toBeVisible();
  });

  test('search dashboard berfungsi', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/responden');
    await page.fill('input[name="search"]', 'kepuasan');
    await page.click('button[type="submit"]');
    await expect(page.locator('body')).toContainText('Survey Kepuasan Layanan Akademik');
  });

  test('toggle nonaktifkan survey berhasil', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/responden');
    const row = page.locator('tr:has-text("Survey Evaluasi Fasilitas Kampus")');
    await expect(row).toContainText('Aktif');
    await row.locator('button:has-text("Nonaktifkan")').click();
    await expect(
      page.locator('tr:has-text("Survey Evaluasi Fasilitas Kampus")')
    ).toContainText('Tidak Aktif');
  });

  test('toggle aktifkan survey berhasil', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/responden');
    const row = page.locator('tr:has-text("Survey Draft Belum Aktif")');
    await expect(row).toContainText('Tidak Aktif');
    await row.locator('button:has-text("Aktifkan")').click();
    await expect(
      page.locator('tr:has-text("Survey Draft Belum Aktif")')
    ).toContainText('Aktif');
  });

  test('daftar responden per survey tampil', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/responden/1');
    await expect(page.locator('h1')).toContainText('Survey Kepuasan Layanan Akademik');
    await expect(page.locator('table')).toBeVisible();
  });

  test('riwayat pengisian tampil', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/responden/1/riwayat');
    await expect(page.locator('h1')).toContainText('Riwayat Pengisian');
    await expect(page.locator('table')).toBeVisible();
  });

  test('PDF error kalau belum ada responden', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/responden/3/pdf');
    await expect(page.locator('body')).toContainText('belum ada responden');
  });

  // REST API
  test('REST API GET surveys return JSON', async ({ page }) => {
    await loginAsAdmin(page);
    const response = await page.request.get('http://localhost:3000/api/surveys');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('REST API GET rekap return JSON', async ({ page }) => {
    await loginAsAdmin(page);
    const response = await page.request.get('http://localhost:3000/api/surveys/1/rekap');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('survey');
    expect(json.data).toHaveProperty('total_responden');
  });

  test('REST API tidak bisa diakses tanpa login', async ({ page }) => {
    const context = await page.context().browser().newContext();
    const newPage = await context.newPage();
    await newPage.goto('http://localhost:3000/api/surveys');
    await expect(newPage).toHaveURL(/login/);
    await context.close();
  });

});
const { test, expect } = require('@playwright/test');

test.describe('Authentication & ACL', () => {

  test('login admin berhasil', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@fti.ac.id');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/survey/rekap');
    await expect(page.locator('h1')).toContainText('Rekap Jawaban Survey');
  });

  test('login respondent berhasil', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'rifaqila@fti.ac.id');
    await page.fill('input[name="password"]', 'user123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/survey');
    await expect(page.locator('h1')).toContainText('Daftar Survey');
  });

  test('login gagal password salah', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@fti.ac.id');
    await page.fill('input[name="password"]', 'passwordsalah');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('body')).toContainText('Username atau password salah');
  });

  test('login gagal email tidak ada', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'tidakada@fti.ac.id');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('body')).toContainText('Username atau password salah');
  });

  test('respondent tidak bisa akses halaman admin', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'rifaqila@fti.ac.id');
    await page.fill('input[name="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.goto('/admin/survey/rekap');
    await expect(page.locator('body')).toContainText('Forbidden');
  });

  test('admin tidak bisa akses halaman respondent', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@fti.ac.id');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/survey');
    await expect(page.locator('body')).toContainText('Forbidden');
  });

  test('user tidak login tidak bisa akses halaman manapun', async ({ page }) => {
    await page.goto('/survey');
    await expect(page).toHaveURL('/login');
  });

  test('logout berhasil', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin@fti.ac.id');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.goto('/logout');
    await expect(page).toHaveURL('/login');
    await page.goto('/admin/survey/rekap');
    await expect(page).toHaveURL('/login');
  });

});
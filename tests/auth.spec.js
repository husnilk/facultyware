// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Autentikasi', () => {

  test('redirect ke /login saat belum login', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login gagal — email atau password salah', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'salah@email.com');
    await page.fill('input[name="password"]', 'salah');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email atau password salah')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('login berhasil sebagai admin → masuk dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@facultyware.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);
    await expect(page.locator('h1', { hasText: 'Selamat datang' })).toBeVisible();
  });

  test('login berhasil sebagai viewer → masuk dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'viewer@facultyware.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);
  });

  test('logout → kembali ke halaman login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@facultyware.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);

    await page.click('a[href="/logout"]');
    await expect(page).toHaveURL(/\/login/);
  });

});

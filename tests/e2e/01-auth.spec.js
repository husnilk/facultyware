import { test, expect } from '@playwright/test';

test.describe('Modul 1: Autentikasi & UI Login', () => {

  test('1. Halaman login dapat diakses dan menampilkan elemen UI dengan benar', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await expect(page.locator('h1')).toContainText('Selamat Datang');
    await expect(page.locator('input[name="name"]')).toBeVisible(); // Diperbaiki dari identifier
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    await expect(page.locator('text=Akun hanya dikelola oleh Administrator')).toBeVisible();
    
    const html = page.locator('html');
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('basecoat:theme', { detail: { mode: 'dark' } })));
    await expect(html).toHaveClass(/dark/);
  });

  test('2. Validasi gagal login berfungsi dengan benar (input kosong/salah)', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Cek input kosong
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*login/); 

    // Cek username salah
    await page.fill('input[name="name"]', 'UserSalah');
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');
    await expect(page.locator('.bg-destructive\\/15')).toBeVisible();

    // Cek password salah
    await page.fill('input[name="name"]', 'Wanda');
    await page.fill('input[name="password"]', 'SalahPassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.text-destructive').first()).toContainText('salah');
  });

  test('3. Login berhasil dengan kredensial valid (Username/Email)', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Test Username
    await page.fill('input[name="name"]', 'Wanda');
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*equipment-loans/);
    
    // Logout terlebih dahulu
    await page.click('a[href="/logout"]');
    await expect(page).toHaveURL(/.*login/);

    // Skenario B: Menggunakan Email
    await page.fill('input[name="name"]', 'wanda@fti.unand.ac.id');
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*equipment-loans/);
  });

  test('4. Sesi login tersimpan dan tidak perlu login ulang', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="name"]', 'Wanda');
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');
    
    await page.goto('http://localhost:3000/login'); 
    await expect(page).toHaveURL(/.*equipment-loans/); 
  });

  test('5. Logout berhasil menghapus sesi dan mengembalikan ke form login', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="name"]', 'Wanda');
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');
    
    await page.click('a[href="/logout"]');
    await expect(page).toHaveURL(/.*login/);
  });

});
// import { test, expect } from '@playwright/test';

// test.describe('Fitur Autentikasi', () => {

//   test('Muncul pesan error jika username atau password salah', async ({ page }) => {
//     await page.goto('http://localhost:3000/login');
//     await page.fill('input[name="name"]', 'Wanda');
//     await page.fill('input[name="password"]', 'salah123');
//     await page.click('button[type="submit"]');

//     // Cek error dari error.ejs yang di-render authController
//     const kotakError = page.locator('.bg-destructive\\/15');
//     await expect(kotakError).toBeVisible();
//     await expect(kotakError).toContainText('Username atau password salah');
//   });

//   // Skenario 1: Login menggunakan Nama (Username)
//   test('Pengguna berhasil login menggunakan Nama', async ({ page }) => {
//     await page.goto('http://localhost:3000/login');
    
//     // Ketik NAMA di form
//     await page.fill('input[name="name"]', 'Wanda'); 
//     await page.fill('input[name="password"]', 'wanda'); 
//     await page.click('button[type="submit"]');

//     // Verifikasi berhasil masuk
//     await expect(page).toHaveURL(/.*equipment-loans/);
//     await expect(page.locator('h1')).toContainText('Daftar Peminjaman');
//   });

//   // Skenario 2: Login menggunakan Email
//   test('Pengguna berhasil login menggunakan Email', async ({ page }) => {
//     await page.goto('http://localhost:3000/login');
    
//     // Ketik EMAIL di form yang sama
//     // (Ganti dengan email asli Wanda yang ada di database Anda)
//     await page.fill('input[name="name"]', 'wanda@fti.unand.ac.id'); 
//     await page.fill('input[name="password"]', 'wanda'); 
//     await page.click('button[type="submit"]');

//     // Verifikasi berhasil masuk
//     await expect(page).toHaveURL(/.*equipment-loans/);
//     await expect(page.locator('h1')).toContainText('Daftar Peminjaman');
//   });

//   test('Berhasil Logout dan sesi terhapus', async ({ page }) => {
//     // Login dulu
//     await page.goto('http://localhost:3000/login');
//     await page.fill('input[name="name"]', 'Wanda');
//     await page.fill('input[name="password"]', 'wanda');
//     await page.click('button[type="submit"]');

//     // Klik tombol logout di footer sidebar
//     await page.click('a[href="/logout"]');
//     await expect(page).toHaveURL(/.*login/);
//   });

// });

import { test, expect } from '@playwright/test';

test.describe('Modul 1: Autentikasi & UI Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  // UI & UX Checks
  test('1. Halaman login memuat judul "Selamat Datang"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Selamat Datang');
  });
  test('2. Form login memiliki input Nama/Email dan Password', async ({ page }) => {
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
  test('3. Tombol Masuk tersedia dan dapat diklik', async ({ page }) => {
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });
  test('4. Teks deskripsi "Akun hanya dikelola oleh Administrator" terlihat', async ({ page }) => {
    await expect(page.locator('text=Akun hanya dikelola oleh Administrator')).toBeVisible();
  });
  test('5. Tombol Theme (Dark/Light Mode) berfungsi merubah class HTML', async ({ page }) => {
    const html = page.locator('html');
    await page.evaluate(() => document.dispatchEvent(new CustomEvent('basecoat:theme', { detail: { mode: 'dark' } })));
    await expect(html).toHaveClass(/dark/);
  });

  // Form Validation & Negative Tests
  test('6. Submit kosong akan ditahan oleh browser (required)', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*login/); // Tetap di halaman login
  });
  test('7. Login gagal dengan username salah menampilkan error', async ({ page }) => {
    await page.fill('input[name="name"]', 'UserSalah');
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');
    await expect(page.locator('.bg-destructive\\/15')).toBeVisible();
  });
  test('8. Login gagal dengan password salah menampilkan error', async ({ page }) => {
    await page.fill('input[name="name"]', 'Wanda');
    await page.fill('input[name="password"]', 'SalahPassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.text-destructive').first()).toContainText('salah');
  });

  // Positive Tests
  test('9. Login berhasil menggunakan Username', async ({ page }) => {
    await page.fill('input[name="name"]', 'Wanda');
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*equipment-loans/);
  });
  test('10. Login berhasil menggunakan Email', async ({ page }) => {
    await page.fill('input[name="name"]', 'wanda@fti.unand.ac.id'); // Sesuaikan email DB
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*equipment-loans/);
  });
  test('11. Sesi login tersimpan dan tidak perlu login ulang', async ({ page }) => {
    await page.fill('input[name="name"]', 'Wanda');
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');
    await page.goto('http://localhost:3000/login'); // Coba ke halaman login lagi
    await expect(page).toHaveURL(/.*equipment-loans/); // Harus langsung ter-redirect
  });
  test('12. Logout berhasil menghapus sesi dan mengembalikan ke form login', async ({ page }) => {
    await page.fill('input[name="name"]', 'Wanda');
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');
    await page.click('a[href="/logout"]');
    await expect(page).toHaveURL(/.*login/);
  });
});
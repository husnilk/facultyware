// import { test, expect } from '@playwright/test';

// test.describe('Keamanan (Middlewares & ACL)', () => {

//   test('Pengunjung tanpa login diblokir oleh isAuthenticated', async ({ browser }) => {
//     const context = await browser.newContext();
//     const page = await context.newPage();

//     // Tembak URL privat
//     await page.goto('http://localhost:3000/equipment-loans');
    
//     // Harus terlempar ke login
//     await expect(page).toHaveURL(/.*login/);
//     await context.close();
//   });

//   test('Mahasiswa biasa diblokir oleh checkPermission saat akses rute Manager', async ({ page }) => {
//     // Login sebagai mahasiswa (Wanda)
//     await page.goto('http://localhost:3000/login');
//     await page.fill('input[name="name"]', 'Wanda');
//     await page.fill('input[name="password"]', 'wanda');
//     await page.click('button[type="submit"]');

//     // Paksa masuk ke area manager
//     await page.goto('http://localhost:3000/manager');

//     // Tangkapan error dari errorHandler (error.ejs)
//     const errorMessage = page.locator('h1');
//     const errorCode = page.locator('h2');
    
//     await expect(errorMessage).toContainText('Forbidden');
//     await expect(errorCode).toContainText('403');
//   });

//   test('API track status dilindungi', async ({ browser }) => {
//     const context = await browser.newContext();
//     const page = await context.newPage();

//     // Tembak API tanpa session login
//     const response = await page.request.get('http://localhost:3000/equipment-loans/api/track/1');
    
//     // Karena pakai res.redirect('/login') di isAuthenticated
//     // Request API akan menerima response HTML halaman login (bukan data JSON)
//     const urlTujuan = response.url();
//     expect(urlTujuan).toContain('/login');
    
//     await context.close();
//   });

// });

import { test, expect } from '@playwright/test';

test.describe('Modul 4: Keamanan, ACL & Boundary Testing', () => {

  // Unauthenticated Access (Guest)
  test('59. Guest diblokir mengakses rute /equipment-loans (Redirect ke Login)', async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/equipment-loans');
    await expect(page).toHaveURL(/.*login/);
  });
  test('60. Guest diblokir mengakses rute /manager (Redirect ke Login)', async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/manager');
    await expect(page).toHaveURL(/.*login/);
  });
  test('61. Guest mengakses API Tracking akan ditolak', async ({ browser }) => {
    const page = await browser.newPage();
    const res = await page.goto('http://localhost:3000/equipment-loans/api/track/1');
    expect(res.url()).toContain('/login');
  });

  // Role-Based Access Control (Mahasiswa trying to be Manager)
  test('62. Mahasiswa diblokir (403) mengakses Dashboard Manager', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="name"]', 'Wanda'); // Akun Mahasiswa
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/manager');
    await expect(page.locator('h1')).toContainText('Forbidden');
  });
  test('63. Mahasiswa diblokir (403) mengakses Manager Ongoing', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="name"]', 'Wanda');
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/manager/ongoing');
    await expect(page.locator('h1')).toContainText('Forbidden');
  });
  // test('63. Mahasiswa diblokir (403) mengakses Manager API', async ({ page }) => {
  //     await page.goto('http://localhost:3000/login');
  //     await page.fill('input[name="name"]', 'Wanda');
  //     await page.fill('input[name="password"]', 'wanda');
  //     await page.click('button[type="submit"]');

  //     // Tembak URL API menggunakan page.request (Standar API Testing Playwright)
  //     const response = await page.request.get('http://localhost:3000/manager/api/loans/total');
      
  //     // Jika Backend Anda sudah aman, seharusnya response statusnya adalah 403 (Forbidden)
  //     expect(response.status()).toBe(403);
  //   });
  test('64. Akses URL ngawur (404 Not Found) diarahkan ke Error Handler', async ({ page }) => {
    await page.goto('http://localhost:3000/halaman-tidak-ada');
    await expect(page.locator('h1')).toContainText('Not Found');
    await expect(page.locator('h2')).toContainText('404');
  });

  // Boundary Security (Data Leak Prevention)
  test('65. API Tracking Mahasiswa tidak dapat melihat peminjaman mahasiswa lain', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="name"]', 'Wanda');
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');

    // Asumsi ID 99999 adalah ID palsu atau milik orang lain
    const response = await page.request.get('http://localhost:3000/equipment-loans/api/track/99999');
    const json = await response.json();
    expect(json.success).toBe(false);
  });
  test('66. XSS Prevention: Kotak search Manager mengamankan input HTML jahat', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="name"]', 'PJ');
    await page.fill('input[name="password"]', 'pjperalatan');
    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/manager');
    const xssScript = '<script>alert("hack")</script>';
    await page.fill('input[name="search"]', xssScript);
    await page.click('button:has-text("Filter")');
    // Jika aplikasi aman, script dieksekusi sebagai teks biasa / query parameter
    await expect(page.locator('input[name="search"]')).toHaveValue(xssScript);
  });

});
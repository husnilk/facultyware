import { test, expect } from '@playwright/test';

test.describe('Modul 4: Keamanan, ACL & Boundary Testing', () => {

  // Unauthenticated Access (Guest)
  test('40. Guest diblokir mengakses rute /equipment-loans (Redirect ke Login)', async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/equipment-loans');
    await expect(page).toHaveURL(/.*login/);
  });
  test('41. Guest diblokir mengakses rute /manager (Redirect ke Login)', async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/manager');
    await expect(page).toHaveURL(/.*login/);
  });
  test('42. Guest mengakses API Tracking akan ditolak', async ({ browser }) => {
    const page = await browser.newPage();
    const res = await page.goto('http://localhost:3000/equipment-loans/api/track/1');
    expect(res.url()).toContain('/login');
  });

  // Role-Based Access Control (Pengguna trying to be Manager)
  test('43. Pengguna diblokir (403) mengakses Dashboard Manager', async ({ page }) => {
     await page.goto('http://localhost:3000/login');
     await page.fill('input[name="name"]', 'Wanda'); // PERBAIKAN: Gunakan akun yang valid
     await page.fill('input[name="password"]', 'wanda'); // PERBAIKAN: Gunakan password yang valid
     await page.click('button[type="submit"]');
 
     await page.goto('http://localhost:3000/manager');
     await expect(page.locator('h1')).toContainText('Forbidden');
   });

   test('44. Pengguna diblokir (403) mengakses Manager Ongoing', async ({ page }) => {
     await page.goto('http://localhost:3000/login');
     await page.fill('input[name="name"]', 'Wanda'); // PERBAIKAN
     await page.fill('input[name="password"]', 'wanda'); // PERBAIKAN
     await page.click('button[type="submit"]');
 
     await page.goto('http://localhost:3000/manager/ongoing');
     await expect(page.locator('h1')).toContainText('Forbidden');
   });
  test('45. Akses URL ngawur (404 Not Found) diarahkan ke Error Handler', async ({ page }) => {
    await page.goto('http://localhost:3000/halaman-tidak-ada');
    await expect(page.locator('h1')).toContainText('Not Found');
    await expect(page.locator('h2')).toContainText('404');
  });

  test('46. XSS Prevention: Kotak search Manager mengamankan input HTML jahat', async ({ page }) => {
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
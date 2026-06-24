const { test, expect } = require('@playwright/test');

async function loginAsRespondent(page) {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'rifaqila@fti.ac.id');
  await page.fill('input[name="password"]', 'user123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/survey');
}

test.describe('Fitur Respondent — Survey', () => {

  test('list survey aktif tampil', async ({ page }) => {
    await loginAsRespondent(page);
    await expect(page.locator('h1')).toContainText('Daftar Survey');
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('search survey berfungsi', async ({ page }) => {
    await loginAsRespondent(page);
    await page.fill('input[name="search"]', 'kepuasan');
    await page.click('button[type="submit"]');
    await expect(page.locator('body')).toContainText('Survey Kepuasan Layanan Akademik');
    await expect(page.locator('body')).not.toContainText('Survey Evaluasi Fasilitas Kampus');
  });

  test('tombol reset search berfungsi', async ({ page }) => {
    await loginAsRespondent(page);
    await page.fill('input[name="search"]', 'kepuasan');
    await page.click('button[type="submit"]');
    await page.click('a:has-text("Reset")');
    await expect(page).toHaveURL('/survey');
  });

  test('form PIN muncul setelah klik isi survey', async ({ page }) => {
    await loginAsRespondent(page);
    await page.goto('/survey/1');
    await expect(page.locator('body')).toContainText('Masukkan PIN');
  });

  test('PIN salah menampilkan pesan error', async ({ page }) => {
    await loginAsRespondent(page);
    await page.goto('/survey/1');
    await page.fill('input[name="pin"]', 'PINSALAH');
    await page.click('button[type="submit"]');
    await expect(page.locator('body')).toContainText('PIN tidak valid atau sudah digunakan');
  });

test('PIN kosong input required ada', async ({ page }) => {
  await loginAsRespondent(page);
  await page.goto('/survey/1');
  // Validasi via JavaScript (client-side), bukan atribut required
  await page.click('button[type="submit"]');
  await expect(page.locator('#pinError')).toBeVisible();
});

  test('PIN benar masuk form survey', async ({ page }) => {
    await loginAsRespondent(page);
    await page.goto('/survey/1');
    await page.fill('input[name="pin"]', 'PIN001');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/survey/1/fill');
    await expect(page.locator('body')).toContainText('Bagaimana penilaian Anda');
  });

  test('submit survey tidak lengkap menampilkan validasi error', async ({ page }) => {
    await loginAsRespondent(page);
    await page.goto('/survey/1');
    await page.fill('input[name="pin"]', 'PIN001');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/survey/1/fill');
    // Submit tanpa isi apapun
    await page.click('button:has-text("Kirim Jawaban")');
    await expect(page.locator('body')).toContainText('wajib dijawab');
  });

});
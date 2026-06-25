const { test, expect } = require('@playwright/test');

test('Tambah Opsi Jawaban', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');
    await page.fill('input[name="password"]', 'hanif123');

    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/option/create/1');

    await page.fill('input[name="option_text"]', 'Opsi Playwright');

    await page.fill('input[name="weight"]', '5');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/option\/question\/1/);

});
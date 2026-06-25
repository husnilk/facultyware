const { test, expect } = require('@playwright/test');

test('Tombol Hapus Pertanyaan tampil', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');
    await page.fill('input[name="password"]', 'hanif123');

    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/question/survey/1');

    await expect(
        page.locator('button[title="Delete Question"]').first()
    ).toBeVisible();

});
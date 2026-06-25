const { test, expect } = require('@playwright/test');

test('Menampilkan Data Pertanyaan', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');
    await page.fill('input[name="password"]', 'hanif123');

    await page.locator('button[type="submit"]').click();

    await page.goto('http://localhost:3000/question/survey/1');

    await expect(page.locator('body')).toContainText('Question');

});
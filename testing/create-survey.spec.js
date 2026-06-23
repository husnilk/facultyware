const { test, expect } = require('@playwright/test');

test('Tambah Survey', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');
    await page.fill('input[name="password"]', 'hanif123');

    await page.getByRole('button', { name: 'Login' }).click();

    await page.goto('http://localhost:3000/survey/create');

    await page.fill('input[name="title"]', 'Survey Playwright');

    await page.fill('textarea[name="description"]', 'Survey dari Playwright');

    await page.fill('input[name="start_date"]', '2026-06-23');

    await page.fill('input[name="end_date"]', '2026-06-30');

    await page.getByRole('button', { name: 'Simpan' }).click();

    await expect(page.locator('body')).toContainText('Data Survey');

});
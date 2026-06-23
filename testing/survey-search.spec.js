const { test, expect } = require('@playwright/test');

test('Mencari Survey', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');

    await page.fill('input[name="password"]', 'hanif123');

    await page.getByRole('button', { name: 'Login' }).click();

    await page.goto('http://localhost:3000/survey');

    await page.fill('input[name="search"]', 'Survey');

    await page.getByRole('button', { name: 'Cari' }).click();

    await expect(page.locator('body')).toContainText('Survey');

});
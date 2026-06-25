const { test, expect } = require('@playwright/test');

test('Halaman Edit Opsi', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');
    await page.fill('input[name="password"]', 'hanif123');

    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/option/question/1');

    await page.locator('a[title="Edit Option"]').first().click();

    await expect(page.locator('h1')).toContainText('Edit');

});
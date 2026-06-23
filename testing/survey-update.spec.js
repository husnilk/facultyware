const { test, expect } = require('@playwright/test');

test('Halaman Edit Survey', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]','hanifalhaj@gmail.com');
    await page.fill('input[name="password"]','hanif123');

    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/survey');

    await page.locator('a:has-text("Edit"), a:has-text("✏")').first().click();

    await expect(page.locator('body')).toContainText('Edit Survey');

});
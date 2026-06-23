const { test, expect } = require('@playwright/test');

test('Tombol Hapus Assignment tampil', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');
    await page.fill('input[name="password"]', 'hanif123');

    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/assignment');

    await expect(
        page.locator('button:has-text("Hapus")').first()
    ).toBeVisible();

});
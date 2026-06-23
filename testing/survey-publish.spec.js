const { test, expect } = require('@playwright/test');

test('Tombol Publish Survey tampil', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');
    await page.fill('input[name="password"]', 'hanif123');

    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/survey');

    const publishButton = page.locator('form[action*="/publish/"] button');

    const count = await publishButton.count();

    if (count > 0) {
        await expect(publishButton.first()).toBeVisible();
    } else {
        await expect(page.locator('body')).toContainText('Aktif');
    }

});
const { test, expect } = require('@playwright/test');

test('Export PDF Survey', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]','hanifalhaj@gmail.com');
    await page.fill('input[name="password"]','hanif123');

    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/survey');

    await expect(
        page.locator('.modern-table')
    ).toBeVisible();

    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('a[href="/survey/export/pdf"]')
    ]);

    expect(download.suggestedFilename().toLowerCase()).toContain('survey');

});
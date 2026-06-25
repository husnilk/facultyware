const { test, expect } = require('@playwright/test');

test('Tambah Pertanyaan', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');
    await page.fill('input[name="password"]', 'hanif123');

    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/question/create/1');

    await page.fill('textarea[name="question_text"]', 'Pertanyaan Playwright');

    await page.selectOption('select[name="type"]', 'text');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/question\/survey\/1/);

});
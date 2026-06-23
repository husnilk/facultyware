const { test, expect } = require('@playwright/test');

test('Tambah Opsi Jawaban', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');

    await page.fill('input[name="password"]', 'hanif123');

    await page.getByRole('button', { name: 'Login' }).click();

    await page.goto('http://localhost:3000/option/create');

    await page.selectOption('select[name="survey_question_id"]', { index: 1 });

    await page.fill('input[name="option_text"]', 'Opsi Playwright');

    await page.fill('input[name="weight"]', '1');

    await page.getByRole('button', { name: 'Simpan' }).click();

    await expect(page.locator('body')).toContainText('Data Opsi');

});
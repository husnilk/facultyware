const { test, expect } = require('@playwright/test');

test('Tambah Assignment', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]','hanifalhaj@gmail.com');
    await page.fill('input[name="password"]','hanif123');

    await page.getByRole('button').click();

    await page.goto('http://localhost:3000/assignment/create');

    await page.selectOption(
        'select[name="survey_id"]',
        { index: 1 }
    );

    await page.selectOption(
        'select[name="survey_question_id"]',
        { index: 1 }
    );

    await page.fill(
        'input[name="order"]',
        '99'
    );

    await page.locator('button.hero-btn').click();

    await expect(page).toHaveURL(/assignment/);

});
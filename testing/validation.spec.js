const { test, expect } = require('@playwright/test');

test('Validasi Form Survey', async ({ page }) => {

    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');

    await page.fill('input[name="password"]', 'hanif123');

    await page.getByRole('button', { name: 'Login' }).click();

    await page.goto('http://localhost:3000/survey/create');

    await page.getByRole('button', { name: 'Simpan' }).click();

    await expect(page).toHaveURL(/survey\/create/);

});
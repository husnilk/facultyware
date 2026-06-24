// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { URLS } = require('../helpers/test-data');
const SELECTORS = require('../helpers/selectors');

/**
 * Pegawai Reimburse/Expense Tests
 * 
 * Verifies that the expense/reimburse pages load,
 * creation form works, and list is visible.
 * 
 * Does not modify production data — uses test-safe operations.
 */
test.describe('Pegawai Reimburse', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'pegawai');
  });

  test.describe('Expense List', () => {

    test('should load the expenses list page', async ({ page }) => {
      await page.goto(URLS.pegawaiExpenses);
      
      await expect(page).toHaveURL(/\/pegawai\/expenses/);
      
      // Table should be visible
      const table = page.locator(SELECTORS.pegawaiExpenses.table);
      await expect(table).toBeVisible();
    });

    test('should display page heading', async ({ page }) => {
      await page.goto(URLS.pegawaiExpenses);
      
      await expect(page.locator('h2')).toContainText('Reimburse');
    });

    test('should have "Klaim Reimburse" button', async ({ page }) => {
      await page.goto(URLS.pegawaiExpenses);
      
      const createBtn = page.locator(SELECTORS.pegawaiExpenses.createButton);
      await expect(createBtn).toBeVisible();
    });

    test('should have export Excel button', async ({ page }) => {
      await page.goto(URLS.pegawaiExpenses);
      
      const exportBtn = page.locator(SELECTORS.pegawaiExpenses.exportButton);
      await expect(exportBtn).toBeVisible();
    });
  });

  test.describe('Create Reimburse Form', () => {

    test('should load the expense creation form', async ({ page }) => {
      await page.goto(URLS.pegawaiExpensesCreate);
      
      await expect(page).toHaveURL(/\/pegawai\/expenses\/create/);
    });

    test('should display all required form fields', async ({ page }) => {
      await page.goto(URLS.pegawaiExpensesCreate);
      
      // Travel select dropdown
      const travelSelect = page.locator(SELECTORS.expenseForm.travelSelect);
      // This may not exist if there are no approved travels
      const travelSelectExists = await travelSelect.count() > 0;
      
      if (travelSelectExists) {
        await expect(travelSelect).toBeVisible();
      }
      
      // Cost component select
      await expect(page.locator(SELECTORS.expenseForm.costComponentSelect)).toBeVisible();
      
      // Amount input
      await expect(page.locator(SELECTORS.expenseForm.amountInput)).toBeVisible();
      
      // Description textarea
      await expect(page.locator(SELECTORS.expenseForm.descriptionInput)).toBeVisible();
      
      // Submit button
      await expect(page.locator(SELECTORS.expenseForm.submitButton)).toBeVisible();
    });

    test('should have page heading for creating reimburse', async ({ page }) => {
      await page.goto(URLS.pegawaiExpensesCreate);
      
      await expect(page.locator('h2')).toContainText('Reimburse');
    });
  });

  test.describe('View Reimburse', () => {

    test('should display expense table with correct columns', async ({ page }) => {
      await page.goto(URLS.pegawaiExpenses);
      
      const table = page.locator(SELECTORS.pegawaiExpenses.table);
      await expect(table).toBeVisible();
      
      // Check column headers
      await expect(table.locator('th')).toContainText(['No. Permohonan']);
    });

    test('should navigate from list to create form', async ({ page }) => {
      await page.goto(URLS.pegawaiExpenses);
      
      await page.click(SELECTORS.pegawaiExpenses.createButton);
      
      await expect(page).toHaveURL(/\/pegawai\/expenses\/create/);
    });
  });
});

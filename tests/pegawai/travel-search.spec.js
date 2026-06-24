// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { URLS } = require('../helpers/test-data');
const SELECTORS = require('../helpers/selectors');

test.describe('Pegawai Travel Search and Filter', () => {
  const uniquePurpose = `[E2E-SEARCH-TEST-PURPOSE] Evaluasi Riset Akademik`;
  const uniqueDestination = `[E2E-SEARCH-TEST-DEST] Kota Bandung`;

  test.beforeEach(async ({ page }) => {
    await login(page, 'pegawai');
  });

  test('should display search and filter input controls', async ({ page }) => {
    await page.goto(URLS.pegawaiTravels);

    await expect(page.locator('#search-input')).toBeVisible();
    await expect(page.locator('#status-filter')).toBeVisible();
    await expect(page.locator('#search-submit')).toBeVisible();
  });

  test('should search by destination and purpose', async ({ page }) => {
    let travelId = null;

    try {
      // 1. Create a unique travel request first
      await page.goto(URLS.pegawaiTravelsCreate);
      await page.fill(SELECTORS.travelForm.purposeInput, uniquePurpose);
      await page.fill(SELECTORS.travelForm.destinationInput, uniqueDestination);
      await page.fill(SELECTORS.travelForm.startDateInput, '2026-11-01');
      await page.fill(SELECTORS.travelForm.endDateInput, '2026-11-05');
      await page.click(SELECTORS.travelForm.submitButton);

      await page.waitForURL(/\/pegawai\/travels\/detail\/\d+/);
      const match = page.url().match(/\/detail\/(\d+)/);
      if (match) {
        travelId = match[1];
      }

      // 2. Go back to travels list page
      await page.goto(URLS.pegawaiTravels);

      // 3. Search for the unique destination
      await page.fill('#search-input', 'Kota Bandung');
      
      let responsePromise = page.waitForResponse(
        response => response.url().includes('/pegawai/travels') && response.status() === 200
      );
      await page.click('#search-submit');
      await responsePromise;

      // Verify it is visible
      const tableBody = page.locator('table tbody');
      await expect(tableBody).toContainText('Kota Bandung');

      // 4. Search for a non-existent keyword
      await page.fill('#search-input', 'KeywordTidakMungkinAda123456');
      
      responsePromise = page.waitForResponse(
        response => response.url().includes('/pegawai/travels') && response.status() === 200
      );
      await page.click('#search-submit');
      await responsePromise;

      // Verify the table does not contain our search target
      await expect(tableBody).not.toContainText('Kota Bandung');
    } finally {
      // Clean up the created travel request
      if (travelId) {
        page.once('dialog', async (dialog) => {
          await dialog.accept();
        });
        await page.goto(`/pegawai/travels/delete/${travelId}`);
      }
    }
  });

  test('should filter by status and reset', async ({ page }) => {
    let travelId = null;

    try {
      // 1. Create a draft travel request
      await page.goto(URLS.pegawaiTravelsCreate);
      await page.fill(SELECTORS.travelForm.purposeInput, `${uniquePurpose} - Draft`);
      await page.fill(SELECTORS.travelForm.destinationInput, uniqueDestination);
      await page.fill(SELECTORS.travelForm.startDateInput, '2026-11-10');
      await page.fill(SELECTORS.travelForm.endDateInput, '2026-11-15');
      await page.click(SELECTORS.travelForm.submitButton);

      await page.waitForURL(/\/pegawai\/travels\/detail\/\d+/);
      const match = page.url().match(/\/detail\/(\d+)/);
      if (match) {
        travelId = match[1];
      }

      // 2. Go to list page
      await page.goto(URLS.pegawaiTravels);

      // 3. Filter by status 'draft'
      let responsePromise = page.waitForResponse(
        response => response.url().includes('/pegawai/travels') && response.status() === 200
      );
      await page.selectOption('#status-filter', 'draft');
      await responsePromise;
      
      // Check that our draft request is listed
      await expect(page.locator('table tbody')).toContainText(`${uniquePurpose} - Draft`);

      // 4. Filter by status 'rejected'
      responsePromise = page.waitForResponse(
        response => response.url().includes('/pegawai/travels') && response.status() === 200
      );
      await page.selectOption('#status-filter', 'rejected');
      await responsePromise;
      
      // Check that our draft request is NOT listed
      await expect(page.locator('table tbody')).not.toContainText(`${uniquePurpose} - Draft`);

      // 5. Click reset button
      responsePromise = page.waitForResponse(
        response => response.url().includes('/pegawai/travels') && response.status() === 200
      );
      await page.click('#search-reset');
      await responsePromise;

      // Verify filter is reset and the draft is visible again
      await expect(page.locator('#search-input')).toHaveValue('');
      await expect(page.locator('#status-filter')).toHaveValue('');
      await expect(page.locator('table tbody')).toContainText(`${uniquePurpose} - Draft`);
    } finally {
      // Clean up the created travel request
      if (travelId) {
        page.once('dialog', async (dialog) => {
          await dialog.accept();
        });
        await page.goto(`/pegawai/travels/delete/${travelId}`);
      }
    }
  });
});

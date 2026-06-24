// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { URLS, TRAVEL_TEST_DATA, TRAVEL_UPDATE_DATA } = require('../helpers/test-data');
const SELECTORS = require('../helpers/selectors');

/**
 * Pegawai Travel Request Tests
 * 
 * Tests travel request CRUD operations:
 * - View travel list
 * - Create a new travel request
 * - View travel detail
 * - Edit/Update travel request
 * - Delete travel request
 * 
 * Uses test-safe data tagged with [E2E-TEST] prefix.
 */
test.describe('Pegawai Travel Requests', () => {
  
  // Store the created travel ID for subsequent tests
  let createdTravelId = null;

  test.beforeEach(async ({ page }) => {
    await login(page, 'pegawai');
  });

  test.describe('Travel List', () => {

    test('should load the travels list page', async ({ page }) => {
      await page.goto(URLS.pegawaiTravels);
      
      await expect(page).toHaveURL(/\/pegawai\/travels/);
      
      // Table should be present
      const table = page.locator(SELECTORS.pegawaiTravels.table);
      await expect(table).toBeVisible();
    });

    test('should have a create travel button', async ({ page }) => {
      await page.goto(URLS.pegawaiTravels);
      
      const createBtn = page.locator(SELECTORS.pegawaiTravels.createButton);
      await expect(createBtn).toBeVisible();
    });

    test('should navigate to create travel form', async ({ page }) => {
      await page.goto(URLS.pegawaiTravels);
      
      await page.click(SELECTORS.pegawaiTravels.createButton);
      await expect(page).toHaveURL(/\/pegawai\/travels\/create/);
    });
  });

  test.describe('Create Travel Request', () => {

    test('should display the travel creation form', async ({ page }) => {
      await page.goto(URLS.pegawaiTravelsCreate);
      
      // All form fields should be visible
      await expect(page.locator(SELECTORS.travelForm.purposeInput)).toBeVisible();
      await expect(page.locator(SELECTORS.travelForm.destinationInput)).toBeVisible();
      await expect(page.locator(SELECTORS.travelForm.startDateInput)).toBeVisible();
      await expect(page.locator(SELECTORS.travelForm.endDateInput)).toBeVisible();
      await expect(page.locator(SELECTORS.travelForm.submitButton)).toBeVisible();
    });

    test('should create a new travel request successfully', async ({ page }) => {
      await page.goto(URLS.pegawaiTravelsCreate);
      
      // Fill form fields
      await page.fill(SELECTORS.travelForm.purposeInput, TRAVEL_TEST_DATA.purpose);
      await page.fill(SELECTORS.travelForm.destinationInput, TRAVEL_TEST_DATA.destination);
      await page.fill(SELECTORS.travelForm.startDateInput, TRAVEL_TEST_DATA.start_date);
      await page.fill(SELECTORS.travelForm.endDateInput, TRAVEL_TEST_DATA.end_date);
      
      // Submit form
      await page.click(SELECTORS.travelForm.submitButton);
      
      // Should redirect to detail page
      await page.waitForURL(/\/pegawai\/travels\/detail\/\d+/, { timeout: 10000 });
      
      // Extract the travel ID from the URL for subsequent tests
      const url = page.url();
      const match = url.match(/\/detail\/(\d+)/);
      if (match) {
        createdTravelId = match[1];
      }
      
      // The detail page should show the travel data
      await expect(page.locator('body')).toContainText(TRAVEL_TEST_DATA.purpose);
      await expect(page.locator('body')).toContainText(TRAVEL_TEST_DATA.destination);
    });
  });

  test.describe('View Travel Detail', () => {

    test('should display travel detail page with sections', async ({ page }) => {
      // Navigate to travels list and click first detail link
      await page.goto(URLS.pegawaiTravels);
      
      const detailLinks = page.locator(SELECTORS.pegawaiTravels.detailLink);
      const count = await detailLinks.count();
      
      if (count > 0) {
        await detailLinks.first().click();
        await page.waitForURL(/\/pegawai\/travels\/detail\/\d+/);
        
        // Verify detail page has core sections
        await expect(page.locator('body')).toContainText('SPD/');
      } else {
        // No travel requests exist — skip gracefully
        test.skip();
      }
    });
  });

  test.describe('Update Travel Request', () => {

    test('should update an existing draft travel request', async ({ page }) => {
      // First create a travel to ensure one exists
      await page.goto(URLS.pegawaiTravelsCreate);
      await page.fill(SELECTORS.travelForm.purposeInput, TRAVEL_TEST_DATA.purpose);
      await page.fill(SELECTORS.travelForm.destinationInput, TRAVEL_TEST_DATA.destination);
      await page.fill(SELECTORS.travelForm.startDateInput, TRAVEL_TEST_DATA.start_date);
      await page.fill(SELECTORS.travelForm.endDateInput, TRAVEL_TEST_DATA.end_date);
      await page.click(SELECTORS.travelForm.submitButton);
      
      await page.waitForURL(/\/pegawai\/travels\/detail\/\d+/, { timeout: 10000 });
      
      // Get the ID
      const url = page.url();
      const match = url.match(/\/detail\/(\d+)/);
      expect(match).toBeTruthy();
      const travelId = match[1];
      
      // Navigate to the edit form
      await page.goto(`/pegawai/travels/edit/${travelId}`);
      
      // Clear and fill with updated data
      await page.fill(SELECTORS.travelForm.purposeInput, TRAVEL_UPDATE_DATA.purpose);
      await page.fill(SELECTORS.travelForm.destinationInput, TRAVEL_UPDATE_DATA.destination);
      await page.fill(SELECTORS.travelForm.startDateInput, TRAVEL_UPDATE_DATA.start_date);
      await page.fill(SELECTORS.travelForm.endDateInput, TRAVEL_UPDATE_DATA.end_date);
      
      // Submit
      await page.click(SELECTORS.travelForm.submitButton);
      
      // Should redirect to detail page
      await page.waitForURL(/\/pegawai\/travels\/detail\/\d+/, { timeout: 10000 });
      
      // Verify updated data is shown
      await expect(page.locator('body')).toContainText(TRAVEL_UPDATE_DATA.destination);
    });
  });

  test.describe('Delete Travel Request', () => {

    test('should delete a draft travel request', async ({ page }) => {
      // First create a travel to delete
      await page.goto(URLS.pegawaiTravelsCreate);
      await page.fill(SELECTORS.travelForm.purposeInput, '[E2E-TEST-DELETE] Perjalanan untuk dihapus');
      await page.fill(SELECTORS.travelForm.destinationInput, 'Test Delete City');
      await page.fill(SELECTORS.travelForm.startDateInput, '2026-12-20');
      await page.fill(SELECTORS.travelForm.endDateInput, '2026-12-25');
      await page.click(SELECTORS.travelForm.submitButton);
      
      await page.waitForURL(/\/pegawai\/travels\/detail\/\d+/, { timeout: 10000 });
      
      // Get the ID
      const url = page.url();
      const match = url.match(/\/detail\/(\d+)/);
      expect(match).toBeTruthy();
      const travelId = match[1];
      
      // Handle the confirm dialog
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });
      
      // Delete the travel
      await page.goto(`/pegawai/travels/delete/${travelId}`);
      
      // Should redirect to travels list
      await page.waitForURL(/\/pegawai\/travels/, { timeout: 10000 });
      
      // Verify the deleted item is no longer present
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).not.toContain('[E2E-TEST-DELETE] Perjalanan untuk dihapus');
    });
  });
});

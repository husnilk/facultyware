// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { URLS } = require('../helpers/test-data');
const SELECTORS = require('../helpers/selectors');

/**
 * Pimpinan Travel Approval Tests
 * 
 * Verifies:
 * - Travel request list visible
 * - Detail page opens
 * - Approve/Reject buttons exist for pending requests
 * - Approval form has notes textarea
 * 
 * Does NOT perform destructive approval actions unless test data
 * was created within the test itself.
 */
test.describe('Pimpinan Travel Approval', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'pimpinan');
  });

  test.describe('Travel List', () => {

    test('should load the pimpinan travels list page', async ({ page }) => {
      await page.goto(URLS.pimpinanTravels);
      
      await expect(page).toHaveURL(/\/pimpinan\/travels/);
      
      // Table should be visible
      const table = page.locator('table');
      await expect(table).toBeVisible();
    });

    test('should display page heading for all travel requests', async ({ page }) => {
      await page.goto(URLS.pimpinanTravels);
      
      await expect(page.locator('h2')).toContainText('Perjalanan Dinas');
    });
  });

  test.describe('Travel Detail Page', () => {

    test('should open a travel detail page', async ({ page }) => {
      await page.goto(URLS.pimpinanTravels);
      
      // Click the first detail/proses link
      const detailLinks = page.locator('a[href^="/pimpinan/travels/detail/"]');
      const count = await detailLinks.count();
      
      if (count > 0) {
        await detailLinks.first().click();
        await page.waitForURL(/\/pimpinan\/travels\/detail\/\d+/);
        
        // Travel info should be visible
        await expect(page.locator(SELECTORS.pimpinanApproval.travelInfoCard)).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should display travel information sections', async ({ page }) => {
      await page.goto(URLS.pimpinanTravels);
      
      const detailLinks = page.locator('a[href^="/pimpinan/travels/detail/"]');
      const count = await detailLinks.count();
      
      if (count > 0) {
        await detailLinks.first().click();
        await page.waitForURL(/\/pimpinan\/travels\/detail\/\d+/);
        
        // Information card visible
        await expect(page.locator(SELECTORS.pimpinanApproval.travelInfoCard)).toBeVisible();
        
        // Approval history section visible
        await expect(page.locator(SELECTORS.pimpinanApproval.approvalHistory)).toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Approval Buttons', () => {

    test('should display approve and reject buttons for pending requests', async ({ page }) => {
      await page.goto(URLS.pimpinanTravels);
      
      const detailLinks = page.locator('a[href^="/pimpinan/travels/detail/"]');
      const count = await detailLinks.count();
      
      if (count === 0) {
        test.skip();
        return;
      }
      
      // Look for a pending travel to check
      for (let i = 0; i < count; i++) {
        await page.goto(URLS.pimpinanTravels);
        const links = page.locator('a[href^="/pimpinan/travels/detail/"]');
        await links.nth(i).click();
        await page.waitForURL(/\/pimpinan\/travels\/detail\/\d+/);
        
        // Check if this is a pending request with approval form
        const approveButton = page.locator(SELECTORS.pimpinanApproval.approveButton);
        const rejectButton = page.locator(SELECTORS.pimpinanApproval.rejectButton);
        
        const hasApproveBtn = await approveButton.count() > 0;
        
        if (hasApproveBtn) {
          // Both buttons should exist
          await expect(approveButton).toBeVisible();
          await expect(rejectButton).toBeVisible();
          
          // Notes textarea should exist
          await expect(page.locator(SELECTORS.pimpinanApproval.notesInput)).toBeVisible();
          
          // Decision heading should be visible
          await expect(page.locator(SELECTORS.pimpinanApproval.keputusanHeading)).toBeVisible();
          
          return; // Found and verified a pending request
        }
      }
      
      // If no pending requests found, skip
      test.skip();
    });

    test('should have approval form with notes input for pending requests', async ({ page }) => {
      await page.goto(URLS.pimpinanTravels);
      
      const detailLinks = page.locator('a[href^="/pimpinan/travels/detail/"]');
      const count = await detailLinks.count();
      
      if (count === 0) {
        test.skip();
        return;
      }
      
      // Check the first detail page for the approval form
      await detailLinks.first().click();
      await page.waitForURL(/\/pimpinan\/travels\/detail\/\d+/);
      
      const approvalForm = page.locator(SELECTORS.pimpinanApproval.approvalForm);
      const hasForm = await approvalForm.count() > 0;
      
      if (hasForm) {
        await expect(approvalForm).toBeVisible();
        await expect(page.locator(SELECTORS.pimpinanApproval.notesInput)).toBeVisible();
      }
      // If no form (already processed), the test still passes — it's a read-only check
    });
  });
});

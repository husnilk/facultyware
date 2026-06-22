// Persetujuan PO oleh wakil dekan: antrean, arsip, dan peninjauan detail.
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');

test.describe('Persetujuan PO', () => {
  test.beforeEach(async ({ page }) => login(page, 'wadir'));

  test('membuka antrean persetujuan PO', async ({ page }) => {
    await page.goto('/approval/po');
    await expect(page.getByRole('heading', { name: 'Persetujuan Belanja (PO)' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();
  });

  test('membuka arsip persetujuan PO', async ({ page }) => {
    await page.goto('/approval/po/archive');
    await expect(page.getByRole('heading', { name: 'Arsip Persetujuan PO' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Penyetuju' })).toBeVisible();
  });

  // Detail PO hanya ada bila ada antrean; lewati bila antrean kosong.
  test('meninjau detail PO bila tersedia', async ({ page }) => {
    await page.goto('/approval/po');
    const firstDetail = page.getByRole('link', { name: 'Tinjau' }).first();
    if (await firstDetail.count()) {
      await firstDetail.click();
      await expect(page).toHaveURL(/\/purchase\/\d+$/);
      await expect(page.getByText('Nomor Purchase Order')).toBeVisible();
    } else {
      test.skip(true, 'Tidak ada PO yang menunggu persetujuan.');
    }
  });
});

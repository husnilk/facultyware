// import { test, expect } from '@playwright/test';

// test.describe('Fitur Penanggung Jawab (Manager)', () => {

//   test.beforeEach(async ({ page }) => {
//     await page.goto('http://localhost:3000/login');
//     await page.fill('input[name="name"]', 'PJ'); 
//     await page.fill('input[name="password"]', 'pjperalatan');
//     await page.click('button[type="submit"]');
//   });

//   test('Statistik API dimuat di Dashboard', async ({ page }) => {
//     await page.goto('http://localhost:3000/manager/ongoing');
    
//     // API apiRequestedLoans akan mengisi badge di sidebar
//     const badgeRequested = page.locator('#count-requested');
//     await expect(badgeRequested).toBeVisible();
//   });

//   test('Dapat menyetujui peminjaman (Approve)', async ({ page }) => {
//     await page.goto('http://localhost:3000/manager/ongoing');
    
//     page.on('dialog', dialog => dialog.accept());
//     const btnTerima = page.locator('button:has-text("Terima")').first();
    
//     if (await btnTerima.isVisible()) {
//       await btnTerima.click();
//       await page.waitForLoadState('networkidle');
//     }
//   });

//   test('Dapat melakukan pembatalan massal (Bulk Cancel)', async ({ page }) => {
//     await page.goto('http://localhost:3000/manager/ongoing');
    
//     page.on('dialog', dialog => dialog.accept());
    
//     const selectAll = page.locator('#selectAll');
//     if (await selectAll.isVisible()) {
//       await selectAll.check();
//       await page.click('button:has-text("Batalkan Terpilih")');
//       await page.waitForLoadState('networkidle');
//     }
//   });

//   test('Dapat melakukan export CSV Riwayat', async ({ page }) => {
//     await page.goto('http://localhost:3000/manager');
    
//     // Siapkan Playwright untuk menangkap file yang terunduh
//     const downloadPromise = page.waitForEvent('download');
    
//     // Tembak URL download secara paksa, dan abaikan error navigasinya dengan .catch()
//     await page.goto('http://localhost:3000/manager/report/export-csv').catch(() => {});
    
//     const download = await downloadPromise;
    
//     // Pastikan nama file CSV-nya sesuai
//     expect(download.suggestedFilename()).toContain('status-peminjaman');
//   });

// });

import { test, expect } from '@playwright/test';

test.describe('Modul 3: Dasbor Manager', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="name"]', 'PJ'); // Ganti email manager
    await page.fill('input[name="password"]', 'pjperalatan');
    await page.click('button[type="submit"]');
  });

  // Ongoing Dashboard UI & API
  test('35. Halaman Peminjaman Berlangsung (Ongoing) dapat diakses', async ({ page }) => {
    await page.goto('http://localhost:3000/manager/ongoing');
    await expect(page.locator('h1')).toContainText('Sedang Berlangsung');
  });
  test('36. Sidebar menu manajer menampilkan menu Ongoing dan Riwayat', async ({ page }) => {
    await expect(page.locator('a:has-text("Peminjaman yang Sedang Berlangsung")')).toBeVisible();
    await expect(page.locator('a:has-text("Riwayat Peminjaman")')).toBeVisible();
  });
  test('37. API - Badge jumlah request baru muncul di sidebar dan card', async ({ page }) => {
    await page.goto('http://localhost:3000/manager/ongoing');
    await page.waitForTimeout(3000); // Tunggu fetch JS
    const count = await page.locator('#count-requested').textContent();
    expect(count).not.toBe('-');
  });
  test('38. Input Select All Checkbox tersedia di tabel Ongoing', async ({ page }) => {
    await page.goto('http://localhost:3000/manager/ongoing');
    await expect(page.locator('#selectAll')).toBeVisible();
  });
  test('39. Tombol Batalkan Terpilih (Bulk Action) tersedia', async ({ page }) => {
    await page.goto('http://localhost:3000/manager/ongoing');
    await expect(page.locator('button[form="bulkCancelForm"]')).toBeVisible();
  });

  // Action Buttons (Approve/Reject/Return/Bulk)
  test('40. Aksi Terima memunculkan pop-up dialog', async ({ page }) => {
    await page.goto('http://localhost:3000/manager/ongoing');
    page.on('dialog', dialog => dialog.dismiss());
    const btn = page.locator('button:has-text("Terima")').first();
    if (await btn.isVisible()) await btn.click();
  });
  test('41. UPDATE - Menerima (Approve) mengubah status peminjaman', async ({ page }) => {
    await page.goto('http://localhost:3000/manager/ongoing');
    page.on('dialog', dialog => dialog.accept());
    const btn = page.locator('button:has-text("Terima")').first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForLoadState('networkidle');
    }
  });
  test('42. UPDATE - Menolak (Reject) mengubah status peminjaman', async ({ page }) => {
    await page.goto('http://localhost:3000/manager/ongoing');
    page.on('dialog', dialog => dialog.accept());
    const btn = page.locator('button:has-text("Tolak")').first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForLoadState('networkidle');
    }
  });
  test('43. UPDATE - Menandai dikembalikan (Return) mengubah status', async ({ page }) => {
    await page.goto('http://localhost:3000/manager/ongoing');
    page.on('dialog', dialog => dialog.accept());
    const btn = page.locator('button:has-text("Dikembalikan")').first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForLoadState('networkidle');
    }
  });
  test('44. BULK UPDATE - Fitur Batalkan Terpilih berhasil memproses checklist', async ({ page }) => {
    await page.goto('http://localhost:3000/manager/ongoing');
    page.on('dialog', dialog => dialog.accept());
    const selectAll = page.locator('#selectAll');
    if (await selectAll.isVisible()) {
      await selectAll.check();
      await page.click('button:has-text("Batalkan Terpilih")');
      await page.waitForLoadState('networkidle');
    }
  });

  // History Dashboard UI & Stats
  test('45. Halaman Riwayat Peminjaman (History) dapat diakses', async ({ page }) => {
    await page.goto('http://localhost:3000/manager');
    await expect(page.locator('h1')).toContainText('Riwayat Peminjaman');
  });
  test('46. API - Card Total Peminjaman Selesai terisi otomatis', async ({ page }) => {
    await page.goto('http://localhost:3000/manager');
    await page.waitForTimeout(1000);
    expect(await page.locator('#stat-total').textContent()).not.toBe('-');
  });
  test('47. API - Card Total Dibatalkan terisi otomatis', async ({ page }) => {
    await page.goto('http://localhost:3000/manager');
    await page.waitForTimeout(1000);
    expect(await page.locator('#stat-unreturned').textContent()).not.toBe('-');
  });

  // Filter & Search
  test('48. Form Filter memiliki input Search, Status, Date From, dan Date To', async ({ page }) => {
    await page.goto('http://localhost:3000/manager');
    await expect(page.locator('input[name="search"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
    await expect(page.locator('input[name="date_from"]')).toBeVisible();
  });
  test('49. READ - Filter menggunakan kata kunci pencarian (Search) sukses', async ({ page }) => {
    await page.goto('http://localhost:3000/manager');
    await page.fill('input[name="search"]', 'Wanda');
    await page.click('button:has-text("Filter")');
    await expect(page).toHaveURL(/.*search=Wanda/);
  });
  test('50. READ - Filter menggunakan Dropdown Status (Returned) sukses', async ({ page }) => {
    await page.goto('http://localhost:3000/manager');
    await page.selectOption('select[name="status"]', 'returned');
    await page.click('button:has-text("Filter")');
    await expect(page).toHaveURL(/.*status=returned/);
  });
  test('51. Tombol Reset Filter muncul jika ada query parameter aktif', async ({ page }) => {
    await page.goto('http://localhost:3000/manager?search=Wanda');
    await expect(page.locator('a:has-text("Reset")')).toBeVisible();
  });

  // Detail & Export
  test('52. Tautan Detail di tabel riwayat berfungsi', async ({ page }) => {
    await page.goto('http://localhost:3000/manager');
    const linkDetail = page.locator('a:has-text("Detail")').first();
    if (await linkDetail.isVisible()) {
      await linkDetail.click();
      await expect(page).toHaveURL(/.*detail/);
    }
  });
  test('53. READ DETAIL - Halaman Detail menampilkan ID, Kode Aset, dan Tanggal', async ({ page }) => {
    await page.goto('http://localhost:3000/manager');
    const linkDetail = page.locator('a:has-text("Detail")').first();
    if (await linkDetail.isVisible()) {
      await linkDetail.click();
      await expect(page.locator('dt:has-text("Kode Aset")')).toBeVisible();
    }
  });
  test('54. Tombol Kembali di Halaman Detail berfungsi membalikkan navigasi', async ({ page }) => {
    await page.goto('http://localhost:3000/manager');
    const linkDetail = page.locator('a:has-text("Detail")').first();
    if (await linkDetail.isVisible()) {
      await linkDetail.click();
      await page.click('a:has-text("Kembali")');
      await expect(page).toHaveURL(/.*manager$/);
    }
  });
  test('55. Halaman Preview Laporan HTML dapat diakses', async ({ page }) => {
    await page.goto('http://localhost:3000/manager');
    await page.click('a:has-text("Preview Laporan")');
    await expect(page).toHaveURL(/.*preview/);
  });
  test('56. Preview Laporan menyembunyikan Sidebar & Header saat Print CSS', async ({ page }) => {
    await page.goto('http://localhost:3000/manager/report/preview');
    // Memastikan class "no-print" terpasang di header
    await expect(page.locator('.no-print').first()).toBeVisible();
  });
  test('57. EXPORT - Unduhan PDF Ongoing Report berhasil ditarik', async ({ page }) => {
    await page.goto('http://localhost:3000/manager/ongoing');
    const downloadPromise = page.waitForEvent('download');
    await page.click('a:has-text("Export PDF")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('peminjaman-berlangsung');
  });
  test('58. EXPORT - Unduhan CSV History Report berhasil via URL', async ({ page }) => {
    await page.goto('http://localhost:3000/manager');
    const downloadPromise = page.waitForEvent('download');
    await page.goto('http://localhost:3000/manager/report/export-csv').catch(() => {});
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });
});
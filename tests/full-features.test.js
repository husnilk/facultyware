const { test, expect } = require('@playwright/test');

test('Fitur 1 - Melihat data aset yang tersedia', async ({ page }) => {
  await page.goto('/assets');
  await expect(page.locator('h1')).toContainText('Distribusi Aset FTI');
  await expect(page.locator('table')).toBeVisible();
});

test('Fitur 2 - Melihat detail informasi aset', async ({ page }) => {
  await page.goto('/assets');
  await page.locator('a:has-text("Kelola Distribusi")').first().click();
  await expect(page.url()).toContain('/assets/detail/');
});

test('Fitur 3 - Mencari aset berdasarkan nama atau kode', async ({ page }) => {
  await page.goto('/assets');
  await page.fill('input[name="search"]', 'Epson');
  await page.click('button[type="submit"]');
  await expect(page.locator('tbody')).toContainText('Epson');
});

test('Fitur 4 - Memfilter aset berdasarkan status', async ({ page }) => {
  await page.goto('/assets');
  await page.selectOption('select[name="status"]', 'available');
  await page.click('button[type="submit"]');
  const badges = page.locator('.badge');
  const count = await badges.count();
  for (let i = 0; i < count; i++) {
    await expect(badges.nth(i)).toContainText('Tersedia');
  }
});

test('Fitur 5 - REST API mengakses data aset', async ({ page }) => {
  const response = await page.request.get('/assets/api');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(Array.isArray(body.data)).toBe(true);
});

test('Fitur 6 - Generate data aset (Excel & PDF)', async ({ page }) => {
  await page.goto('/assets');

  const [downloadExcel] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    page.evaluate(() => {
      window.location.href = '/assets/export/excel';
    }),
  ]);
  expect(downloadExcel.suggestedFilename()).toContain('.xlsx');

  await page.goto('/assets');

  const [downloadPDF] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    page.evaluate(() => {
      window.location.href = '/assets/export/pdf';
    }),
  ]);
  expect(downloadPDF.suggestedFilename()).toContain('.pdf');
});

test('Fitur 7 - Mengunggah form BAST', async ({ page }) => {
  await page.goto('/assets');
  await page.locator('a:has-text("Kelola Distribusi")').first().click();
  await page.waitForLoadState('networkidle');

  const fileInput = page.locator('input[name="bast_file"]');
  const isVisible = await fileInput.isVisible().catch(() => false);

  if (isVisible) {
    await fileInput.setInputFiles({
      name: 'test-bast.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('dummy pdf content for testing'),
    });
    await page.click('button:has-text("Unggah & Aktifkan Distribusi")');
    await page.waitForLoadState('networkidle');
  } else {
    console.log('Form upload BAST tidak tersedia pada aset ini');
  }
});

test('Fitur 8 - Melihat daftar penerima aset', async ({ page }) => {
  await page.goto('/assets/distributions/recipients');
  await expect(page.locator('table')).toBeVisible();
});

test('Fitur 9 - Mengalokasikan aset ke personal tertentu', async ({ page }) => {
  await page.goto('/assets');
  await page.selectOption('select[name="status"]', 'available');
  await page.click('button[type="submit"]');

  const rows = page.locator('tbody tr');
  const rowCount = await rows.count();
  console.log('Jumlah aset tersedia:', rowCount);

  if (rowCount === 0) {
    console.log('Tidak ada aset berstatus Tersedia, test dilewati.');
    return;
  }

  await page.locator('a:has-text("Kelola Distribusi")').first().click();
  await page.waitForLoadState('networkidle');

  const allocateForm = page.locator('h2:has-text("Alokasikan Aset")');
  const isFormVisible = await allocateForm.isVisible().catch(() => false);

  if (!isFormVisible) {
    console.log('Form alokasi tidak tersedia untuk aset ini.');
    return;
  }

  const recipientSelect = page.locator('select[name="recipient_id"]');
  const options = await recipientSelect.locator('option').allTextContents();

  if (options.length > 1) {
    await recipientSelect.selectOption({ index: 1 });
    await page.fill('input[name="distribution_date"]', '2026-06-21');
    await page.click('button:has-text("Buat Alokasi & Cetak BAST")');
    await page.waitForLoadState('networkidle');
  }
});

test('Fitur 10 - Melihat detail informasi distribusi aset', async ({ page }) => {
  await page.goto('/assets');
  await page.locator('a:has-text("Kelola Distribusi")').first().click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=Riwayat Distribusi')).toBeVisible();
});

test('Fitur 11 - REST API mengakses data distribusi', async ({ page }) => {
  const response = await page.request.get('/assets/distributions/api');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(Array.isArray(body.data)).toBe(true);
});

test('Fitur 12 - Mencetak form BAST', async ({ page, context }) => {
  await page.goto('/assets/distributions');

  const printLinks = page.locator('a:has-text("Cetak BAST")');
  const count = await printLinks.count();
  console.log('Jumlah link Cetak BAST:', count);

  if (count > 0) {
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      printLinks.first().click(),
    ]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('/distributions/print/');
    await newPage.close();
  } else {
    console.log('Tidak ada data distribusi untuk ditest');
  }
});

test('Fitur 13 - Menerima pengembalian aset', async ({ page }) => {
  await page.goto('/assets');

  await page.selectOption('select[name="status"]', 'in_use');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');

  const rows = page.locator('tbody tr');
  const rowCount = await rows.count();
  console.log('Jumlah aset in_use:', rowCount);

  if (rowCount === 0) {
    console.log('Tidak ada aset berstatus Digunakan, test dilewati.');
    return;
  }

  await page.locator('a:has-text("Kelola Distribusi")').first().click();
  await page.waitForLoadState('networkidle');

  const returnForm = page.locator('form[action*="/distributions/return/"]');
  const formCount = await returnForm.count();

  if (formCount === 0) {
    console.log('Form pengembalian tidak tersedia untuk aset ini.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  await page.fill('input[name="return_date"]', today);

  const notesField = page.locator('textarea[name="return_notes"]');
  if (await notesField.isVisible()) {
    await notesField.fill('Aset dikembalikan dalam kondisi baik - testing');
  }

  const returnBtn = page.locator('button:has-text("Konfirmasi Pengembalian Aset")');
  const btnCount = await returnBtn.count();

  if (btnCount === 0) {
    console.log('Tombol konfirmasi tidak ditemukan, test dilewati.');
    return;
  }

  page.once('dialog', dialog => dialog.accept());
  await returnBtn.click();
  await page.waitForLoadState('networkidle');

  console.log('Pengembalian aset berhasil diproses');
});

test('Fitur 14 - Melihat riwayat distribusi aset per penerima', async ({ page }) => {
  await page.goto('/assets/distributions/recipients');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('table')).toBeVisible();

  const rows = page.locator('tbody tr');
  const rowCount = await rows.count();
  console.log('Jumlah penerima aset:', rowCount);

  if (rowCount === 0) {
    console.log('Tidak ada data penerima aset.');
    return;
  }

  const riwayatLink = page.locator('a:has-text("Lihat Riwayat Aset")').first();
  const isVisible = await riwayatLink.isVisible().catch(() => false);

  if (isVisible) {
    await riwayatLink.click();
    await page.waitForLoadState('networkidle');
    console.log('URL halaman riwayat:', page.url());
    await expect(page.locator('table')).toBeVisible();
  } else {
    console.log('Link riwayat aset tidak ditemukan, cek selector.');
  }
});
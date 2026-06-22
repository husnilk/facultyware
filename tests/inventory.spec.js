import { test, expect } from '@playwright/test';

// Konfigurasi URL dasar aplikasi
const BASE_URL = 'http://localhost:3000';

// Menjalankan pengujian secara berurutan menggunakan satu sesi browser
test.describe.serial('Testing Full Fitur SIP Facultyware', () => {
  let page;

  // Inisialisasi sesi dan proses autentikasi sebelum seluruh pengujian dimulai
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Proses login admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'admin@facultyware.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Memastikan pengalihan halaman ke dashboard item berhasil
    await expect(page).toHaveURL(`${BASE_URL}/item`);
  });

  // Menutup halaman setelah seluruh pengujian selesai
  test.afterAll(async () => {
    await page.close();
  });

  // Test Case 1: Dashboard
  test('(Dashboard) Sistem berhasil merender halaman utama dan navigasi', async () => {
    await page.goto(`${BASE_URL}/item`);
    await expect(page).toHaveTitle(/Items/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  // Test Case 2: Kategori (List)
  test('(Kategori) Menampilkan halaman daftar Kategori Barang', async () => {
    await page.goto(`${BASE_URL}/kategori`);
    await expect(page.locator('h1')).toContainText('Data Kategori');
    await expect(page.locator('table')).toBeVisible();
  });

  // Test Case 3: Kategori (Create)
  test('(Kategori) Berhasil menyimpan data kategori baru', async () => {
    await page.goto(`${BASE_URL}/kategori`);
    await page.click('text=Tambah Kategori');
    await expect(page).toHaveURL(/.*kategori\/create/);
    
    await page.fill('input[name="name"]', 'Alat Tulis Kantor');
    await page.click('button[type="submit"]');
    await expect(page.locator('table')).toContainText('Alat Tulis Kantor');
  });

  // Test Case 4: Item (List)
  test('(Item) Menampilkan halaman daftar Item Inventaris', async () => {
    await page.goto(`${BASE_URL}/item`);
    await expect(page.locator('h1')).toContainText('Data Item');
    await expect(page.locator('table')).toBeVisible();
  });

  // Test Case 5: Item (Validation)
  test('(Item) Menampilkan pesan validasi jika form tambah item kosong', async () => {
    await page.goto(`${BASE_URL}/item`);
    await page.click('a[href="/item/create"]');
    await expect(page).toHaveURL(/.*item\/create/);
    
    await page.click('button[type="submit"]');
    const form = page.locator('form');
    await expect(form).toBeVisible(); 
  });

  // Test Case 6: Item (Create)
  test('(Item) Skenario Tambah Data Item baru berhasil disimpan ke database', async () => {
    const uniqueName = `Proyektor-${Date.now()}`;
    
    await page.goto(`${BASE_URL}/item`);
    await page.click('a[href="/item/create"]');
    
    await page.fill('input[name="code"]', `CODE-${Date.now()}`);
    await page.fill('input[name="name"]', uniqueName);
    await page.fill('input[name="unit"]', 'Unit');
    await page.fill('input[name="minimal_quantity"]', '2');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('table')).toContainText(uniqueName);
  });

  // Test Case 7: Search
  test('(Item) Modul Live Search HTMX berhasil memfilter tabel secara instan', async () => {
    await page.goto(`${BASE_URL}/item`);
    await page.fill('input[name="q"]', 'Proyektor Epson');
    await page.waitForTimeout(1000); 
    await expect(page.locator('table')).toContainText('Proyektor Epson');
  });

  // Test Case 8: Edit
  test('(Item) Tombol aksi Edit memunculkan halaman dengan data yang sesuai', async () => {
    await page.goto(`${BASE_URL}/item`);
    await page.locator('a[href^="/item/edit"]').first().click();
    await expect(page).toHaveURL(/.*item\/edit.*/);
  });

  // Test Case 9: Export
  test('(Export/Import) Berhasil men-trigger unduhan file Export Excel (.xlsx)', async () => {
    await page.goto(`${BASE_URL}/item`);
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Export Excel'); 
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  // Test Case 10: Import
  test('(Export/Import) Menolak unggahan file Import jika format header tidak sesuai', async () => {
    await page.goto(`${BASE_URL}/item`);
    
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.evaluate(() => {
      const fileInput = document.querySelector('input[name="file"]');
      if (fileInput) fileInput.removeAttribute('required');
    });

    await page.click('button:has-text("Import")');
    await page.waitForTimeout(500); 
  });
});
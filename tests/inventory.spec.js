const { test, expect } = require('@playwright/test');

test.describe('Testing Full Fitur Facultyware', () => {

    // Login
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/login');
        await page.fill('input[name="email"]', 'admin@facultyware.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('http://localhost:3000/item');
    });

    // test 1: Tambah Kategori
    test('Skenario Tambah Kategori Barang', async ({ page }) => {
        await page.goto('http://localhost:3000/kategori/create');
        await page.fill('input[name="name"]', 'Kategori Testing Playwright');
        await page.click('button[type="submit"]'); 
        
        await expect(page).toHaveURL('http://localhost:3000/kategori');
        await expect(page.locator('table')).toContainText('Kategori Testing Playwright');
    });

    // test 2: Tambah Item Inventaris
    test('Skenario Tambah Data Item', async ({ page }) => {
        await page.goto('http://localhost:3000/item/create');
        
        await page.waitForSelector('form[action="/item/create"]');

        await page.getByLabel('Kode Item').fill('TEST-999'); 
        await page.getByLabel('Nama Item').fill('Proyektor Otomatis');
        await page.getByLabel('Unit / Satuan').fill('Unit');
        await page.getByLabel('Minimal Quantity').fill('5');
        await page.getByLabel('Deskripsi').fill('Barang ini ditambahkan oleh robot Playwright'); 
        
        await page.getByRole('button', { name: 'Simpan Item' }).click();
        
        await expect(page).toHaveURL('http://localhost:3000/item');
        await expect(page.locator('table')).toContainText('Proyektor Otomatis');
    });

    // test 3: Live Search HTMX
    test('Skenario Live Search HTMX', async ({ page }) => {
        await page.goto('http://localhost:3000/item');
        await page.fill('input[name="q"]', 'Proyektor Otomatis');
        await page.waitForTimeout(1000); 
        await expect(page.locator('table')).toContainText('Proyektor Otomatis');
    });

});
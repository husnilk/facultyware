const { test, expect } = require('@playwright/test');

test.describe('Alur Pengajuan dan Persetujuan Cuti', () => {

    test('Skenario 1: Pegawai mengajukan cuti dan Atasan Level 2 menyetujuinya (Happy Path)', async ({ page }) => {
        // ======================================================
        // FASE 1: PEGAWAI MENGAJUKAN CUTI
        // ======================================================
        
        // 1. Login sebagai Pegawai
        await page.goto('http://localhost:3000/login');
        await page.fill('input[name="email"]', 'pegawai@faculty.com'); 
        await page.fill('input[name="password"]', '123456'); 
        await page.click('button[type="submit"]');

        // Verifikasi berhasil login (masuk ke dashboard)
        await expect(page).toHaveURL('http://localhost:3000/pegawai');

        // 2. Mengisi Form Pengajuan Cuti
        await page.goto('http://localhost:3000/pegawai/create');
        await page.selectOption('select[name="leave_type_id"]', '1'); // Pilih "Cuti Tahunan"
        
        // Set tanggal: Mulai (besok) sampai Selesai (+3 hari)
        const besok = new Date();
        besok.setDate(besok.getDate() + 1);
        const lusa = new Date();
        lusa.setDate(lusa.getDate() + 3);
        
        await page.fill('input[name="start_date"]', besok.toISOString().split('T')[0]);
        await page.fill('input[name="end_date"]', lusa.toISOString().split('T')[0]);
        await page.fill('textarea[name="reason"]', 'Testing E2E Playwright: Cuti Acara Keluarga');
        await page.fill('input[name="address_leave"]', 'Padang, Sumatera Barat');
        await page.fill('input[name="contact_leave"]', '081234567890');
        
        // Klik tombol Kirim Pengajuan
        await page.click('button[type="submit"]:has-text("Kirim Pengajuan")');

        // Verifikasi kembali ke dashboard setelah sukses
        await expect(page).toHaveURL('http://localhost:3000/pegawai');

        // 3. Logout
        await page.goto('http://localhost:3000/logout');
        await expect(page).toHaveURL('http://localhost:3000/login');


        // ======================================================
        // FASE 2: ATASAN LEVEL 2 MENYETUJUI CUTI
        // ======================================================
        
        // 4. Login sebagai Atasan Level 2
        await page.fill('input[name="email"]', 'atasan2@faculty.com'); 
        await page.fill('input[name="password"]', '123456'); 
        await page.click('button[type="submit"]');

        // Verifikasi masuk ke dashboard Atasan Lvl 2
        await expect(page).toHaveURL(/.*\/atasan-lvl2\/cuti\/pending/);

        // 5. Pilih pengajuan yang paling atas di tabel "Menunggu Persetujuan"
        const detailButton = page.locator('table tbody tr').first().locator('a');
        await detailButton.click();

        // 6. Handle Pop-up "Confirm" Javascript saat tombol disetujui ditekan
        page.once('dialog', async (dialog) => {
            expect(dialog.message()).toContain('Yakin ingin menyetujui');
            await dialog.accept(); // Otomatis menekan "OK" pada popup
        });

        // 7. Klik tombol "Setujui Pengajuan"
        await page.click('button[type="submit"]:has-text("Setujui Pengajuan")');

        // 8. Verifikasi redirect sukses
        await expect(page).toHaveURL(/.*\/atasan-lvl2\/cuti\/pending\?success=approved/);
        
        // Logout setelah selesai
        await page.goto('http://localhost:3000/logout');
    });

    test('Skenario 2: Validasi Error Tanggal Cuti Mundur (Negative Test)', async ({ page }) => {
        // 1. Login sebagai Pegawai
        await page.goto('http://localhost:3000/login');
        await page.fill('input[name="email"]', 'pegawai@faculty.com'); 
        await page.fill('input[name="password"]', '123456'); 
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('http://localhost:3000/pegawai');

        // 2. Akses halaman form pengajuan cuti
        await page.goto('http://localhost:3000/pegawai/create');
        await page.selectOption('select[name="leave_type_id"]', '1');

        // 3. Set Tanggal Salah (Mulai = 5 hari lagi, Selesai = 2 hari lagi)
        const hariIni = new Date();
        
        const limaHariLagi = new Date();
        limaHariLagi.setDate(hariIni.getDate() + 5);
        
        const duaHariLagi = new Date();
        duaHariLagi.setDate(hariIni.getDate() + 2);

        await page.fill('input[name="start_date"]', limaHariLagi.toISOString().split('T')[0]);
        await page.fill('input[name="end_date"]', duaHariLagi.toISOString().split('T')[0]); // Invalid!
        await page.fill('textarea[name="reason"]', 'Testing Error Playwright: Tanggal Terbalik');
        
        // 4. Klik tombol Kirim Pengajuan
        await page.click('button[type="submit"]:has-text("Kirim Pengajuan")');

        // 5. Verifikasi bahwa pesan error muncul di halaman
        const errorAlert = page.locator('.bg-red-50.text-red-700');
        await expect(errorAlert).toBeVisible(); // Kotak merah harus muncul
        await expect(errorAlert).toContainText('Tanggal selesai tidak boleh lebih awal dari tanggal mulai!'); // Pesan harus akurat
    });

    test('Skenario 3: Keamanan Akses Role (Authorization Test)', async ({ page }) => {
        // 1. Login sebagai Pegawai
        await page.goto('http://localhost:3000/login');
        await page.fill('input[name="email"]', 'pegawai@faculty.com'); 
        await page.fill('input[name="password"]', '123456'); 
        await page.click('button[type="submit"]');
        
        // Pastikan login berhasil
        await expect(page).toHaveURL('http://localhost:3000/pegawai');

        // 2. Pegawai "nakal" mencoba memaksa masuk ke URL Atasan Level 2 lewat address bar
        const response = await page.goto('http://localhost:3000/atasan-lvl2/cuti/pending');

        // 3. Verifikasi sistem memblokir akses (HTTP Status 403 Forbidden)
        expect(response.status()).toBe(403);
        
        // 4. Memastikan teks error dari middleware acl.js benar-benar muncul di layar
        const bodyText = await page.locator('body').innerText();
        expect(bodyText).toContain('Akses Ditolak: Anda tidak memiliki izin ke halaman ini.');
    });
});

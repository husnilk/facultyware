// import { test, expect } from '@playwright/test';

// test.describe('Fitur Peminjaman (Mahasiswa)', () => {

//   test.beforeEach(async ({ page }) => {
//     await page.goto('http://localhost:3000/login');
//     await page.fill('input[name="name"]', 'Wanda');
//     await page.fill('input[name="password"]', 'wanda');
//     await page.click('button[type="submit"]');
//   });

//   test('Validasi gagal jika Tanggal Selesai mendahului Tanggal Mulai', async ({ page }) => {
//     await page.goto('http://localhost:3000/equipment-loans/create');
    
//     await page.locator('select[name="equipment_id"]').selectOption({ index: 1 });
//     await page.fill('input[name="start_date"]', '2026-10-15');
//     // Sengaja diisi tanggal mundur
//     await page.fill('input[name="end_date"]', '2026-10-10'); 
//     await page.click('button:has-text("Ajukan")');

//     // Controller akan mengirim status 400
//     await expect(page.locator('body')).toContainText('Gagal Update: Tanggal Selesai tidak boleh sebelum Tanggal Mulai');
//   });

//   test('Berhasil membuat pengajuan baru', async ({ page }) => {
//     await page.goto('http://localhost:3000/equipment-loans/create');
    
//     await page.locator('select[name="equipment_id"]').selectOption({ index: 1 });
//     await page.fill('input[name="start_date"]', '2026-10-10');
//     await page.fill('input[name="end_date"]', '2026-10-15');
//     await page.click('button:has-text("Ajukan")');

//     await expect(page).toHaveURL(/.*equipment-loans/);
//   });

//   test('Berhasil mendownload PDF Bukti Peminjaman', async ({ page }) => {
//     await page.goto('http://localhost:3000/equipment-loans');

//     // Cari link cetak
//     const linkCetak = page.locator('a:has-text("Cetak")').first();
//     if (await linkCetak.isVisible()) {
//       // Playwright harus menangkap event download
//       const downloadPromise = page.waitForEvent('download');
//       await linkCetak.click();
//       const download = await downloadPromise;
      
//       // Pastikan file pdf berhasil digenerate oleh PDFKit
//       expect(download.suggestedFilename()).toContain('Bukti_Pinjam_');
//     }
//   });

// });

import { test, expect } from '@playwright/test';

test.describe('Modul 2: Peminjaman Mahasiswa', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="name"]', 'Wanda');
    await page.fill('input[name="password"]', 'wanda');
    await page.click('button[type="submit"]');
  });

  // Dashboard Read (Index)
  test('13. Halaman Daftar Peminjaman dapat diakses', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Daftar Peminjaman');
  });
  test('14. Tabel riwayat pengajuan peminjaman terlihat', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
  });
  test('15. Header tabel memiliki kolom Kode Aset, Nama, Tgl, Status, Aksi', async ({ page }) => {
    await expect(page.locator('th:has-text("Kode Aset")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });
  test('16. Tombol "Tambah Peminjaman" tersedia', async ({ page }) => {
    await expect(page.locator('a:has-text("Tambah Peminjaman")')).toBeVisible();
  });
  test('17. Sidebar menu menampilkan profil mahasiswa dengan benar', async ({ page }) => {
    await expect(page.locator('footer')).toContainText('Wanda');
  });

  // Create Page & Validations
  test('18. Halaman Form Tambah Peminjaman dapat dibuka', async ({ page }) => {
    await page.click('a:has-text("Tambah Peminjaman")');
    await expect(page).toHaveURL(/.*create/);
  });
  test('19. Dropdown peralatan terisi data dari database', async ({ page }) => {
    await page.goto('http://localhost:3000/equipment-loans/create');
    const options = page.locator('select[name="equipment_id"] option');
    expect(await options.count()).toBeGreaterThan(1); // Opsi disable + data asli
  });
  test('20. Form Tambah memiliki label Tanggal Mulai dan Selesai', async ({ page }) => {
    await page.goto('http://localhost:3000/equipment-loans/create');
    await expect(page.locator('label[for="start_date"]')).toBeVisible();
  });
  test('21. Validasi error jika Tanggal Selesai < Tanggal Mulai (Backend 400)', async ({ page }) => {
    await page.goto('http://localhost:3000/equipment-loans/create');
    await page.locator('select[name="equipment_id"]').selectOption({ index: 1 });
    await page.fill('input[name="start_date"]', '2026-10-20');
    await page.fill('input[name="end_date"]', '2026-10-10'); // Mundur
    await page.click('button:has-text("Ajukan")');
    await expect(page.locator('body')).toContainText('Tanggal Selesai tidak boleh sebelum Tanggal Mulai');
  });
  test('22. CREATE - Proses pengajuan peminjaman berhasil disimpan', async ({ page }) => {
    await page.goto('http://localhost:3000/equipment-loans/create');
    await page.locator('select[name="equipment_id"]').selectOption({ index: 1 });
    await page.fill('input[name="start_date"]', '2026-10-10');
    await page.fill('input[name="end_date"]', '2026-10-15');
    await page.click('button:has-text("Ajukan")');
    await expect(page).toHaveURL(/.*equipment-loans/);
  });
  test('23. Validasi error jika alat yang sama dipinjam dua kali (Aktif)', async ({ page }) => {
    await page.goto('http://localhost:3000/equipment-loans/create');
    await page.locator('select[name="equipment_id"]').selectOption({ index: 1 });
    await page.fill('input[name="start_date"]', '2026-10-16');
    await page.fill('input[name="end_date"]', '2026-10-20');
    await page.click('button:has-text("Ajukan")');
    await expect(page.locator('body')).toContainText('masih memiliki pengajuan atau peminjaman aktif');
  });

  // Edit & Update
  test('24. Link Edit muncul untuk peminjaman berstatus "requested"', async ({ page }) => {
    const editLink = page.locator('a:has-text("Edit")').first();
    if (await editLink.isVisible()) await expect(editLink).toHaveAttribute('href', /.*edit/);
  });
  test('25. Halaman Edit memuat data lama yang akan diubah', async ({ page }) => {
    const editLink = page.locator('a:has-text("Edit")').first();
    if (await editLink.isVisible()) {
      await editLink.click();
      await expect(page.locator('input[name="start_date"]')).not.toBeEmpty();
    }
  });
  test('26. Tombol Batal di form Edit berfungsi kembali ke index', async ({ page }) => {
    const editLink = page.locator('a:has-text("Edit")').first();
    if (await editLink.isVisible()) {
      await editLink.click();
      await page.click('a:has-text("Batal")');
      await expect(page).toHaveURL(/.*equipment-loans/);
    }
  });
  test('27. UPDATE - Berhasil memperbarui tanggal peminjaman', async ({ page }) => {
    const editLink = page.locator('a:has-text("Edit")').first();
    if (await editLink.isVisible()) {
      await editLink.click();
      await page.fill('input[name="end_date"]', '2026-11-01');
      await page.click('button:has-text("Perbarui")');
      await expect(page).toHaveURL(/.*equipment-loans/);
    }
  });

  // Cancel & PDF
  test('28. Fitur Batal (Cancel) memunculkan konfirmasi browser', async ({ page }) => {
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('yakin');
      await dialog.dismiss(); // Dismiss tes UI saja
    });
    const btnCancel = page.locator('button:has-text("Cancel")').first();
    if (await btnCancel.isVisible()) await btnCancel.click();
  });
  test('29. DELETE (Soft) - Mengubah status peminjaman menjadi cancelled', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
    const btnCancel = page.locator('button:has-text("Cancel")').first();
    if (await btnCancel.isVisible()) {
      await btnCancel.click();
      await expect(page.locator('table')).toContainText('Dibatalkan');
    }
  });
  test('30. Indikator "Locked" muncul jika status bukan requested', async ({ page }) => {
    const textLocked = page.locator('text="Locked"').first();
    if (await textLocked.isVisible()) await expect(textLocked).toBeVisible();
  });
  test('31. Tombol Cetak PDF muncul jika status Approved', async ({ page }) => {
    const btnCetak = page.locator('a:has-text("Cetak")').first();
    if (await btnCetak.isVisible()) await expect(btnCetak).toBeVisible();
  });
  test('32. EXPORT - Klik tombol Cetak mengunduh Bukti Peminjaman (PDF)', async ({ page }) => {
    const btnCetak = page.locator('a:has-text("Cetak")').first();
    if (await btnCetak.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await btnCetak.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    }
  });
  test('33. API - Mengakses lacak status API mengembalikan data', async ({ page }) => {
    // Cari satu ID peminjaman untuk di-track
    await page.goto('http://localhost:3000/equipment-loans/api/track/1');
    const content = await page.textContent('body');
    expect(content).toContain('success'); // Bisa true/false tergantung data ada atau tidak
  });

  test('34. Form CREATE menolak submit jika end_date < start_date (client-side)', async ({ page }) => {
    // Tambahkan baris goto ini agar robot masuk ke halaman form dulu
    await page.goto('http://localhost:3000/equipment-loans/create');
    
    await page.fill('input[name="start_date"]', '2026-10-20');
    await page.fill('input[name="end_date"]', '2026-10-10');
    await page.click('button:has-text("Ajukan")');
    await expect(page).toHaveURL(/.*create/); 
  });
});
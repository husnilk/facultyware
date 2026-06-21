const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  reporter: 'html', //  Konfigurasi ini yang memerintahkan pembuatan laporan HTML
  use: {
    baseURL: 'http://localhost:3000',
    headless: true, // Menggunakan true agar browser berjalan cepat di latar belakang tanpa harus pop-up
    trace: 'on-first-retry',
  },
});
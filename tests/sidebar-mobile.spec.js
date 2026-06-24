// @ts-check
const { test, expect } = require('@playwright/test');

async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@facultyware.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/home/);
}

test.describe('Sidebar — Mode Mobile', () => {
  // Viewport mobile (< 768px) agar CSS mobile sidebar aktif
  test.use({ viewport: { width: 390, height: 844 } });

  test('tombol toggle sidebar terlihat di mobile', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator('button[aria-label="Toggle sidebar"]')).toBeVisible();
  });

  test('sidebar terinisialisasi dan tertutup secara default di mobile', async ({ page }) => {
    await loginAsAdmin(page);
    const sidebar = page.locator('#sidebar');
    // Atribut init terpasang → CSS mobile aktif (bukan display:none)
    await expect(sidebar).toHaveAttribute('data-sidebar-initialized', '');
    // Default mobile: tertutup
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  });

  test('toggle membuka sidebar, klik backdrop menutup', async ({ page }) => {
    await loginAsAdmin(page);
    const sidebar = page.locator('#sidebar');

    // Buka via tombol toggle
    await page.click('button[aria-label="Toggle sidebar"]');
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    // Saat terbuka, sidebar menjadi overlay full-screen. Klik area backdrop
    // (di luar panel nav lebar ~288px, sisi kanan layar) untuk menutup.
    await sidebar.click({ position: { x: 370, y: 400 } });
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  });

  test('klik link navigasi membuka sidebar lalu berpindah halaman', async ({ page }) => {
    await loginAsAdmin(page);
    const sidebar = page.locator('#sidebar');

    await page.click('button[aria-label="Toggle sidebar"]');
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    // Link navigasi terlihat & bisa diklik saat sidebar terbuka
    const navLink = sidebar.locator('nav a[href="/equipment-categories"]');
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/\/equipment-categories/);
  });

  test('tekan Escape menutup sidebar di mobile', async ({ page }) => {
    await loginAsAdmin(page);
    const sidebar = page.locator('#sidebar');

    await page.click('button[aria-label="Toggle sidebar"]');
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    await page.keyboard.press('Escape');
    await expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  });
});

test.describe('Sidebar — Mode Desktop', () => {
  // Viewport desktop (>= 768px) — sidebar harus tampil secara default
  test.use({ viewport: { width: 1280, height: 720 } });

  test('sidebar terbuka secara default di desktop', async ({ page }) => {
    await loginAsAdmin(page);
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toHaveAttribute('aria-hidden', 'false');
    // Link logout di dalam sidebar bisa diakses
    await expect(sidebar.locator('a[href="/logout"]')).toBeVisible();
  });
});

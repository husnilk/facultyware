// Helper bersama untuk seluruh test E2E: kredensial seed RBAC, login lewat UI,
// dan login lewat HTTP request (tanpa membuka halaman) untuk test berbasis alur.
const { expect } = require('@playwright/test');

// Akun hasil scripts/seed_rbac.js.
const USERS = {
  admin: { email: 'admin@unand.ac.id', password: 'admin123' },
  wadir: { email: 'wadek@unand.ac.id', password: 'wadek123' },
};

// Login lewat form /login lalu pastikan redirect ke /dashboard.
async function login(page, role = 'admin') {
  const u = USERS[role];
  await page.goto('/login');
  await page.fill('#email', u.email);
  await page.fill('#password', u.password);
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ]);
  await expect(page).toHaveURL(/\/dashboard$/);
}

// POST tanpa mengikuti redirect; aksi yang sukses menjawab 302.
function postNoRedirect(page, url, form) {
  return page.request.post(url, form ? { form, maxRedirects: 0 } : { maxRedirects: 0 });
}

// Login via HTTP request untuk test alur yang berpindah-pindah role.
async function loginRequest(page, role) {
  const u = USERS[role];
  const r = await postNoRedirect(page, '/login', { email: u.email, password: u.password });
  expect(r.status(), `login ${role} harus berhasil`).toBe(302);
}

module.exports = { USERS, login, postNoRedirect, loginRequest };

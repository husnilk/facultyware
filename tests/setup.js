const { chromium } = require('@playwright/test');

async function globalSetup() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'password123');
  
  await Promise.all([
    page.waitForURL(/\/assets\/?$/, { timeout: 60000 }),
    page.click('button[type="submit"]'),
  ]);
  
  await page.context().storageState({ path: 'tests/auth.json' });
  await browser.close();
  
  console.log('Login berhasil, session disimpan');
}

module.exports = globalSetup;
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: assignment-delete.spec.js >> Tombol Hapus Assignment tampil
- Location: testing\assignment-delete.spec.js:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.action.delete').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.action.delete').first()

```

```yaml
- img "Facultyware Logo"
- heading "Facultyware" [level=2]
- text: Survey Management System
- link "🏠 Dashboard":
  - /url: /home
- link "📋 Survey":
  - /url: /survey
- link "❓ Question":
  - /url: /question
- link "🔗 Assignment":
  - /url: /assignment
- text: Facultyware v2.0
- link "🚪 Logout":
  - /url: /logout
- text: Welcome Back, hanif 👋
- paragraph: Faculty Survey Management System
- text: System Online H
- strong: hanif
- text: Administrator Survey Assignment
- heading "Assignment Management" [level=1]
- paragraph: Connect surveys with their questions.
- link "➕ New Assignment":
  - /url: /assignment/create
- text: 🔗
- paragraph: Total Assignment
- heading "0" [level=2]
- text: 📄
- paragraph: Current Page
- heading "1" [level=2]
- text: 📚
- paragraph: Total Page
- heading "0" [level=2]
- text: 🔍
- paragraph: Search
- heading "-" [level=2]
- textbox "Search survey or question..."
- button "Search"
- link "Reset":
  - /url: /assignment
- table:
  - rowgroup:
    - row "No Survey Question Order Action":
      - columnheader "No"
      - columnheader "Survey"
      - columnheader "Question"
      - columnheader "Order"
      - columnheader "Action"
  - rowgroup:
    - row "📭 No Assignment No assignment available.":
      - cell "📭 No Assignment No assignment available.":
        - heading "📭 No Assignment" [level=2]
        - paragraph: No assignment available.
- text: Page 1 of 0
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('Tombol Hapus Assignment tampil', async ({ page }) => {
  4  | 
  5  |     await page.goto('http://localhost:3000/login');
  6  | 
  7  |     await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');
  8  |     await page.fill('input[name="password"]', 'hanif123');
  9  | 
  10 |     await page.click('button[type="submit"]');
  11 | 
  12 |     await page.goto('http://localhost:3000/assignment');
  13 | 
  14 |     await expect(
  15 |       page.locator(".action.delete").first()
> 16 |     ).toBeVisible();
     |       ^ Error: expect(locator).toBeVisible() failed
  17 | 
  18 | });
```
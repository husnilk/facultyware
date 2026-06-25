# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: question-delete.spec.js >> Tombol Hapus Pertanyaan tampil
- Location: testing\question-delete.spec.js:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button[title="Delete Question"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button[title="Delete Question"]').first()

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
- text: Administrator Survey Management
- heading "Data Survey" [level=1]
- paragraph: Create, manage and publish faculty surveys professionally.
- link "📄 Export PDF":
  - /url: /survey/export/pdf
- link "➕ New Survey":
  - /url: /survey/create
- text: 📋
- paragraph: Total Survey
- heading "2" [level=2]
- text: 📄
- paragraph: Current Page
- heading "1" [level=2]
- text: 📚
- paragraph: Total Page
- heading "1" [level=2]
- text: 🔍
- paragraph: Keyword
- heading "-" [level=2]
- textbox "Search survey..."
- button "Search"
- link "Reset":
  - /url: /survey
- table:
  - rowgroup:
    - row "No Survey Question Start End Status Action":
      - columnheader "No"
      - columnheader "Survey"
      - columnheader "Question"
      - columnheader "Start"
      - columnheader "End"
      - columnheader "Status"
      - columnheader "Action"
  - rowgroup:
    - row "1 Survey Playwright Faculty Survey 0 Question 23/6/2026 30/6/2026 🔴 Inactive 📋 🚀 ✏️ 🗑️":
      - cell "1"
      - cell "Survey Playwright Faculty Survey":
        - heading "Survey Playwright" [level=3]
        - text: Faculty Survey
      - cell "0 Question"
      - cell "23/6/2026"
      - cell "30/6/2026"
      - cell "🔴 Inactive"
      - cell "📋 🚀 ✏️ 🗑️":
        - link "📋":
          - /url: /question/survey/25
        - button "🚀"
        - link "✏️":
          - /url: /survey/edit/25
        - button "🗑️"
    - row "2 trhwth Faculty Survey 0 Question 25/6/2026 26/6/2026 🔴 Inactive 📋 🚀 ✏️ 🗑️":
      - cell "2"
      - cell "trhwth Faculty Survey":
        - heading "trhwth" [level=3]
        - text: Faculty Survey
      - cell "0 Question"
      - cell "25/6/2026"
      - cell "26/6/2026"
      - cell "🔴 Inactive"
      - cell "📋 🚀 ✏️ 🗑️":
        - link "📋":
          - /url: /question/survey/24
        - button "🚀"
        - link "✏️":
          - /url: /survey/edit/24
        - button "🗑️"
- text: Page
- strong: "1"
- text: of
- strong: "1"
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('Tombol Hapus Pertanyaan tampil', async ({ page }) => {
  4  | 
  5  |     await page.goto('http://localhost:3000/login');
  6  | 
  7  |     await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');
  8  |     await page.fill('input[name="password"]', 'hanif123');
  9  | 
  10 |     await page.click('button[type="submit"]');
  11 | 
  12 |     await page.goto('http://localhost:3000/question/survey/1');
  13 | 
  14 |     await expect(
  15 |         page.locator('button[title="Delete Question"]').first()
> 16 |     ).toBeVisible();
     |       ^ Error: expect(locator).toBeVisible() failed
  17 | 
  18 | });
```
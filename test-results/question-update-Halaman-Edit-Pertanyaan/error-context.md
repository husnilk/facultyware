# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: question-update.spec.js >> Halaman Edit Pertanyaan
- Location: testing\question-update.spec.js:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('a[title="Edit Question"]').first()

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - generic [ref=e7]:
      - img "Facultyware Logo" [ref=e8]
      - generic [ref=e9]:
        - heading "Facultyware" [level=2] [ref=e10]
        - text: Survey Management System
    - generic [ref=e11]:
      - link "🏠 Dashboard" [ref=e12] [cursor=pointer]:
        - /url: /home
      - link "📋 Survey" [ref=e13] [cursor=pointer]:
        - /url: /survey
      - link "❓ Question" [ref=e14] [cursor=pointer]:
        - /url: /question
      - link "🔗 Assignment" [ref=e15] [cursor=pointer]:
        - /url: /assignment
    - generic [ref=e16]:
      - generic [ref=e17]: Facultyware v2.0
      - link "🚪 Logout" [ref=e18] [cursor=pointer]:
        - /url: /logout
  - generic [ref=e19]:
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: Welcome Back, hanif 👋
        - paragraph [ref=e23]: Faculty Survey Management System
      - generic [ref=e24]:
        - generic [ref=e28]: System Online
        - generic [ref=e29]:
          - generic [ref=e30]: H
          - generic [ref=e31]:
            - strong [ref=e32]: hanif
            - text: Administrator
    - generic [ref=e33]:
      - generic [ref=e34]:
        - text: Survey Management
        - heading "Data Survey" [level=1] [ref=e35]
        - paragraph [ref=e36]: Create, manage and publish faculty surveys professionally.
      - generic [ref=e37]:
        - link "📄 Export PDF" [ref=e38] [cursor=pointer]:
          - /url: /survey/export/pdf
        - link "➕ New Survey" [ref=e39] [cursor=pointer]:
          - /url: /survey/create
    - generic [ref=e40]:
      - generic [ref=e41] [cursor=pointer]:
        - generic [ref=e42]: 📋
        - generic [ref=e43]:
          - paragraph [ref=e44]: Total Survey
          - heading "2" [level=2] [ref=e45]
      - generic [ref=e46] [cursor=pointer]:
        - generic [ref=e47]: 📄
        - generic [ref=e48]:
          - paragraph [ref=e49]: Current Page
          - heading "1" [level=2] [ref=e50]
      - generic [ref=e51] [cursor=pointer]:
        - generic [ref=e52]: 📚
        - generic [ref=e53]:
          - paragraph [ref=e54]: Total Page
          - heading "1" [level=2] [ref=e55]
      - generic [ref=e56] [cursor=pointer]:
        - generic [ref=e57]: 🔍
        - generic [ref=e58]:
          - paragraph [ref=e59]: Keyword
          - heading "-" [level=2] [ref=e60]
    - generic [ref=e62]:
      - textbox "Search survey..." [ref=e63]
      - button "Search" [ref=e64]
      - link "Reset" [ref=e65] [cursor=pointer]:
        - /url: /survey
    - table [ref=e67]:
      - rowgroup [ref=e68]:
        - row "No Survey Question Start End Status Action" [ref=e69]:
          - columnheader "No" [ref=e70]
          - columnheader "Survey" [ref=e71]
          - columnheader "Question" [ref=e72]
          - columnheader "Start" [ref=e73]
          - columnheader "End" [ref=e74]
          - columnheader "Status" [ref=e75]
          - columnheader "Action" [ref=e76]
      - rowgroup [ref=e77]:
        - row "1 Survey Playwright Faculty Survey 0 Question 23/6/2026 30/6/2026 🔴 Inactive 📋 🚀 ✏️ 🗑️" [ref=e78]:
          - cell "1" [ref=e79]
          - cell "Survey Playwright Faculty Survey" [ref=e80]:
            - generic [ref=e81]:
              - heading "Survey Playwright" [level=3] [ref=e82]
              - text: Faculty Survey
          - cell "0 Question" [ref=e83]
          - cell "23/6/2026" [ref=e84]
          - cell "30/6/2026" [ref=e85]
          - cell "🔴 Inactive" [ref=e86]:
            - generic [ref=e87]: 🔴 Inactive
          - cell "📋 🚀 ✏️ 🗑️" [ref=e88]:
            - generic [ref=e89]:
              - link "📋" [ref=e90] [cursor=pointer]:
                - /url: /question/survey/25
              - button "🚀" [ref=e92] [cursor=pointer]
              - link "✏️" [ref=e93] [cursor=pointer]:
                - /url: /survey/edit/25
              - button "🗑️" [ref=e95] [cursor=pointer]
        - row "2 trhwth Faculty Survey 0 Question 25/6/2026 26/6/2026 🔴 Inactive 📋 🚀 ✏️ 🗑️" [ref=e96]:
          - cell "2" [ref=e97]
          - cell "trhwth Faculty Survey" [ref=e98]:
            - generic [ref=e99]:
              - heading "trhwth" [level=3] [ref=e100]
              - text: Faculty Survey
          - cell "0 Question" [ref=e101]
          - cell "25/6/2026" [ref=e102]
          - cell "26/6/2026" [ref=e103]
          - cell "🔴 Inactive" [ref=e104]:
            - generic [ref=e105]: 🔴 Inactive
          - cell "📋 🚀 ✏️ 🗑️" [ref=e106]:
            - generic [ref=e107]:
              - link "📋" [ref=e108] [cursor=pointer]:
                - /url: /question/survey/24
              - button "🚀" [ref=e110] [cursor=pointer]
              - link "✏️" [ref=e111] [cursor=pointer]:
                - /url: /survey/edit/24
              - button "🗑️" [ref=e113] [cursor=pointer]
    - generic [ref=e115]:
      - text: Page
      - strong [ref=e116]: "1"
      - text: of
      - strong [ref=e117]: "1"
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('Halaman Edit Pertanyaan', async ({ page }) => {
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
> 14 |     await page.locator('a[title="Edit Question"]').first().click();
     |                                                            ^ Error: locator.click: Test timeout of 30000ms exceeded.
  15 | 
  16 |     await expect(page.locator('h1')).toContainText('Edit');
  17 | 
  18 | });
```
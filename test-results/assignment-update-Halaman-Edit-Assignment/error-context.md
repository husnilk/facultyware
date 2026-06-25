# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: assignment-update.spec.js >> Halaman Edit Assignment
- Location: testing\assignment-update.spec.js:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.action.edit').first()

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
        - text: Survey Assignment
        - heading "Assignment Management" [level=1] [ref=e35]
        - paragraph [ref=e36]: Connect surveys with their questions.
      - link "➕ New Assignment" [ref=e38] [cursor=pointer]:
        - /url: /assignment/create
    - generic [ref=e39]:
      - generic [ref=e40] [cursor=pointer]:
        - generic [ref=e41]: 🔗
        - generic [ref=e42]:
          - paragraph [ref=e43]: Total Assignment
          - heading "0" [level=2] [ref=e44]
      - generic [ref=e45] [cursor=pointer]:
        - generic [ref=e46]: 📄
        - generic [ref=e47]:
          - paragraph [ref=e48]: Current Page
          - heading "1" [level=2] [ref=e49]
      - generic [ref=e50] [cursor=pointer]:
        - generic [ref=e51]: 📚
        - generic [ref=e52]:
          - paragraph [ref=e53]: Total Page
          - heading "0" [level=2] [ref=e54]
      - generic [ref=e55] [cursor=pointer]:
        - generic [ref=e56]: 🔍
        - generic [ref=e57]:
          - paragraph [ref=e58]: Search
          - heading "-" [level=2] [ref=e59]
    - generic [ref=e61]:
      - textbox "Search survey or question..." [ref=e62]
      - button "Search" [ref=e63]
      - link "Reset" [ref=e64] [cursor=pointer]:
        - /url: /assignment
    - table [ref=e66]:
      - rowgroup [ref=e67]:
        - row "No Survey Question Order Action" [ref=e68]:
          - columnheader "No" [ref=e69]
          - columnheader "Survey" [ref=e70]
          - columnheader "Question" [ref=e71]
          - columnheader "Order" [ref=e72]
          - columnheader "Action" [ref=e73]
      - rowgroup [ref=e74]:
        - row "📭 No Assignment No assignment available." [ref=e75]:
          - cell "📭 No Assignment No assignment available." [ref=e76]:
            - generic [ref=e77]:
              - heading "📭 No Assignment" [level=2] [ref=e78]
              - paragraph [ref=e79]: No assignment available.
    - generic [ref=e81]: Page 1 of 0
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('Halaman Edit Assignment', async ({ page }) => {
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
> 14 |     await page.locator(".action.edit").first().click();
     |                                                ^ Error: locator.click: Test timeout of 30000ms exceeded.
  15 | 
  16 |     await expect(page.locator('body')).toContainText('Edit Assignment');
  17 | 
  18 | });
```
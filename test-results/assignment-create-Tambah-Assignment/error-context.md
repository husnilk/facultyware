# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: assignment-create.spec.js >> Tambah Assignment
- Location: testing\assignment-create.spec.js:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('select[name="survey_id"]')
    - locator resolved to <select required="" name="survey_id">…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
      - waiting 100ms
    54 × waiting for element to be visible and enabled
       - did not find some options
     - retrying select option action
       - waiting 500ms

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
        - heading "Create Assignment" [level=1] [ref=e35]
        - paragraph [ref=e36]: Assign a question into a survey.
      - link "← Back" [ref=e37] [cursor=pointer]:
        - /url: /assignment
    - generic [ref=e39]:
      - generic [ref=e40]:
        - generic [ref=e41]: Survey
        - combobox [ref=e42]:
          - option "trhwth" [selected]
      - generic [ref=e43]:
        - generic [ref=e44]: Question
        - combobox [ref=e45]:
          - option "Bagaimana fasilitas ruang kelas?" [selected]
          - option "Bagaimana keamanan lingkungan kampus?"
          - option "Bagaimana kebersihan lingkungan kampus?"
          - option "Bagaimana kedisiplinan dosen dalam mengajar?"
          - option "Bagaimana kualitas jaringan internet kampus?"
          - option "Bagaimana kualitas materi perkuliahan?"
          - option "Bagaimana kualitas pelayanan dosen?"
          - option "Bagaimana pelayanan administrasi akademik?"
          - option "Bagaimana pelayanan perpustakaan?"
          - option "Seberapa puas Anda terhadap layanan kampus secara keseluruhan?"
      - generic [ref=e46]:
        - generic [ref=e47]: Order
        - spinbutton [ref=e48]: "1"
      - button "💾 Save Assignment" [ref=e49]
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('Tambah Assignment', async ({ page }) => {
  4  | 
  5  |     await page.goto('http://localhost:3000/login');
  6  | 
  7  |     await page.fill('input[name="email"]','hanifalhaj@gmail.com');
  8  |     await page.fill('input[name="password"]','hanif123');
  9  | 
  10 |     await page.getByRole('button').click();
  11 | 
  12 |     await page.goto('http://localhost:3000/assignment/create');
  13 | 
> 14 |     await page.selectOption(
     |                ^ Error: page.selectOption: Test timeout of 30000ms exceeded.
  15 |         'select[name="survey_id"]',
  16 |         { index: 1 }
  17 |     );
  18 | 
  19 |     await page.selectOption(
  20 |         'select[name="survey_question_id"]',
  21 |         { index: 1 }
  22 |     );
  23 | 
  24 |     await page.fill(
  25 |         'input[name="order"]',
  26 |         '99'
  27 |     );
  28 | 
  29 |     await page.locator('button.hero-btn').click();
  30 | 
  31 |     await expect(page).toHaveURL(/assignment/);
  32 | 
  33 | });
```
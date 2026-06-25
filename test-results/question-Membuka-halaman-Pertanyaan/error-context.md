# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: question.spec.js >> Membuka halaman Pertanyaan
- Location: testing\question.spec.js:3:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Timeout: 5000ms
- Expected substring  - 1
+ Received string     + 3

- Question
+
+                     Data Survey
+                 

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')
    13 × locator resolved to <h1>↵                    Data Survey↵                </h1>
       - unexpected value "
                    Data Survey
                "

```

```yaml
- heading "Data Survey" [level=1]
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('Membuka halaman Pertanyaan', async ({ page }) => {
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
> 14 |     await expect(page.locator('h1')).toContainText('Question');
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  15 | 
  16 | });
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: question-create.spec.js >> Tambah Pertanyaan
- Location: testing\question-create.spec.js:3:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /question\/survey\/1/
Received string:  "http://localhost:3000/question/create/1"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × unexpected value "http://localhost:3000/question/create/1"

```

```yaml
- 'heading "Cannot add or update a child row: a foreign key constraint fails (`facultyware`.`survey_question_assignments`, CONSTRAINT `survey_question_assignments_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`))" [level=1]'
- heading [level=2]
- text: "Error: Cannot add or update a child row: a foreign key constraint fails (`facultyware`.`survey_question_assignments`, CONSTRAINT `survey_question_assignments_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`)) at store (D:\\information system\\PWEB\\a12 pweb backup\\facultyware\\controllers\\questionController.js:161:18) at process.processTicksAndRejections (node:internal/process/task_queues:104:5)"
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('Tambah Pertanyaan', async ({ page }) => {
  4  | 
  5  |     await page.goto('http://localhost:3000/login');
  6  | 
  7  |     await page.fill('input[name="email"]', 'hanifalhaj@gmail.com');
  8  |     await page.fill('input[name="password"]', 'hanif123');
  9  | 
  10 |     await page.click('button[type="submit"]');
  11 | 
  12 |     await page.goto('http://localhost:3000/question/create/1');
  13 | 
  14 |     await page.fill('textarea[name="question_text"]', 'Pertanyaan Playwright');
  15 | 
  16 |     await page.selectOption('select[name="type"]', 'text');
  17 | 
  18 |     await page.click('button[type="submit"]');
  19 | 
> 20 |     await expect(page).toHaveURL(/question\/survey\/1/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  21 | 
  22 | });
```
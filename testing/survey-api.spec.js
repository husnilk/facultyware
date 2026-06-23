const { test, expect } = require('@playwright/test');

test('REST API Survey', async ({ request }) => {

    const response = await request.get(
        'http://localhost:3000/api/surveys'
    );

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    expect(Array.isArray(data)).toBeTruthy();

});
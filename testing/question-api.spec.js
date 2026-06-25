const { test, expect } = require('@playwright/test');

test('REST API Question', async ({ request }) => {

    const response = await request.get(
        'http://localhost:3000/api/questions'
    );

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    expect(Array.isArray(data)).toBeTruthy();

});
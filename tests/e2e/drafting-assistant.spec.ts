import { test, expect } from '@playwright/test';

test.describe('Drafting Assistant E2E', () => {
  test('should load and allow inputting context', async ({ page }) => {
    await page.goto('/tools/drafting');

    // Check header
    await expect(page.locator('h1')).toContainText(/Drafting\s*Assistant/i);

    // Click Document Type dropdown
    const typeButton = page.locator('button').filter({ hasText: 'Select a template...' });
    await expect(typeButton).toBeVisible();
    await typeButton.click();

    // Select a template (e.g., Letter of Demand)
    await page.getByText('Letter of Demand').click();
    await expect(page.getByText('Letter of Demand').first()).toBeVisible();

    // Enter context
    const contextText = "Draft a letter of demand for R50,000 against John Doe for unpaid consulting services.";
    await page.locator('textarea').type(contextText);

    // Check Tone button
    const toneButton = page.getByRole('button', { name: /Formal/i });
    await expect(toneButton).toBeVisible();

    // Check Generate button
    const generateButton = page.getByRole('button', { name: /Execute AI Draft/i });
    await expect(generateButton).toBeVisible();
    
    // We won't click generate in the baseline unless we want to test the full flow, 
    // but the API might require a key or be mockable. 
    // Given the previous tests, they usually click the button.
  });
});

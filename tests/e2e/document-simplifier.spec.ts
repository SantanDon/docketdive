import { test, expect } from '@playwright/test';

test.describe('Document Simplifier E2E', () => {
  test('should load and perform simplification', async ({ page }) => {
    await page.goto('/tools/simplify');

    // Check header
    await expect(page.locator('h1')).toContainText(/DocumentSimplifier/i);

    // Paste sample text
    const sampleText = "THIS AGREEMENT is made on Jan 1, 2024. The Service Provider shall indemnify and hold harmless the Client from any and all claims, damages, or liabilities arising from the Service Provider's negligence.";
    await page.locator('textarea').type(sampleText);

    // Click Simplify
    const simplifyButton = page.getByRole('button', { name: /Execute Simplification/i });
    await simplifyButton.click();

    // Wait for results
    await expect(page.locator('text=Readability Improvement')).toBeVisible({ timeout: 90000 });
    
    // Check tabs
    await expect(page.getByRole('button', { name: /Summary/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Clauses/i })).toBeVisible();
    
    // Switch to Clauses tab
    await page.getByRole('button', { name: /Clauses/i }).click();
    await expect(page.locator('text=Clause Breakdown')).toBeVisible();
  });
});

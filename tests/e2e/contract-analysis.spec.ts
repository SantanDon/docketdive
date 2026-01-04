import { test, expect } from '@playwright/test';

test.describe('Contract Perspective Analyzer E2E', () => {
  test('should load and perform analysis', async ({ page }) => {
    await page.goto('/tools/contract-analysis');

    // Check header
    await expect(page.locator('h1')).toContainText(/Perspective Analyzer/i);

    // Check perspective buttons
    const partyAButton = page.getByRole('button', { name: /Party A/i });
    const partyBButton = page.getByRole('button', { name: /Party B/i });
    const neutralButton = page.getByRole('button', { name: /Neutral/i });

    await expect(partyAButton).toBeVisible();
    await expect(partyBButton).toBeVisible();
    await expect(neutralButton).toBeVisible();

    // Paste sample text
    const sampleText = "This is a sample contract between Party A and Party B. Party A shall provide services and Party B shall pay R1000.";
    await page.locator('textarea').type(sampleText);

    // Click Analyze
    const analyzeButton = page.getByRole('button', { name: /Execute Analysis/i });
    await analyzeButton.click();

    // Verify loading state (briefly)
    // await expect(page.locator('text=Synthesizing')).toBeVisible();

    // Wait for results
    await expect(page.locator('text=POV')).toBeVisible({ timeout: 30000 });
    
    // Check for risk indicator
    await expect(page.locator('text=/Risk/i').first()).toBeVisible();
    
    // Check for summary
    await expect(page.locator('text=Executive Summary')).toBeVisible();
  });
});

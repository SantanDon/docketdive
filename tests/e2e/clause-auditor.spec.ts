import { test, expect } from '@playwright/test';

test.describe('Clause Auditor E2E', () => {
    test('should load and allow auditing a contract', async ({ page }) => {
        await page.goto('/tools/audit');

        // Check header
        await expect(page.locator('h1')).toContainText(/Clause\s*Auditor/i);

        // Paste some text
        const sampleContract = `
        EMPLOYMENT AGREEMENT
        This agreement is made between John Doe and Acme Corp.
        The employee shall receive a monthly salary of R50,000.
        The notice period shall be 30 days.
        `;
        await page.fill('textarea[placeholder*="Paste the full contract text here..."]', sampleContract);

        // Click Audit button
        await page.click('button:has-text("Audit Contract")');

        // Wait for results (increase timeout for AI processing)
        await expect(page.locator('text=Contract Overview')).toBeVisible({ timeout: 60000 });
        
        // Detailed check of results mapping
        await expect(page.locator('text=/100')).toBeVisible();
        await expect(page.locator('text=Clause Analysis')).toBeVisible();
    });
});

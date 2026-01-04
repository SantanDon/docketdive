import { test, expect } from '@playwright/test';

test.describe('POPIA Checker E2E', () => {
    test('should load and allow checking POPIA compliance', async ({ page }) => {
        await page.goto('/tools/popia');

        // Check header (new UI uses h1)
        await expect(page.locator('h1')).toContainText(/POPIA/i);

        // Paste some text (mock privacy policy)
        const samplePolicy = `
        PRIVACY POLICY
        We collect your name and email address.
        We use this data to provide our services.
        We do not share your data with third parties without consent.
        You have the right to access your data.
        `;
        // Fill the textarea
        await page.locator('textarea').fill(samplePolicy);

        // Click Check button
        await page.click('button:has-text("Audit POPIA Compliance")');

        // Wait for results
        await expect(page.locator('text=Audit Summary')).toBeVisible({ timeout: 60000 });
        
        // Wait for score circle to appear
        await expect(page.locator('div').filter({ hasText: /%/ }).first()).toBeVisible();
        
        // Check for requirements list
        await expect(page.locator('text=Detailed POPIA Audit Points')).toBeVisible();
    });
});

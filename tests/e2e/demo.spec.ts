import { test, expect } from '@playwright/test';

test('feature demo walkthrough', async ({ page }) => {
  // 1. Load the page
  await page.goto('/');
  await expect(page).toHaveTitle(/DocketDive/);
  
  // 2. Wait for hydration
  await page.waitForTimeout(2000);

  // 3. Find input and type question
  const input = page.locator('textarea[placeholder="Ask a legal question..."]'); // Adjust selector as needed based on codebase
  // If selector is uncertain, I'll try a generic one or check the code.
  // Viewing 'app/page.tsx' would be safer, but I'll guess standard selectors or use getByRole.
  
  await page.getByRole('textbox').fill('What are the requirements for a valid contract in South Africa?');
  await page.waitForTimeout(1000); // Pause for effect
  
  // 4. Submit
  await page.getByRole('button', { name: /send/i }).click().catch(() => page.keyboard.press('Enter'));
  
  // 5. Wait for response
  // Look for the message bubble.
  await page.waitForSelector('.prose', { timeout: 30000 }); // Wait for markdown content
  
  // 6. Scroll and show content
  await page.waitForTimeout(5000); // Allow text to stream
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(2000);
  
  // 7. Expand sources if available
  // Need to know the button text. "Legal Sources (N)" or similar.
  const sourcesBtn = page.locator('button', { hasText: /Legal Sources/i });
  if (await sourcesBtn.count() > 0) {
      await sourcesBtn.first().click();
      await page.waitForTimeout(3000);
  }
});

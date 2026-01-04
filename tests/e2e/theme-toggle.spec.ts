import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test('should toggle between light and dark mode', async ({ page }) => {
    // If testing against production, update baseURL or pass it via env
    // For now, checking the selector logic
    await page.goto('/');

    // Check initial state (should be consistent with system or default)
    // We assume there's a button to toggle theme. 
    // Based on Header.tsx, it's in a dropdown or a direct button depending on screen size?
    // Header.tsx: DropdownMenuItem onClick={() => setTheme(...)}
    
    // Open user menu to find theme toggle if it's hidden, or if it's not mounted yet
    // The code showed:
    /* 
    <DropdownMenu>
       <DropdownMenuTrigger>...</DropdownMenuTrigger>
       <DropdownMenuContent>
          ...
          <DropdownMenuItem onClick={() => setTheme(...)}>
    */

    // We need to find the button that opens the dropdown
    // In Header.tsx, it's a ghost button containing a UserIcon
    const userMenuButton = page.locator('button:has(svg.h-4.w-4)').last(); // The UserIcon has h-4 w-4

    await userMenuButton.click();

    // Look for "Mode" or "Light Mode"/"Dark Mode"
    const themeToggle = page.getByRole('menuitem').filter({ hasText: /mode/i });
    await expect(themeToggle).toBeVisible();

    // Click it
    await themeToggle.click();

    // Check for "dark" class on html element
    const html = page.locator('html');
    
    // We expect the class attribute to change. 
    // Note: next-themes adds class="dark" to html or body.
    // Header.tsx uses `attribute="class"` in `ThemeProvider` which usually implies `class="dark"` on `html`.

    // Wait for a bit of transition
    await page.waitForTimeout(500);

    // Verify dark mode
    // Either 'dark' is present or not. 
    // We don't know the initial state for sure (system default), so we check change.
    const initialClass = await html.getAttribute('class');
    
    // Toggle again
    await userMenuButton.click();
    await themeToggle.click();
    await page.waitForTimeout(500);
    
    const newClass = await html.getAttribute('class');
    expect(newClass).not.toBe(initialClass);
  });
});

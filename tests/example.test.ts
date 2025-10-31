import { test, expect } from '@testsprite/testsprite';

test('should display the application title', async ({ page }) => {
  await page.goto('/'); // Go to the root of your application
  await expect(page.locator('h1:has-text("Branch")')).toBeVisible(); // Check if the "Branch" title is visible
});
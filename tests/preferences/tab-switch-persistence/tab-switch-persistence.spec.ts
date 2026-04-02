import { test, expect } from '../../../playwright';

test.describe('Preferences Tab Switch Persistence', () => {
  test('should persist General tab SSL setting when immediately switching tabs', async ({ page }) => {
    // Open preferences
    await page.locator('.preferences-button').click();
    const generalTab = page.getByRole('tab', { name: 'General' });
    await generalTab.waitFor({ state: 'visible' });

    // Navigate to General tab
    await generalTab.click();

    // Get the initial state of SSL verification checkbox
    const sslCheckbox = page.locator('#sslVerification');
    await sslCheckbox.waitFor({ state: 'visible' });
    const initialChecked = await sslCheckbox.isChecked();

    // Toggle the SSL verification checkbox
    await sslCheckbox.click();

    // Immediately switch to another tab (don't wait for debounce)
    await page.getByRole('tab', { name: 'Themes' }).click();

    // Switch back to General tab
    await generalTab.click();
    await sslCheckbox.waitFor({ state: 'visible' });

    // Verify the setting was persisted (should be opposite of initial state)
    const newChecked = await sslCheckbox.isChecked();
    expect(newChecked).toBe(!initialChecked);

    // Restore original state
    await sslCheckbox.click();
    await page.waitForTimeout(600); // debounce: preferences-save IPC
  });

  test('should persist Store Cookies setting when immediately switching tabs', async ({ page }) => {
    // Open preferences
    await page.locator('.preferences-button').click();
    const generalTab = page.getByRole('tab', { name: 'General' });
    await generalTab.waitFor({ state: 'visible' });

    // Navigate to General tab
    await generalTab.click();

    // Get the initial state of Store Cookies checkbox
    const storeCookiesCheckbox = page.locator('#storeCookies');
    await storeCookiesCheckbox.waitFor({ state: 'visible' });
    const initialChecked = await storeCookiesCheckbox.isChecked();

    // Toggle the checkbox
    await storeCookiesCheckbox.click();

    // Immediately switch to Themes tab (lighter than Proxy)
    await page.getByRole('tab', { name: 'Themes' }).click();

    // Switch back to General tab
    await generalTab.click();
    await storeCookiesCheckbox.waitFor({ state: 'visible' });

    // Verify the setting was persisted
    const newChecked = await storeCookiesCheckbox.isChecked();
    expect(newChecked).toBe(!initialChecked);

    // Restore original state
    await storeCookiesCheckbox.click();
    await page.waitForTimeout(600); // debounce: preferences-save IPC
  });

  test('should persist Cache settings when immediately switching tabs', async ({ page }) => {
    // Open preferences
    await page.locator('.preferences-button').click();
    const cacheTab = page.getByRole('tab', { name: 'Cache' });
    await cacheTab.waitFor({ state: 'visible' });

    // Navigate to Cache tab
    await cacheTab.click();

    // Get the initial state of SSL session caching checkbox
    const sslSessionCheckbox = page.locator('#sslSession\\.enabled');
    await sslSessionCheckbox.waitFor({ state: 'visible' });
    const initialChecked = await sslSessionCheckbox.isChecked();

    // Toggle the checkbox
    await sslSessionCheckbox.click();

    // Immediately switch to another tab
    await page.getByRole('tab', { name: 'Themes' }).click();

    // Switch back to Cache tab
    await cacheTab.click();
    await sslSessionCheckbox.waitFor({ state: 'visible' });

    // Verify the setting was persisted
    const newChecked = await sslSessionCheckbox.isChecked();
    expect(newChecked).toBe(!initialChecked);

    // Restore original state
    await sslSessionCheckbox.click();
    await page.waitForTimeout(600); // debounce: preferences-save IPC
  });

  test('should persist settings after closing and reopening preferences tab', async ({ page }) => {
    // Open preferences
    await page.locator('.preferences-button').click();
    const generalTab = page.getByRole('tab', { name: 'General' });
    await generalTab.waitFor({ state: 'visible' });

    // Navigate to General tab
    await generalTab.click();

    // Get the initial state of SSL verification checkbox
    const sslCheckbox = page.locator('#sslVerification');
    await sslCheckbox.waitFor({ state: 'visible' });
    const initialChecked = await sslCheckbox.isChecked();

    // Toggle the SSL verification checkbox
    await sslCheckbox.click();

    // Immediately close the preferences tab
    const preferencesTab = page.locator('.request-tab').filter({ hasText: 'Preferences' });
    await preferencesTab.hover();
    await preferencesTab.locator('.close-icon').click({ force: true });

    // Wait for preferences tab to close
    await preferencesTab.waitFor({ state: 'hidden' });

    // Reopen preferences
    await page.locator('.preferences-button').click();
    await generalTab.waitFor({ state: 'visible' });

    // Navigate to General tab
    await generalTab.click();
    await sslCheckbox.waitFor({ state: 'visible' });

    // Verify the setting was persisted
    const newChecked = await sslCheckbox.isChecked();
    expect(newChecked).toBe(!initialChecked);

    // Restore original state
    await sslCheckbox.click();
    await page.waitForTimeout(600); // debounce: preferences-save IPC
  });

  test('should persist Cache settings after closing and reopening preferences', async ({ page }) => {
    // Open preferences
    await page.locator('.preferences-button').click();
    const cacheTab = page.getByRole('tab', { name: 'Cache' });
    await cacheTab.waitFor({ state: 'visible' });

    // Navigate to Cache tab
    await cacheTab.click();

    // Get the initial state of SSL session caching checkbox
    const sslSessionCheckbox = page.locator('#sslSession\\.enabled');
    await sslSessionCheckbox.waitFor({ state: 'visible' });
    const initialCacheState = await sslSessionCheckbox.isChecked();

    // Toggle the checkbox
    await sslSessionCheckbox.click();

    // Close preferences tab immediately
    const preferencesTab = page.locator('.request-tab').filter({ hasText: 'Preferences' });
    await preferencesTab.hover();
    await preferencesTab.locator('.close-icon').click({ force: true });
    await preferencesTab.waitFor({ state: 'hidden' });

    // Wait for save to complete
    await expect(page.locator('.preferences-button')).toBeVisible();

    // Reopen preferences
    await page.locator('.preferences-button').click();
    await cacheTab.waitFor({ state: 'visible' });

    // Navigate to Cache tab
    await cacheTab.click();
    await sslSessionCheckbox.waitFor({ state: 'visible' });

    // Verify the setting was persisted
    expect(await sslSessionCheckbox.isChecked()).toBe(!initialCacheState);

    // Restore original state
    await sslSessionCheckbox.click();
    await page.waitForTimeout(600); // debounce: preferences-save IPC
  });
});

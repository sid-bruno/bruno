import { test, expect } from '../../../playwright';

const EXPECTED_PATH_SUFFIX = 'tests/preferences/default-collection-location';

test.describe('Default Location Feature', () => {
  test('Should hydrate the default location from preferences', async ({ pageWithUserData: page }) => {
    // open preferences tab
    await page.locator('.preferences-button').click();
    await expect(page.locator('.request-tab').filter({ hasText: 'Preferences' })).toBeVisible();

    // navigate to General tab
    await page.getByRole('tab', { name: 'General' }).click();

    // verify the default location is pre-filled with the expected path suffix
    const defaultLocationInput = page.locator('.default-location-input');
    const value = await defaultLocationInput.inputValue();
    expect(value.endsWith(EXPECTED_PATH_SUFFIX)).toBe(true);
  });

  test('Should save a valid default location', async ({ pageWithUserData: page }) => {
    // open preferences tab
    await page.locator('.preferences-button').click();
    await expect(page.locator('.request-tab').filter({ hasText: 'Preferences' })).toBeVisible();

    // navigate to General tab
    await page.getByRole('tab', { name: 'General' }).click();

    // get the current default location and compute a different valid path
    const defaultLocationInput = page.locator('.default-location-input');
    const currentValue = await defaultLocationInput.inputValue();
    // Use parent directory as alternate path (guaranteed to exist and differ)
    const alternateExistingPath = currentValue.split('/').slice(0, -1).join('/');

    // set a different default location (readonly input, remove readonly then fill)
    await defaultLocationInput.evaluate((el) => {
      const input = el;
      input.removeAttribute('readonly');
      input.readOnly = false;
    });
    await defaultLocationInput.fill(alternateExistingPath);

    await page.waitForTimeout(1000); // debounce: preferences-save IPC

    // close preferences tab
    const preferencesTab = page.locator('.request-tab').filter({ hasText: 'Preferences' });
    await preferencesTab.hover();
    await preferencesTab.getByTestId('request-tab-close-icon').click({ force: true });
    await expect(preferencesTab).not.toBeVisible({ timeout: 5000 });

    // reopen preferences and verify persistence
    await page.locator('.preferences-button').click();
    await expect(page.locator('.request-tab').filter({ hasText: 'Preferences' })).toBeVisible();
    await page.getByRole('tab', { name: 'General' }).click();

    const savedValue = await page.locator('.default-location-input').inputValue();
    expect(savedValue).toBe(alternateExistingPath);
  });

  test('Should use default location in Create Collection modal', async ({ pageWithUserData: page }) => {
    // test Create Collection modal
    await page.getByTestId('collections-header-add-menu').click();
    await page.locator('.tippy-box .dropdown-item').filter({ hasText: 'Create collection' }).click();

    // Wait for inline creator to appear, then click the cog button to open advanced modal
    const inlineCreator = page.locator('.inline-collection-creator');
    await inlineCreator.waitFor({ state: 'visible', timeout: 5000 });
    await inlineCreator.locator('.cog-btn').click();

    // Wait for modal to be visible
    await page.locator('.bruno-modal').waitFor({ state: 'visible' });

    // verify the default location is pre-filled
    // Scope to the modal to avoid conflict with preferences tab
    const collectionLocationInput = page.locator('.bruno-modal').getByLabel('Location', { exact: true });
    await expect(collectionLocationInput).toBeVisible();

    const inputValue = await collectionLocationInput.inputValue();
    expect(inputValue).toBeTruthy();

    // cancel the collection creation
    await page.locator('.bruno-modal').getByRole('button', { name: 'Cancel' }).click();
  });

  test('Should use default location in Clone Collection modal', async ({ pageWithUserData: page }) => {
    // open the clone collection modal
    const collection = page.locator('.collection-name').first();
    await collection.hover();
    await collection.locator('.collection-actions .icon').click();
    await page.locator('.dropdown-item').filter({ hasText: 'Clone' }).click();

    // Wait for modal to be visible
    await page.locator('.bruno-modal').waitFor({ state: 'visible' });

    // verify the default location is pre-filled
    // Scope to the modal to avoid conflict with preferences tab
    const cloneLocationInput = page.locator('.bruno-modal').getByLabel('Location', { exact: true });
    await expect(cloneLocationInput).toBeVisible();
    const cloneValue = await cloneLocationInput.inputValue();
    expect(cloneValue).toBeTruthy();

    // cancel the clone operation
    await page.locator('.bruno-modal').getByRole('button', { name: 'Cancel' }).click();
  });

  test('Should save empty default location', async ({ pageWithUserData: page }) => {
    // open preferences tab
    await page.locator('.preferences-button').click();
    await expect(page.locator('.request-tab').filter({ hasText: 'Preferences' })).toBeVisible();

    // navigate to General tab
    await page.getByRole('tab', { name: 'General' }).click();

    // clear the default location field (readonly input, remove readonly then clear)
    const defaultLocationInput = page.locator('.default-location-input');
    await defaultLocationInput.evaluate((el) => {
      const input = el;
      input.removeAttribute('readonly');
      input.readOnly = false;
    });
    await defaultLocationInput.clear();

    await page.waitForTimeout(1000); // debounce: preferences-save IPC
  });
});

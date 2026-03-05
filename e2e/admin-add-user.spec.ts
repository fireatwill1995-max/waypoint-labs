import { test, expect } from '@playwright/test'

// Admin flow: sign in as admin first (demo admin is admin@waypointlabs.com with password)
test.describe('Admin Add User modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in')
    // Expand admin form and sign in as admin
    await page.getByRole('button', { name: /admin\? sign in/i }).click()
    await page.getByRole('textbox', { name: /email/i }).fill('admin@waypointlabs.com')
    await page.getByLabel(/password/i).fill('WlAdmin2024!')
    await page.getByRole('button', { name: /sign in as admin/i }).click()
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
    // Enter admin code (WL-ADMIN-2024)
    await expect(page.getByPlaceholder(/enter admin code/i)).toBeVisible({ timeout: 5000 })
    await page.getByPlaceholder(/enter admin code/i).fill('WL-ADMIN-2024')
    await page.locator('form').filter({ has: page.getByPlaceholder(/enter admin code/i) }).getByRole('button', { name: /continue/i }).click()
    await expect(page.getByRole('tab', { name: /users/i })).toBeVisible({ timeout: 8000 })
    await page.getByRole('tab', { name: /users/i }).click()
  })

  test('Add User button opens modal with demo explanation', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add user/i })).toBeVisible()
    await page.getByRole('button', { name: /add user/i }).click()
    await expect(page.getByRole('heading', { name: /add user/i })).toBeVisible()
    await expect(page.getByText(/demo/i)).toBeVisible()
    const dialog = page.getByRole('dialog')
    const closeBtn = dialog.getByRole('button', { name: 'Close' }).last()
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()
  })
})

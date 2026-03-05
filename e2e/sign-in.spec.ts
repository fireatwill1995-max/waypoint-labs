import { test, expect } from '@playwright/test'

test.describe('Sign In', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in')
  })

  test('shows Waypoint Labs and sign in button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /waypoint labs/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  })

  test('demo sign in redirects to civilian dashboard', async ({ page }) => {
    await page.getByRole('button', { name: /^sign in$/i }).first().click()
    await expect(page).toHaveURL(/\/civilian/, { timeout: 10000 })
  })

  test('has link to create account', async ({ page }) => {
    await expect(page.getByRole('link', { name: /create account/i })).toBeVisible()
    await page.getByRole('link', { name: /create account/i }).click()
    await expect(page).toHaveURL(/\/sign-up/)
  })
})

import { test, expect } from '@playwright/test'

test.describe('Sign Up', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up')
  })

  test('shows create account form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible()
  })

  test('validates empty email', async ({ page }) => {
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByText(/please enter your email/i)).toBeVisible()
  })

  test('validates invalid email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('not-an-email')
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByText(/valid email/i)).toBeVisible()
  })

  test('submit redirects to sign-in', async ({ page }) => {
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByText(/redirecting to sign in/i)).toBeVisible({ timeout: 3000 })
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 8000 })
  })

  test('has link to sign in', async ({ page }) => {
    await expect(page.getByRole('link', { name: /already have an account/i })).toBeVisible()
    await page.getByRole('link', { name: /already have an account/i }).click()
    await expect(page).toHaveURL(/\/sign-in/)
  })
})

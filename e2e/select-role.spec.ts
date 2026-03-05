import { test, expect } from '@playwright/test'

test.describe('Select Role', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/select-role')
  })

  test('shows four role cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /select your role/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /select civilian/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /select military/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /select admin/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /select pilot/i })).toBeVisible()
  })

  test('Military: select then see Command Center and CTA to dashboard', async ({ page }) => {
    await page.getByRole('button', { name: /select military/i }).click()
    await expect(page).toHaveURL(/\/military/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: /command center/i })).toBeVisible()
    const dashboardLink = page.getByRole('link', { name: /open unified operations dashboard/i })
    await expect(dashboardLink).toBeVisible()
    await dashboardLink.click()
    await expect(page).toHaveURL(/\/civilian/, { timeout: 15000 })
  })

  test('Pilot: select then see Pilot page and CTA to dashboard', async ({ page }) => {
    await page.getByRole('button', { name: /select pilot/i }).click()
    await expect(page).toHaveURL(/\/pilot/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: /^pilot$/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /open dashboard/i })).toBeVisible()
    await page.getByRole('link', { name: /open dashboard/i }).click()
    await expect(page).toHaveURL(/\/civilian/)
  })

  test('Civilian: select then lands on civilian dashboard', async ({ page }) => {
    await page.getByRole('button', { name: /select civilian/i }).click()
    await expect(page).toHaveURL(/\/civilian/, { timeout: 15000 })
  })

  test('Admin: select then lands on admin or sign-in', async ({ page }) => {
    await page.getByRole('button', { name: /select admin/i }).click()
    await expect(page).toHaveURL(/\/(admin|sign-in)/, { timeout: 15000 })
  })
})

import { expect, test } from '@playwright/test'

test('aplikasi terbuka dan menu tampil saat offline (mode pesawat)', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByTestId('menu-count')).toContainText('59 item')

  // Tunggu service worker aktif dan aset ter-precache.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload() // setelah reload halaman dikendalikan SW
  await expect(page.getByTestId('menu-count')).toContainText('59 item')

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('Offline', { exact: true })).toBeVisible()
  await expect(page.getByTestId('menu-count')).toContainText('59 item')
})

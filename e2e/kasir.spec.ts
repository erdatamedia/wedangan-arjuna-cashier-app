import { expect, test, type Page } from '@playwright/test'

async function goOffline(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload() // setelah reload halaman dikendalikan service worker
  await page.context().setOffline(true)
  await page.reload()
  await expect(page.getByTestId('online-status')).toHaveText(/Offline/)
}

test('alur kasir penuh saat offline: jual, bayar tunai, riwayat, void, tetap ada setelah reload', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByTestId('product-NSI-01')).toBeVisible()
  await goOffline(page)
  await expect(page.getByText('Transaksi tetap tersimpan di HP')).toBeVisible()

  // 2 × Nasi Goreng Arjuna (10.000) + 1 × Es Teh Manis (5.000)
  await page.getByTestId('product-NSI-01').click()
  await page.getByTestId('product-NSI-01').click()
  await page.getByTestId('product-ESG-01').click()
  // Indomie wajib pilih varian
  await page.getByTestId('product-MIE-01').click()
  const sheet = page.getByRole('dialog', { name: /Indomie/ })
  await expect(sheet.getByRole('button', { name: 'Pilih varian dulu' })).toBeDisabled()
  await sheet.getByRole('button', { name: 'Kuah' }).click()
  await sheet.getByRole('button', { name: /^Tambah ·/ }).click()

  await expect(page.getByTestId('cart-bar')).toContainText('4 item')
  await expect(page.getByTestId('cart-bar')).toContainText('Rp 32.000')

  await page.getByTestId('cart-bar').click()
  await page.getByRole('button', { name: 'Bayar', exact: true }).click()
  await expect(page.getByTestId('pay-total')).toHaveText('Rp 32.000')

  // Uang kurang: tombol nonaktif
  await expect(page.getByRole('button', { name: 'Selesaikan' })).toBeDisabled()
  await page.getByRole('button', { name: '50.000', exact: true }).click()
  await expect(page.getByTestId('change')).toHaveText('Kembali Rp 18.000')
  await page.getByRole('button', { name: 'Selesaikan' }).click()

  await expect(page.getByTestId('success-change')).toHaveText('Rp 18.000')
  const receipt = page.getByTestId('receipt')
  await expect(receipt).toContainText(/ARJ-\d{6}-001/)
  await expect(receipt).toContainText('Indomie (Kuah)')
  await expect(receipt).toContainText('Kembali')

  // "HP dimatikan paksa": muat ulang, transaksi harus masih ada
  await page.reload()
  const nav = page.getByRole('navigation')
  await nav.getByRole('button', { name: 'Riwayat' }).click()
  await expect(page.getByTestId('summary-revenue')).toHaveText('Rp 32.000')
  await expect(page.getByTestId('summary-count')).toHaveText('1')

  // Void dengan alasan
  await page.getByRole('button', { name: /ARJ-\d{6}-001/ }).click()
  await page.getByRole('button', { name: 'Batalkan transaksi' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Batalkan', exact: true }).click()
  await expect(page.getByText('Dibatalkan. Alasan: Salah input')).toBeVisible()
  await expect(page.getByTestId('receipt')).toContainText('*** DIBATALKAN ***')
  await page.getByRole('button', { name: '← Riwayat' }).click()
  await expect(page.getByTestId('summary-revenue')).toHaveText('Rp 0')
  await expect(page.getByTestId('summary-count')).toHaveText('0')
})

test('layar 360×640 tetap nyaman: tidak ada scroll horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/')
  await expect(page.getByTestId('product-NSI-01')).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

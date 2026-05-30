import { test, expect } from '@playwright/test';

test.describe('Payments Full-Stack E2E - Alta', () => {

  test('debe emitir un comprobante de pago pendiente', async ({ page }) => {
    const uniqueAmount = `1845${Date.now().toString().slice(-3)}`; 
    await page.goto('http://localhost:5173/payments');
    await page.getByRole('button', { name: 'Generar Pago' }).click();
    await page.getByText('Busque y seleccione un socio').click();
    await page.getByRole('option').first().click();
    await page.getByPlaceholder('Ej. 15000').fill(uniqueAmount);
    await page.getByRole('combobox', { name: 'Mes de Referencia' }).click();
    await page.getByRole('option', { name: 'Mes 6' }).click();
    await page.getByPlaceholder('Ej. 2026').fill('2026');
    await page.locator('input[type="date"]').fill('2026-06-10');
    await page.getByRole('button', { name: 'Emitir Comprobante' }).click();
    const paymentRow = page.getByRole('row').filter({ hasText: uniqueAmount });
    await expect(paymentRow).toBeVisible({ timeout: 10000 });
    await expect(paymentRow.getByText('Pendiente')).toBeVisible();
  });

});

test.describe('Payments Full-Stack E2E - Actualización', () => {

  test('debe registrar el cobro efectivo de un pago existente', async ({ page }) => {
    const uniqueAmount = `1999${Date.now().toString().slice(-3)}`;
    await page.goto('http://localhost:5173/payments');
    await page.getByRole('button', { name: 'Generar Pago' }).click();
    await page.getByText('Busque y seleccione un socio').click();
    await page.getByRole('option').first().click();
    await page.getByPlaceholder('Ej. 15000').fill(uniqueAmount);
    await page.getByRole('combobox', { name: 'Mes de Referencia' }).click();
    await page.getByRole('option', { name: 'Mes 6' }).click();
    await page.getByPlaceholder('Ej. 2026').fill('2026');
    await page.locator('input[type="date"]').fill('2026-06-10');
    await page.getByRole('button', { name: 'Emitir Comprobante' }).click();
    const paymentRow = page.getByRole('row').filter({ hasText: uniqueAmount });
    await expect(paymentRow).toBeVisible();

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await paymentRow.getByRole('button', { name: 'Registrar Cobro' }).click();
    await expect(paymentRow.getByText('Pagado')).toBeVisible({ timeout: 10000 });
    await expect(paymentRow.getByText('Sin acciones')).toBeVisible();
  });

});
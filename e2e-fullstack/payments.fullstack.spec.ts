import { test, expect } from '@playwright/test';

test.describe('Payments Full-Stack E2E - Alta', () => {

  test('debe emitir un comprobante de pago pendiente y luego registrar el cobro efectivo', async ({ page }) => {
    await page.goto('http://localhost:5173/payments');
    await expect(page.getByRole('heading', { name: 'Tesorería y Control de Pagos' })).toBeVisible();
    await page.getByRole('button', { name: 'Generar Pago' }).click();
    await expect(page.getByText('Registrar Nueva Cuota / Deuda')).toBeVisible();
    await page.getByText('Busque y seleccione un socio').click();
    await page.getByRole('option').first().click();
    await page.getByPlaceholder('Ej. 15000').fill('18450');
    await page.getByRole('combobox', { name: 'Mes de Referencia' }).click();
    await page.getByRole('option', { name: 'Mes 6' }).click();
    await page.getByPlaceholder('Ej. 2026').fill('2026');
    await page.locator('input[type="date"]').fill('2026-06-10');
    await page.getByRole('button', { name: 'Emitir Comprobante' }).click();

    await expect(page.getByText('Registrar Nueva Cuota / Deuda')).toBeHidden();

    const paymentRow = page.getByRole('row').filter({ hasText: '$18450' });
    await expect(paymentRow).toBeVisible({ timeout: 10000 });
    await expect(paymentRow.getByText('Pendiente')).toBeVisible();
    await expect(paymentRow.getByText('6/2026')).toBeVisible();

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('¿Confirmas que el socio realizó el pago efectivo de esta cuota?');
      await dialog.accept();
    });

    await paymentRow.getByRole('button', { name: 'Registrar Cobro' }).click();

    await expect(paymentRow.getByText('Pagado')).toBeVisible({ timeout: 10000 });
    
    await expect(paymentRow.getByText('Sin acciones')).toBeVisible();
  });

});
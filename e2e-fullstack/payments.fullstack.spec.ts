import { test, expect } from '@playwright/test';

let uniqueMemberName = '';

test.beforeEach(async ({ page }) => {
  uniqueMemberName = `Socio Pagos ${Date.now()}`;
  await page.goto('/members');
  await page.locator('button:has-text("Agregar Miembro")').click();
  await page.getByPlaceholder('Ej. Juan Pérez').fill(uniqueMemberName);
  await page.getByPlaceholder('Ej. 12345678').fill(Math.floor(Math.random() * 89999999 + 10000000).toString());
  await page.getByPlaceholder('ejemplo@correo.com').fill(`pago.${Date.now()}@test.com`);
  await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-01');
  await page.getByRole('button', { name: 'Crear Miembro' }).click();
  await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();
});

test.afterEach(async ({ page }) => {
  await page.goto('/members');
  const memberRow = page.getByRole('row', { name: uniqueMemberName });
  await expect(memberRow).toBeVisible({ timeout: 10000 });
  page.removeAllListeners('dialog');
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  
  await memberRow.getByRole('button', { name: /Eliminar miembro/i }).click();
  try {
    await expect(memberRow).toBeHidden({ timeout: 3000 });
  } catch (e) {
    console.log('No se pudo borrar el miembro físico (probablemente por reglas de FK de pagos).');
  }
});

test.describe('Payments Full-Stack E2E - Alta', () => {

  test('debe emitir un comprobante de pago pendiente', async ({ page }) => {
    const uniqueAmount = `1845${Date.now().toString().slice(-3)}`;
    await page.goto('/payments');
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
    await page.goto('/payments');
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

test.describe('Payments Full-Stack E2E - Cancelación', () => {

  test('debe anular un pago pendiente correctamente', async ({ page }) => {
    const uniqueAmount = `3333${Date.now().toString().slice(-3)}`;
    await page.goto('/payments');
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
    await paymentRow.getByRole('button', { name: 'Anular Comprobante' }).click();
    await expect(paymentRow.getByText('Anulado')).toBeVisible({ timeout: 10000 });
    await expect(paymentRow.getByText('Sin acciones')).toBeVisible();
  });

});
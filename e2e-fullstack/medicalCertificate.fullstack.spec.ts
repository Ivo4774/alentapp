import { test, expect } from '@playwright/test';

test.describe('Medical Certificates Full-Stack E2E - Alta', () => {

  test('debe cargar un certificado médico real y mostrarlo validado en el listado', async ({ page }) => {
    const uniqueSuffix = Date.now().toString();
    const uniqueMemberName = `Socio E2E Certificados ${uniqueSuffix}`;
    const uniqueDni = Math.floor(Math.random() * 89999999 + 10000000).toString();
    const uniqueLicense = Math.floor(Math.random() * 899999 + 100000).toString();

    await page.goto('http://localhost:5173/members');
    await page.locator('button:has-text("Agregar Miembro")').click();
    await page.getByPlaceholder('Ej. Juan Pérez').fill(uniqueMemberName);
    await page.getByPlaceholder('Ej. 12345678').fill(uniqueDni);
    await page.getByPlaceholder('ejemplo@correo.com').fill(`e2e.${uniqueSuffix}@test.com`);
    await page.getByLabel(/Fecha de Nacimiento/i).fill('1995-06-15');
    await page.getByRole('button', { name: 'Crear Miembro' }).click();
    await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();
    await expect(page.getByText(uniqueMemberName)).toBeVisible({ timeout: 10000 });

    await page.goto('http://localhost:5173/medical-certificates');
    await page.getByRole('button', { name: /Cargar Certificado/i }).click();
    await expect(page.getByText('Registrar Certificado Médico')).toBeVisible();
    await page.getByRole('combobox', { name: /Seleccionar Socio/i }).click();
    await page.getByRole('option', { name: new RegExp(uniqueMemberName, 'i') }).click();
    await page.getByPlaceholder('Ej. MN 123456').fill(uniqueLicense);
    await page.getByLabel(/Fecha de Emisión/i).fill('2026-05-01');
    await page.getByLabel(/Fecha de Vencimiento/i).fill('2026-12-31');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'comprobante_aptitud_e2e.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
    });
    await page.getByRole('button', { name: 'Guardar Certificado' }).click();
    await expect(page.getByRole('button', { name: 'Guardar Certificado' })).toBeHidden();
    const newRow = page.getByRole('row', { name: uniqueMemberName });
    await expect(newRow).toBeVisible({ timeout: 10000 });
    await expect(newRow.getByText('2026-05-01')).toBeVisible();
    await expect(newRow.getByText('2026-12-31')).toBeVisible();
    await expect(newRow.getByText(uniqueLicense)).toBeVisible();
    await expect(newRow.getByText(/Validado/i)).toBeVisible();
  });

});
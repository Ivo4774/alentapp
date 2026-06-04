import { test, expect } from '@playwright/test';

let uniqueMemberName = '';

test.beforeEach(async ({ page }) => {
  uniqueMemberName = `Socio Certificados ${Date.now()}`;
  await page.goto('/members');
  await page.locator('button:has-text("Agregar Miembro")').click();
  await page.getByPlaceholder('Ej. Juan Pérez').fill(uniqueMemberName);
  await page.getByPlaceholder('Ej. 12345678').fill(Math.floor(Math.random() * 89999999 + 10000000).toString());
  await page.getByPlaceholder('ejemplo@correo.com').fill(`cert.${Date.now()}@test.com`);
  await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-01');
  await page.getByRole('button', { name: 'Crear Miembro' }).click();
  await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();
});


//  independencia

test.afterEach(async ({ page }) => {
  await page.goto('/medical-certificates');
  const certRow = page.getByRole('row', { name: uniqueMemberName });
  
  try {

    await expect(certRow).toBeVisible({ timeout: 2000 });
    
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await certRow.getByRole('button', { name: /Eliminar Certificado/i }).click();
    await expect(certRow).toBeHidden({ timeout: 3000 });
  } catch (e) {
  }


  await page.goto('/members');
  const memberRow = page.getByRole('row', { name: uniqueMemberName });
  await expect(memberRow).toBeVisible({ timeout: 10000 });

  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  
  await memberRow.getByRole('button', { name: /Eliminar miembro/i }).click();
  await expect(memberRow).toBeHidden({ timeout: 5000 });
});

// =========================================================================
// Medical Certificates  - Alta
// =========================================================================
test.describe('Medical Certificates Full-Stack E2E - Alta', () => {

  test('debe cargar un certificado médico real y mostrarlo validado en el listado', async ({ page }) => {
    const originalLicense = Math.floor(Math.random() * 499999 + 100000).toString();
    await page.goto('/medical-certificates');
    await page.getByRole('button', { name: /Cargar Certificado/i }).click();
    await page.getByRole('combobox', { name: /Seleccionar Socio/i }).click();
    await page.getByRole('option', { name: new RegExp(uniqueMemberName, 'i') }).click();

    await page.getByPlaceholder('Ej. MN 123456').fill(originalLicense);
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
    await expect(newRow.getByText(originalLicense)).toBeVisible();
  });

});

// =========================================================================
// Medical Certificates - Actualización
// =========================================================================
test.describe('Medical Certificates Full-Stack E2E - Actualización', () => {

  test('debe permitir editar la matrícula del profesional del certificado creado y ver el cambio en la tabla', async ({ page }) => {
    const originalLicense = Math.floor(Math.random() * 499999 + 100000).toString();
    const updatedLicense = Math.floor(Math.random() * 500000 + 500000).toString();

    await page.goto('/medical-certificates');
    await page.getByRole('button', { name: /Cargar Certificado/i }).click();
    await page.getByRole('combobox', { name: /Seleccionar Socio/i }).click();
    await page.getByRole('option', { name: new RegExp(uniqueMemberName, 'i') }).click();
    await page.getByPlaceholder('Ej. MN 123456').fill(originalLicense);
    await page.getByLabel(/Fecha de Emisión/i).fill('2026-05-01');
    await page.getByLabel(/Fecha de Vencimiento/i).fill('2026-12-31');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'comprobante_aptitud_e2e.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
    });
    await page.getByRole('button', { name: 'Guardar Certificado' }).click();
    await expect(page.getByRole('button', { name: 'Guardar Certificado' })).toBeHidden();

    const targetRow = page.getByRole('row', { name: uniqueMemberName });
    await expect(targetRow).toBeVisible({ timeout: 10000 });

    await targetRow.getByRole('button', { name: /Editar Certificado/i }).click();
    await expect(page.getByText('Editar Certificado Médico')).toBeVisible();

    await page.getByPlaceholder('Ej. MN 123456').fill(updatedLicense);

    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeHidden();

    await expect(targetRow.getByText(updatedLicense)).toBeVisible({ timeout: 10000 });
    await expect(targetRow.getByText(originalLicense)).toBeHidden();
  });

});

// =========================================================================
// Medical Certificates - Eliminación
// =========================================================================
test.describe('Medical Certificates Full-Stack E2E - Eliminación', () => {

  test('debe eliminar físicamente el certificado médico tras confirmar la acción y removerlo de la tabla', async ({ page }) => {
    const originalLicense = Math.floor(Math.random() * 499999 + 100000).toString();

    await page.goto('/medical-certificates');
    await page.getByRole('button', { name: /Cargar Certificado/i }).click();
    await page.getByRole('combobox', { name: /Seleccionar Socio/i }).click();
    await page.getByRole('option', { name: new RegExp(uniqueMemberName, 'i') }).click();
    await page.getByPlaceholder('Ej. MN 123456').fill(originalLicense);
    await page.getByLabel(/Fecha de Emisión/i).fill('2026-05-01');
    await page.getByLabel(/Fecha de Vencimiento/i).fill('2026-12-31');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'comprobante_aptitud_e2e.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
    });
    await page.getByRole('button', { name: 'Guardar Certificado' }).click();
    await expect(page.getByRole('button', { name: 'Guardar Certificado' })).toBeHidden();

    const targetRow = page.getByRole('row', { name: uniqueMemberName });
    await expect(targetRow).toBeVisible({ timeout: 10000 });

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('¿Estás seguro de que deseas eliminar el certificado');
      await dialog.accept();
    });

    await targetRow.getByRole('button', { name: /Eliminar Certificado/i }).click();

    await expect(targetRow).toBeHidden({ timeout: 10000 });
  });

});
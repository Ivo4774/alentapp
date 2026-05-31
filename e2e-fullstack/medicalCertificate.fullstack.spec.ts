import { test, expect } from '@playwright/test';

// Forzamos el modo serial para que corran en orden en el mismo worker,
test.describe.configure({ mode: 'serial' });

test.describe('Medical Certificates Full-Stack E2E - Suite Completa', () => {
  const uniqueSuffix = Date.now().toString();
  const uniqueMemberName = `Socio E2E Modif ${uniqueSuffix}`;
  const uniqueDni = Math.floor(Math.random() * 89999999 + 10000000).toString();
  
  // Matrículas dinámicas para evitar colisiones reales en BD
  const originalLicense = Math.floor(Math.random() * 499999 + 100000).toString();
  const updatedLicense = Math.floor(Math.random() * 500000 + 500000).toString();

  // =========================================================================
  // SCENARIO 1: ALTA / CREACIÓN (Mantenemos tu flujo feliz en verde)
  // =========================================================================
  test('1. Debe cargar un certificado médico real y mostrarlo validado en el listado', async ({ page }) => {
    // Creación del socio requisito
    await page.goto('http://localhost:5173/members');
    await page.locator('button:has-text("Agregar Miembro")').click();
    await page.getByPlaceholder('Ej. Juan Pérez').fill(uniqueMemberName);
    await page.getByPlaceholder('Ej. 12345678').fill(uniqueDni);
    await page.getByPlaceholder('ejemplo@correo.com').fill(`e2e.${uniqueSuffix}@test.com`);
    await page.getByLabel(/Fecha de Nacimiento/i).fill('1995-06-15');
    await page.getByRole('button', { name: 'Crear Miembro' }).click();
    await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();

    // Alta del certificado
    await page.goto('http://localhost:5173/medical-certificates');
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

  // =========================================================================
  // SCENARIO 2: MODIFICACIÓN / EDICIÓN (requerimiento de la Rama 2)
  // =========================================================================
  test('2. Debe permitir editar la matrícula del profesional del certificado creado y ver el cambio en la tabla', async ({ page }) => {
    await page.goto('http://localhost:5173/medical-certificates');


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
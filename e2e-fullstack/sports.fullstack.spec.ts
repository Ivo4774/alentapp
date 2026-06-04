import { test, expect } from '@playwright/test';

let uniqueName = '';

test.afterEach(async ({ page }) => {
  if (uniqueName) {
    await page.goto('/sports');
    const row = page.getByRole('row', { name: uniqueName });
    // Solo eliminamos si la fila todavía existe (ej: el test de eliminación ya la borró)
    if (await row.isVisible({ timeout: 2000 }).catch(() => false)) {
      page.removeAllListeners('dialog');
      page.once('dialog', async (dialog) => {
        await dialog.accept();
      });
      await row.getByRole('button', { name: 'Eliminar' }).click();
      await expect(row).toBeHidden({ timeout: 5000 }).catch(() => {});
    }
    uniqueName = ''; // Resetear para el siguiente test
  }
});

test.describe('Sports Full-Stack E2E - Alta', () => {

  test('debe crear una disciplina real y mostrarla en la tabla', async ({ page }) => {
    uniqueName = `Boxeo E2E ${Date.now()}`;
    await page.goto('/sports');

    await page.locator('button:has-text("Nuevo Deporte")').click();
    await expect(page.getByText('Agregar Nuevo Deporte')).toBeVisible();

    await page.getByPlaceholder('Ej. Natación').fill(uniqueName);
    await page.getByPlaceholder('Breve detalle de la actividad').fill('Entrenamiento competitivo');
    await page.getByPlaceholder('Ej. 20').fill('15');
    
    await page.getByPlaceholder('0 si está incluido en la cuota').fill('500');
    
    await page.getByRole('combobox', { name: /Certificado Médico/i }).click();
    await page.getByRole('option', { name: 'Sí, requiere apto' }).click();

    await page.getByRole('button', { name: 'Crear Deporte' }).click();

    await expect(page.getByRole('button', { name: 'Crear Deporte' })).toBeHidden();
    const newRow = page.getByRole('row', { name: uniqueName });
    await expect(newRow).toBeVisible({ timeout: 10000 });
    await expect(newRow.getByText('Entrenamiento competitivo')).toBeVisible();
    await expect(newRow.getByText('15', { exact: true })).toBeVisible();
    await expect(newRow.getByText('$500')).toBeVisible();
    await expect(newRow.getByText('Requerido')).toBeVisible();
  });

});

test.describe('Sports Full-Stack E2E - Edición', () => {

  test('debe editar un deporte existente y ver el cambio en la tabla', async ({ page }) => {
    // Generar un nombre único para aislar el test de otros runs
    uniqueName = `Tenis E2E ${Date.now()}`;
    await page.goto('/sports');

    // 1. Crear el deporte primero para asegurarnos de que exista
    await page.locator('button:has-text("Nuevo Deporte")').click();
    await page.getByPlaceholder('Ej. Natación').fill(uniqueName);
    await page.getByPlaceholder('Breve detalle de la actividad').fill('Para editar');
    await page.getByPlaceholder('Ej. 20').fill('10');
    await page.getByRole('button', { name: 'Crear Deporte' }).click();

    // Encontrar la fila recién creada
    const newRow = page.getByRole('row', { name: uniqueName });
    await expect(newRow).toBeVisible({ timeout: 10000 });

    // 2. Editar el deporte
    await newRow.getByRole('button', { name: 'Editar' }).click();
    await expect(page.getByText('Editar Disciplina')).toBeVisible();

    // El nombre debería estar deshabilitado, validamos eso
    await expect(page.getByPlaceholder('Ej. Natación')).toBeDisabled();

    // Modificar cupo y descripción
    await page.getByPlaceholder('Breve detalle de la actividad').fill('Editado OK');
    await page.getByPlaceholder('Ej. 20').fill('30');
    
    // Guardar cambios
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeHidden();

    // 3. Verificar en la tabla
    await expect(newRow.getByText('Editado OK')).toBeVisible({ timeout: 10000 });
    await expect(newRow.getByText('30', { exact: true })).toBeVisible();
  });

});

test.describe('Sports Full-Stack E2E - Eliminación', () => {

  test('debe poder eliminar un deporte tras aceptar la alerta de confirmación', async ({ page }) => {
    uniqueName = `Rugby E2E ${Date.now()}`;
    await page.goto('/sports');

    // 1. Crear el deporte
    await page.locator('button:has-text("Nuevo Deporte")').click();
    await page.getByPlaceholder('Ej. Natación').fill(uniqueName);
    await page.getByPlaceholder('Breve detalle de la actividad').fill('Para eliminar');
    await page.getByPlaceholder('Ej. 20').fill('15');
    await page.getByRole('button', { name: 'Crear Deporte' }).click();

    const newRow = page.getByRole('row', { name: uniqueName });
    await expect(newRow).toBeVisible({ timeout: 10000 });

    // 2. Preparar interceptor del dialog (alerta)
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain(`¿Estás seguro de que deseas eliminar la disciplina "${uniqueName}"?`);
      await dialog.accept();
    });

    // 3. Clic en eliminar (tachito rojo)
    await newRow.getByRole('button', { name: 'Eliminar' }).click();

    // 4. Verificar que la fila desapareció de la tabla
    await expect(newRow).toBeHidden({ timeout: 10000 });
  });

});

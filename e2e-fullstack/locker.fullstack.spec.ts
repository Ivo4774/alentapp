import { test, expect } from '@playwright/test';

test.describe('Locker Full-Stack E2E - Aislamiento de Pruebas', () => {

  // =========================================================================
  // SCENARIO 1: ALTA / CREACIÓN
  // =========================================================================
  test('debe crear un casillero real y mostrarlo en la tabla', async ({ page }) => {
    const uniqueNumber = Math.floor(Math.random() * 10000).toString();
    
    await page.goto('http://localhost:5173/lockers');
    await page.locator('button:has-text("Agregar Casillero")').click();
    await expect(page.getByText('Agregar Nuevo Casillero')).toBeVisible();

    await page.getByPlaceholder('Ej. 15').fill(uniqueNumber);
    await page.getByPlaceholder('Ej. Vestuario Principal').fill('Vestuario Alta');

    await page.getByRole('button', { name: 'Crear Casillero' }).click();
    await expect(page.getByRole('button', { name: 'Crear Casillero' })).toBeHidden({ timeout: 15000 });

    const newRow = page.getByRole('row', { name: uniqueNumber });
    await expect(newRow).toBeVisible({ timeout: 10000 });
    await expect(newRow.getByText('Disponible')).toBeVisible();
  });

  // =========================================================================
  // SCENARIO 2: MODIFICACIÓN
  // =========================================================================
  test('debe editar un casillero existente y mostrar los cambios', async ({ page }) => {
    const uniqueNumber = Math.floor(Math.random() * 10000).toString();
    await page.goto('http://localhost:5173/lockers');
    
    // SETUP: Creamos el casillero específicamente para este test
    await page.locator('button:has-text("Agregar Casillero")').click();
    await page.getByPlaceholder('Ej. 15').fill(uniqueNumber);
    await page.getByPlaceholder('Ej. Vestuario Principal').fill('Vestuario Original');
    await page.getByRole('button', { name: 'Crear Casillero' }).click();
    
    const lockerRow = page.getByRole('row', { name: uniqueNumber });
    await expect(lockerRow).toBeVisible({ timeout: 15000 });

    // ACCIÓN: Clic en el lápiz (primer botón) para editar
    await lockerRow.locator('button').first().click();

    const locationInput = page.getByPlaceholder('Ej. Vestuario Principal');
    await locationInput.click();
    await locationInput.fill('Vestuario Editado E2E');

    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeHidden({ timeout: 15000 });

    // VALIDACIÓN
    await expect(lockerRow.getByText('Vestuario Editado E2E')).toBeVisible({ timeout: 10000 });
  });

  // =========================================================================
  // SCENARIO 3: ELIMINACIÓN
  // =========================================================================
  test('debe eliminar un casillero y limpiar la tabla', async ({ page }) => {
    const uniqueNumber = Math.floor(Math.random() * 10000).toString();
    await page.goto('http://localhost:5173/lockers');
    
    // SETUP: Creamos el casillero específicamente para borrarlo
    await page.locator('button:has-text("Agregar Casillero")').click();
    await page.getByPlaceholder('Ej. 15').fill(uniqueNumber);
    await page.getByPlaceholder('Ej. Vestuario Principal').fill('Vestuario a Borrar');
    await page.getByRole('button', { name: 'Crear Casillero' }).click();
    
    const lockerRow = page.getByRole('row', { name: uniqueNumber });
    await expect(lockerRow).toBeVisible({ timeout: 15000 });

    // Configuramos el aceptador de alertas
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // ACCIÓN: Clic en el tachito de basura (segundo botón)
    await lockerRow.locator('button').nth(1).click();

    // VALIDACIÓN: Verificamos que desaparezca
    await expect(lockerRow).toBeHidden({ timeout: 10000 });
  });

});
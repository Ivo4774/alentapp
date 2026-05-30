import { test, expect } from '@playwright/test';

// Forzamos el modo serial para que corran en orden y usen los mismos datos
test.describe.configure({ mode: 'serial' });

test.describe('Locker Full-Stack E2E - Suite Completa', () => {
  // Declaramos el número único AFUERA de los tests para que todos lo compartan
  const uniqueNumber = Math.floor(Math.random() * 10000).toString();

  // =========================================================================
  // SCENARIO 1: ALTA / CREACIÓN
  // =========================================================================
  test('1. debe crear un casillero real y mostrarlo en la tabla', async ({ page }) => {
    await page.goto('http://localhost:5173/lockers');

    await page.locator('button:has-text("Agregar Casillero")').click();
    await expect(page.getByText('Agregar Nuevo Casillero')).toBeVisible();

    await page.getByPlaceholder('Ej. 15').fill(uniqueNumber);
    await page.getByPlaceholder('Ej. Vestuario Principal').fill('Vestuario Original');

    await page.getByRole('button', { name: 'Crear Casillero' }).click();
    await expect(page.getByRole('button', { name: 'Crear Casillero' })).toBeHidden({ timeout: 15000 });
    
    const newRow = page.getByRole('row', { name: uniqueNumber });
    await expect(newRow).toBeVisible({ timeout: 10000 });
    await expect(newRow.getByText('Disponible')).toBeVisible(); 
  });

  // =========================================================================
  // SCENARIO 2: MODIFICACIÓN
  // =========================================================================
  test('2. debe editar el casillero creado en el paso anterior', async ({ page }) => {
    await page.goto('http://localhost:5173/lockers');
    // Como corremos en serial, ya estamos en la página y la fila existe
    const lockerRow = page.getByRole('row', { name: uniqueNumber });
    
    // Clic en el lápiz (primer botón)
    await lockerRow.locator('button').first().click();
    
    const locationInput = page.getByPlaceholder('Ej. Vestuario Principal');
    await locationInput.click();
    await locationInput.fill('Vestuario Actualizado E2E');

    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeHidden({ timeout: 15000 });

    await expect(lockerRow.getByText('Vestuario Actualizado E2E')).toBeVisible({ timeout: 10000 });
  });

  // =========================================================================
  // SCENARIO 3: ELIMINACIÓN
  // =========================================================================
  test('3. debe eliminar el casillero y limpiar la tabla', async ({ page }) => {
    await page.goto('http://localhost:5173/lockers');
    const lockerRow = page.getByRole('row', { name: uniqueNumber });
    
    // Configuramos el aceptador de alertas
    page.on('dialog', async dialog => {
        await dialog.accept(); 
    });
    
    // Clic en el tachito de basura (segundo botón)
    await lockerRow.locator('button').nth(1).click();

    // Verificamos que desaparezca
    await expect(lockerRow).toBeHidden({ timeout: 10000 });
  });

});
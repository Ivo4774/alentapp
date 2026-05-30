import { test, expect } from '@playwright/test';

test.describe('Locker Full-Stack E2E - Eliminación', () => {

  test('debe eliminar un casillero existente y removerlo de la tabla', async ({ page }) => {
    // Generamos un número único
    const uniqueNumber = Math.floor(Math.random() * 10000).toString();
    
    // 1. Navegamos a la pantalla de casilleros
    await page.goto('http://localhost:5173/lockers');

    // 2. Creamos un casillero dinámico para tener qué borrar sin afectar otros datos
    await page.locator('button:has-text("Agregar Casillero")').click();
    await page.getByPlaceholder('Ej. 15').fill(uniqueNumber);
    await page.getByPlaceholder('Ej. Vestuario Principal').fill('Vestuario a Eliminar');
    await page.getByRole('button', { name: 'Crear Casillero' }).click();
    
    // Esperamos que se guarde y aparezca
    await expect(page.getByRole('button', { name: 'Crear Casillero' })).toBeHidden({ timeout: 15000 });
    const lockerRow = page.getByRole('row', { name: uniqueNumber });
    await expect(lockerRow).toBeVisible({ timeout: 10000 });

    // 3. Hacemos clic en el botón de Eliminar (tachito de basura)
    // Es el segundo botón en la columna de acciones (índice 1)
    page.on('dialog', async dialog => {
        // Hacemos clic automático en "Aceptar" cuando salte la ventana
        await dialog.accept(); 
    });
    
    // 4. Confirmamos la eliminación en el modal de alerta
    await lockerRow.locator('button').nth(1).click();

    // 5. Validamos que la fila desaparezca completamente de la tabla
    await expect(lockerRow).toBeHidden({ timeout: 10000 });
  });

});
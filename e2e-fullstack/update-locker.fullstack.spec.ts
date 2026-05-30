import { test, expect } from '@playwright/test';

test.describe('Locker Full-Stack E2E - Modificación', () => {

  test('debe editar un casillero existente y reflejar los cambios en la tabla', async ({ page }) => {
    // Generamos un número único para garantizar un entorno de prueba aislado
    const uniqueNumber = Math.floor(Math.random() * 10000).toString();
    
    // 1. Navegamos a la pantalla de casilleros
    await page.goto('http://localhost:5173/lockers');

    // 2. Primero creamos un casillero para asegurarnos de que exista la fila a modificar
    await page.locator('button:has-text("Agregar Casillero")').click();
    await page.getByPlaceholder('Ej. 15').fill(uniqueNumber);
    await page.getByPlaceholder('Ej. Vestuario Principal').fill('Vestuario Original');
    await page.getByRole('button', { name: 'Crear Casillero' }).click();
    await expect(page.getByRole('button', { name: 'Crear Casillero' })).toBeHidden({ timeout: 15000 });
    // Esperamos que se complete la creación y aparezca en la tabla
    const lockerRow = page.getByRole('row', { name: uniqueNumber });
    await expect(lockerRow).toBeVisible({ timeout: 10000 });

    // 3. Hacemos clic en el botón de Editar dentro de la fila de nuestro casillero específico
    await lockerRow.locator('button').first().click();
    
    // 4. Modificamos los campos en el formulario de edición
    const locationInput = page.getByPlaceholder('Ej. Vestuario Principal');
    await locationInput.click();
    await locationInput.fill('Vestuario Actualizado E2E');

    // 5. Guardamos los cambios de la actualización
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // 6. Validamos que el modal de edición se cierre correctamente
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeHidden({ timeout: 15000 });

    // 7. Validamos que la tabla refleje instantáneamente la nueva ubicación modificada
    await expect(lockerRow.getByText('Vestuario Actualizado E2E')).toBeVisible({ timeout: 10000 });
    await expect(lockerRow.getByText('Disponible')).toBeVisible(); 
  });

});
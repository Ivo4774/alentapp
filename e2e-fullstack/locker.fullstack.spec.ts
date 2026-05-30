import { test, expect } from '@playwright/test';

test.describe('Locker Full-Stack E2E - Alta', () => {

  test('debe crear un casillero real y mostrarlo en la tabla', async ({ page }) => {
    // Generamos un número único para que no choque en la base de datos
    const uniqueNumber = Math.floor(Math.random() * 10000).toString();
    
    // 1. Navegamos a la pantalla de casilleros 
    await page.goto('/lockers');

    // 2. Abrimos el modal/formulario de alta
    await page.locator('button:has-text("Nuevo Casillero")').click();
    await expect(page.getByText('Agregar Nuevo Casillero')).toBeVisible();

    // 3. Llenamos los datos del formulario (Ajustá los placeholders según lo que diga tu frontend)
    await page.getByPlaceholder('Ej. 10').fill(uniqueNumber);
    await page.getByPlaceholder('Ej. Pasillo Principal').fill('Vestuario E2E Test');

    // 4. Guardamos
    await page.getByRole('button', { name: 'Crear Casillero' }).click();

    // 5. Validamos que el modal se cierre
    await expect(page.getByRole('button', { name: 'Crear Casillero' })).toBeHidden();
    
    // 6. Validamos que el nuevo casillero aparezca en la tabla
    const newRow = page.getByRole('row', { name: uniqueNumber });
    await expect(newRow).toBeVisible({ timeout: 10000 });
    await expect(newRow.getByText('Vestuario E2E Test')).toBeVisible();
    
    // Verificamos el estado inicial (ajustá a 'Disponible' si tu front lo traduce)
    await expect(newRow.getByText('Available')).toBeVisible(); 
  });

});
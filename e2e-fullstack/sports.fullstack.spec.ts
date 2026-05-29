import { test, expect } from '@playwright/test';

test.describe('Sports Full-Stack E2E - Alta', () => {

  test('debe crear una disciplina real y mostrarla en la tabla', async ({ page }) => {
    await page.goto('/sports');

    await page.locator('button:has-text("Nuevo Deporte")').click();
    await expect(page.getByText('Agregar Nuevo Deporte')).toBeVisible();

    await page.getByPlaceholder('Ej. Natación').fill('Boxeo E2E');
    await page.getByPlaceholder('Breve detalle de la actividad').fill('Entrenamiento competitivo');
    await page.getByPlaceholder('Ej. 20').fill('15');
    
    await page.getByPlaceholder('0 si está incluido en la cuota').fill('500');
    
    await page.getByText('Seleccione una opción').click();
    await page.getByText('Sí, requiere apto').click();

    await page.getByRole('button', { name: 'Crear Deporte' }).click();

    await expect(page.getByRole('button', { name: 'Crear Deporte' })).toBeHidden();
    
    await expect(page.getByText('Boxeo E2E')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Entrenamiento competitivo')).toBeVisible();
    await expect(page.getByText('15', { exact: true })).toBeVisible();
    await expect(page.getByText('$500')).toBeVisible();
    await expect(page.getByText('Requerido')).toBeVisible();
  });

});

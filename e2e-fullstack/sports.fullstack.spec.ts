import { test, expect } from '@playwright/test';

test.describe('Sports Full-Stack E2E - Alta', () => {

  test('debe crear una disciplina real y mostrarla en la tabla', async ({ page }) => {
    const uniqueName = `Boxeo E2E ${Date.now()}`;
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

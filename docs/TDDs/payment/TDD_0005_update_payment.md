---
id: 0005
estado: Pendiente
autor: Pieroni María Belén
fecha: 2026-04-30
titulo: Registrar Cobro de Pago
---

# TDD_0005_update_payment: Registrar Pago

## Contexto de Negocio (PRD)

### Objetivo
Registrar el ingreso efectivo de dinero al club cuando un socio abona una cuota previamente generada.

### User Persona
*   **Nombre**: Tesorero
*   **Necesidad**: Marcar una cuota como pagada al recibir el dinero, dejando constancia de la fecha exacta de la transacción.

### Criterios de Aceptación
*   Solo se pueden actualizar pagos que estén en estado "Pendiente".
*   Al registrar el cobro, el estado debe cambiar a "Pagado".
*   Se debe capturar la `fecha_pago` de forma obligatoria para este proceso.

## Diseño Técnico (RFC)

### Modelo de Datos
Actualización de campos en la entidad `Payment`:
*   `estado`: Cambio de "Pendiente" a "Pagado".
*   `fecha_pago`: DateTime (Actualizado con la fecha del cobro).

### Contrato de API (@alentapp/shared)
*   **Endpoint**: `PATCH /api/v1/payments/:id/pay`
*   **Request Body**:
```ts
{
    "fecha_pago": "string (ISO Date)"
}
```

### Componentes de Arquitectura Hexagonal
*   **Domain**: Regla de negocio: Un pago "Anulado" o "Pagado" no puede volver a ser procesado.
*   **Application**: `PagarPaymentUseCase`. Recupera la entidad, aplica la lógica de transición de estado y guarda cambios.
*   **Infrastructure**: Endpoint en `PaymentController` y método `update` en el repositorio.

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Pago ya estaba pagado       | Error: "El pago ya ha sido procesado"         | 409 Conflict              |

## Plan de Implementación
1. Agregar el caso de uso `PagarPaymentUseCase` en la capa Application.
2. Implementar la validación de estados en la entidad de dominio.
3. Exponer el endpoint PATCH en el controlador.
---
id: 0006
estado: Pendiente
autor: Pieroni María Belén
fecha: 2026-04-30
titulo: Anulación de Pago (Borrado Lógico)
---

# TDD_0006_delete_payment: Anular Pago (Borrado Lógico)

## Contexto de Negocio (PRD)

### Objetivo
Garantizar la integridad de la auditoría financiera impidiendo el borrado físico de registros. La funcionalidad resuelve errores mediante la anulación del registro, manteniendo la evidencia de que existió.

### User Persona
*   **Nombre**: Juan (Tesorero/Administrativo)
*   **Necesidad**: Cancelar un pago generado por error (ej. duplicado o monto incorrecto) sin eliminarlo de la base de datos para no alterar la numeración o el historial de auditoría.

### Criterios de Aceptación
*   El sistema no debe permitir la eliminación física (`DELETE`) del registro en la base de datos.
*   El estado del pago debe cambiar a "Anulado".
*   Un pago anulado queda inhabilitado para cualquier operación posterior (como el cobro).
*   Un pago en estado "Pagado" no puede ser anulado.

## Diseño Técnico (RFC)

### Modelo de Datos
*   `estado`: String (Actualización a "Anulado").
*   La base de datos conserva el registro original intacto exceptuando el estado que ahora es "Anulado".

### Contrato de API (@alentapp/shared)
*   **Endpoint**: `PATCH /api/v1/payments/:id/anular`
*   **Request Body**:
```ts
{}
```

### Componentes de Arquitectura Hexagonal
*   **Domain**: Lógica para marcar el objeto como `Anulado`.
*   **Application**: `AnularPaymentUseCase`.
*   **Infrastructure**: El puerto de salida `PaymentRepository` **no incluye** un método `delete`, forzando el uso exclusivo del método `updateEstado`.

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Pago inexistente            | Error: "No se encontró el registro a anular"  | 404 Not Found             |
| Pago ya pagado              | No permite anulación                          | 409 Conflict              |
| Intento de borrado físico   | Error: "Método no permitido"                  | 405 Method Not Allowed    |

## Plan de Implementación
1. Implementar `AnularPaymentUseCase`.
2. Asegurar que el adaptador de infraestructura solo realice `UPDATE` en la tabla de pagos.
3. Validar en el controlador que no existan rutas DELETE para este recurso.
---
id: 0006
estado: Propuesto
autor: Pieroni María Belén
fecha: 2026-04-30
titulo: Eliminar Payment
---

# TDD-0006: Eliminar Payment

## Contexto de Negocio (PRD)

### Objetivo
Garantizar la integridad del historial financiero del club impidiendo el borrado fisico de registros de pago. La funcionalidad resuelve errores de carga mediante la cancelacion logica del registro, manteniendo la evidencia de que existio y preservando la trazabilidad de auditoria.

### User Persona
*   **Nombre**: Juan (Tesorero / Administrativo)
*   **Necesidad**: Cancelar un pago generado por error (ej. duplicado o monto incorrecto) sin eliminarlo de la base de datos para no alterar el historial de auditoria.

### Criterios de Aceptacion
*   El sistema debe realizar un borrado logico: el estado del pago cambia a `Canceled` pero el registro se conserva en la base de datos.
*   Solo se pueden cancelar pagos que esten en estado `Pending`.
*   Un pago con estado `Paid` no puede ser cancelado.
*   Un pago ya cancelado no puede volver a cancelarse.
*   Al finalizar, el sistema debe retornar el objeto del pago actualizado con estado `Canceled`.

---

## Diseno Tecnico (RFC)

### Modelo de Datos
Actualizacion parcial sobre la entidad `Payment`:
*   `status`: String — Transicion a `Canceled`. Valores permitidos: `Pending` | `Paid` | `Canceled`.

### Contrato de API (@alentapp/shared)
*   **Endpoint**: `DELETE /api/v1/payments/:id`
*   **Request Body**: Sin body.
*   **Response Body**:
```ts
// DELETE → 200 OK (borrado logico: retorna el recurso actualizado)
{
  id: string,
  amount: number,
  month: number,
  year: number,
  status: string,         // "Canceled"
  due_date: string,       // ISO 8601
  payment_date: string | null,
  member_id: string
}
```

### Componentes de Arquitectura Hexagonal
*   **Domain**: Interfaz `PaymentRepository` (Puerto) con el metodo `updateStatus`. El puerto no expone un metodo `delete`, lo que garantiza a nivel de contrato que ningun caso de uso puede eliminar fisicamente un pago.
*   **Application**: `CancelPaymentUseCase`. Recupera el pago por `id`, valida que el estado actual sea `Pending`, actualiza el estado a `Canceled` y persiste los cambios.
*   **Infrastructure**: `PostgresPaymentRepository` que implementa el metodo `updateStatus` usando Prisma, y `PaymentController` que recibe el request `DELETE`, extrae el `id` de la URL y delega en el caso de uso.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Codigo HTTP |
| --------- | ------------------ | ----------- |
| `id` de pago no existe en la base de datos | Mensaje: "Pago no encontrado" | 404 Not Found |
| Pago ya tiene estado `Canceled` | Mensaje: "El pago ya se encuentra cancelado" | 409 Conflict |
| Pago tiene estado `Paid` | Mensaje: "No se puede cancelar un pago ya acreditado" | 409 Conflict |
| Error de conexion a la base de datos | Mensaje: "Error interno, por favor intente mas tarde" | 500 Internal Server Error |

---

## Plan de Implementacion
1.  Verificar que `PaymentResponse` en `@alentapp/shared` contemple el campo `status` con el valor `Canceled`.
2.  Confirmar que la interfaz `PaymentRepository` en la capa de Dominio expone `updateStatus` y no expone un metodo `delete`.
3.  Implementar `CancelPaymentUseCase` con la validacion de transicion de estado (`Pending` → `Canceled`).
4.  Reutilizar o extender el metodo `updateStatus` en `PostgresPaymentRepository` para soportar la transicion a `Canceled`.
5.  Crear el endpoint `DELETE /payments/:id` en `PaymentController` y registrarlo en el router de Fastify.
6.  Integrar la llamada en el Frontend y actualizar la vista de pagos para reflejar el nuevo estado.
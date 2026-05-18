---
id: 0005
estado: Propuesto
autor: Pieroni María Belén
fecha: 2026-04-30
titulo: Editar Payment
---

# TDD-0005: Editar Payment

## Contexto de Negocio (PRD)

### Objetivo
Registrar el ingreso efectivo de dinero al club cuando un socio abona una cuota previamente generada. El objetivo es actualizar el estado del pago a `Paid` y dejar constancia de la fecha exacta en que se realizo la transaccion.

### User Persona
*   **Nombre**: Juan (Tesorero / Administrativo)
*   **Necesidad**: Marcar una cuota como pagada al recibir el dinero, dejando constancia de la fecha exacta de la transaccion.

### Criterios de Aceptacion
*   Solo se pueden actualizar pagos que esten en estado `Pending`.
*   Al registrar el cobro, el estado debe cambiar automaticamente a `Paid`.
*   El campo `payment_date` es obligatorio para esta operacion.
*   Un pago con estado `Paid` o `Canceled` no puede volver a ser procesado.
*   Al finalizar, el sistema debe retornar el objeto del pago actualizado con todos sus campos.

---

## Diseno Tecnico (RFC)

### Modelo de Datos
Actualizacion parcial sobre la entidad `Payment`:
*   `status`: String — Transicion de `Pending` a `Paid`. Valores permitidos: `Pending` | `Paid` | `Canceled`.
*   `payment_date`: Date — Fecha en que se efectuo el cobro. Obligatorio en esta operacion. *(DateTime en Prisma / string ISO 8601 en la API)*

### Contrato de API (@alentapp/shared)
*   **Endpoint**: `PATCH /api/v1/payments/:id/pay`
*   **Request Body**:
```ts
{
  payment_date: string    // ISO 8601: "YYYY-MM-DD"
}
```
*   **Response Body**:
```ts
// PATCH → 200 OK
{
  id: string,
  amount: number,
  month: number,
  year: number,
  status: string,         // "Paid"
  due_date: string,       // ISO 8601: "YYYY-MM-DD"
  payment_date: string,   // ISO 8601: "YYYY-MM-DD"
  member_id: string
}
```

### Componentes de Arquitectura Hexagonal
*   **Domain**: Interfaz `PaymentRepository` (Puerto) con el metodo `updateStatus`. La regla de negocio establece que un pago con estado `Paid` o `Canceled` no puede volver a ser procesado.
*   **Application**: `PayPaymentUseCase`. Recupera el pago por `id`, valida que el estado actual sea `Pending`, actualiza el estado a `Paid` con la `payment_date` recibida y persiste los cambios.
*   **Infrastructure**: `PostgresPaymentRepository` que implementa el metodo `updateStatus` usando Prisma, y `PaymentController` que extrae el `id` de la URL y el body del request y delega en el caso de uso.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Codigo HTTP |
| --------- | ------------------ | ----------- |
| Campo `payment_date` faltante en el body | Mensaje: "La fecha de pago es obligatoria" | 400 Bad Request |
| `id` de pago no existe en la base de datos | Mensaje: "Pago no encontrado" | 404 Not Found |
| Pago ya tiene estado `Paid` | Mensaje: "El pago ya fue registrado como pagado" | 409 Conflict |
| Pago tiene estado `Canceled` | Mensaje: "No se puede pagar un registro cancelado" | 409 Conflict |
| Error de conexion a la base de datos | Mensaje: "Error interno, por favor intente mas tarde" | 500 Internal Server Error |

---

## Plan de Implementacion
1.  Actualizar los tipos en `@alentapp/shared` para incluir `PayPaymentRequest` y verificar que `PaymentResponse` contemple `payment_date`.
2.  Agregar el metodo `updateStatus` a la interfaz `PaymentRepository` en la capa de Dominio si no existe.
3.  Implementar `PayPaymentUseCase` con la validacion de transicion de estado (`Pending` → `Paid`).
4.  Implementar el metodo `updateStatus` en `PostgresPaymentRepository`.
5.  Crear el endpoint `PATCH /payments/:id/pay` en `PaymentController` y registrarlo en el router de Fastify.
6.  Integrar la llamada en el Frontend y actualizar la vista de pagos para reflejar el nuevo estado.
---
id: 0004
estado: Propuesto
autor: Pieroni María Belén
fecha: 2026-04-30
titulo: Crear Payment
---

# TDD-0004: Crear Payment

## Contexto de Negocio (PRD)

### Objetivo
Permitir el registro de las cuotas de los socios del Club Alentapp. El objetivo es generar un comprobante digital con estado inicial `Pending` para realizar su seguimiento y control de deuda.

### User Persona
*   **Nombre**: Juan (Tesorero / Administrativo)
*   **Necesidad**: Generar un nuevo registro de deuda para un socio especifico de manera rapida y con validaciones automaticas.

### Criterios de Aceptacion
*   El sistema debe validar que el socio (`member_id`) existe en la base de datos.
*   El campo `amount` debe ser un valor mayor a cero.
*   El campo `month` debe estar comprendido entre 1 y 12.
*   El estado inicial de todo nuevo pago debe ser `Pending` de forma automatica, sin que el usuario lo indique.
*   Al finalizar, el sistema debe retornar el objeto del pago creado con todos sus campos.

---

## Diseno Tecnico (RFC)

### Modelo de Datos
Se utiliza la entidad `Payment`:
*   `id`: String — Identificador unico universal (UUID).
*   `amount`: Float — Monto de la cuota. (Restriccion: > 0)
*   `month`: Int — Mes de referencia del pago. (Restriccion: 1 a 12)
*   `year`: Int — Año de referencia del pago.
*   `status`: String — Estado del pago. Valores permitidos: `Pending` | `Paid` | `Canceled`. (Valor por defecto: `Pending`)
*   `due_date`: Date — Fecha de vencimiento de la cuota. *(DateTime en Prisma / string ISO 8601 en la API)*
*   `payment_date`: Date | null — Fecha en que se efectuo el pago. Nullable. *(DateTime en Prisma / string ISO 8601 en la API)*
*   `member_id`: String — Relacion con el socio al que pertenece el pago.

### Contrato de API (@alentapp/shared)
*   **Endpoint**: `POST /api/v1/payments`
*   **Request Body**:
```ts
{
  amount: number,         // mayor a 0
  month: number,          // 1 a 12
  year: number,
  due_date: string,       // ISO 8601: "YYYY-MM-DD"
  member_id: string       // UUID del socio
}
```
*   **Response Body**:
```ts
// POST → 201 Created
{
  id: string,
  amount: number,
  month: number,
  year: number,
  status: string,         // "Pending"
  due_date: string,       // ISO 8601
  payment_date: string | null,
  member_id: string
}
```

### Componentes de Arquitectura Hexagonal
*   **Domain**: Entidad `Payment` e interfaz `PaymentRepository` (Puerto) con el metodo `create`.
*   **Application**: `CreatePaymentUseCase`. Valida que `amount` sea mayor a cero, que `month` este en rango, que el `member_id` exista llamando al `MemberRepository`, y construye la entidad con `status: Pending` antes de persistirla.
*   **Infrastructure**: `PostgresPaymentRepository` que implementa el puerto usando Prisma, y `PaymentController` que recibe el request HTTP, extrae el body y delega en el caso de uso.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Codigo HTTP |
| --------- | ------------------ | ----------- |
| Campo requerido faltante (amount, month, year, due_date, member_id) | Mensaje: "Faltan campos obligatorios" | 400 Bad Request |
| `amount` igual a 0 o negativo | Mensaje: "El monto debe ser mayor a cero" | 400 Bad Request |
| `month` fuera de rango (ej: 0 o 13) | Mensaje: "El mes debe estar entre 1 y 12" | 400 Bad Request |
| `member_id` no existe en la base de datos | Mensaje: "Socio no encontrado" | 404 Not Found |
| Error de conexion a la base de datos | Mensaje: "Error interno, por favor intente mas tarde" | 500 Internal Server Error |

---

## Plan de Implementacion
1.  Definir los tipos `CreatePaymentRequest` y `PaymentResponse` en `@alentapp/shared`.
2.  Definir el modelo `Payment` en `schema.prisma` y correr la migracion con `npx prisma migrate dev --name create_payments_table`.
3.  Definir la interfaz `PaymentRepository` en la capa de Dominio con el metodo `create`.
4.  Implementar `CreatePaymentUseCase` con las validaciones de `amount`, `month` y existencia del `member_id`.
5.  Implementar el metodo `create` en `PostgresPaymentRepository`.
6.  Crear el endpoint `POST` en `PaymentController` y registrarlo en el router de Fastify.
7.  Integrar la llamada en el Frontend y actualizar la vista de pagos.
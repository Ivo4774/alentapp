---
id: 0004
estado: Pendiente
autor: Pieroni María Belén
fecha: 2026-04-30
titulo: Crear Pago de Cuota Social
---

# TDD_0004_new_payment: Crear Pago

## Contexto de Negocio (PRD)

### Objetivo
Permitir el registro de las cuotas de los socios del Club Alentapp. El objetivo es generar un comprobante digital pendiente de cobro para realizar su seguimiento.

### User Persona
*   **Nombre**: Tesorero
*   **Necesidad**: Generar un nuevo registro de deuda para un socio específico de manera rápida y con validaciones automáticas.

### Criterios de Aceptación
*   El sistema debe validar que el socio (`member_id`) existe en la base de datos.
*   El monto debe ser siempre mayor a cero.
*   El estado inicial por defecto de todo nuevo pago debe ser "Pendiente".
*   El campo `mes` debe estar comprendido entre 1 y 12.

## Diseño Técnico (RFC)

### Modelo de Datos
Se utiliza la entidad `Payment`:
*   `monto`: Float (Restricción: > 0).
*   `mes`: Int (Restricción: 1 a 12).
*   `anio`: Int.
*   `estado`: String (Valor por defecto: "Pendiente").
*   `member_id`: String (Relación obligatoria con Member).

### Contrato de API (@alentapp/shared)
*   **Endpoint**: `POST /api/v1/payments`
*   **Request Body**:
```ts
{
  "monto": number,
  "mes": number,
  "anio": number,
  "fecha_vencimiento": "string (ISO Date)",
  "member_id": "string (UUID)"
}
```

### Componentes de Arquitectura Hexagonal
*   **Domain**: Entidad `Payment` con método de fábrica que valida invariantes (monto positivo, mes válido).
*   **Application**: `CrearPaymentUseCase`. Valida la existencia del socio mediante un `MemberService` o puerto de salida.
*   **Infrastructure**: `PaymentController` que recibe el DTO y `PrismaPaymentRepository` para persistir.

## Casos de Borde y Errores
| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Socio no existe             | Mensaje de error "Socio no encontrado"        | 404 Not Found             |
| Monto igual a 0             | Error de validación: el monto debe ser > 0    | 400 Bad Request           |
| Mes fuera de rango (13)     | Error de validación de rango de mes           | 400 Bad Request           |
| Falta member_id             | Error de validación de campos obligatorios    | 400 Bad Request           |

## Plan de Implementación
1. Definir `CreatePaymentRequest` y `PaymentResponse` en `@alentapp/shared`.
2. Implementar lógica de validación en la entidad `Payment` (Domain).
3. Implementar el caso de uso y su puerto de salida.

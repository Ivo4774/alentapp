---
id: 0014
estado: Propuesto
autor: Ariel Cayo
fecha: 2026-05-01
titulo: Editar Sport
---

# TDD-0014: Editar Sport

## Contexto de Negocio (PRD)

### Objetivo
Permitir a los administrativos modificar la información operativa de un deporte existente, respetando estrictamente la regla de inmutabilidad sobre su nombre.

### User Persona
* **Nombre**: Ariel (Administrativo)
* **Necesidad**: Modificar rápidamente la cantidad de cupos disponibles de un deporte o su descripción, sin alterar los registros históricos asociados al nombre.

### Criterios de Aceptacion
* El sistema debe impedir la modificación del atributo `name`.
* El sistema debe validar que el nuevo `max_capacity` (si se envía) sea mayor a cero.
* El sistema solo permite la edición de `description` y `max_capacity`. Intentos de modificar otros campos serán ignorados.
* Al finalizar, el sistema debe retornar los nuevos datos actualizados.

---

## Diseno Tecnico (RFC)

### Modelo de Datos
Se actualizarán parcialmente los atributos de la entidad `Sport`:
* `description`: String — Cadena de texto (opcional).
* `max_capacity`: Int — Número entero, debe ser mayor a 0 (opcional).

### Contrato de API (@alentapp/shared)

* **Endpoint**: `PATCH /api/v1/sports/:id`

* **Request Body**:
```ts
{
  description?: string,
  max_capacity?: number
}
```

* **Response Body**:
```ts
{
  id: string,
  name: string,
  description: string,
  max_capacity: number,
  additional_price: number,
  requires_medical_certificate: boolean
}
```

### Componentes de Arquitectura Hexagonal
* **Domain**: Interfaz `SportRepository` (Puerto) con el método de actualización.
* **Application**: `UpdateSportUseCase`. Orquesta la validación de la capacidad mínima y garantiza que no se procesen campos inmutables antes de llamar al repositorio.
* **Infrastructure**: `PostgresSportRepository` que implementa el puerto usando Prisma para hacer un update parcial, y `SportController` que recibe el request HTTP PATCH.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Codigo HTTP |
| --------- | ------------------ | ----------- |
| Intento de modificar nombre | Mensaje: "El nombre del deporte es inmutable" | 400 Bad Request |
| Capacidad en 0 o negativa | Mensaje: "La nueva capacidad debe ser mayor a cero" | 400 Bad Request |
| Deporte inexistente | Mensaje: "El deporte no existe" | 404 Not Found |
| Error de conexión a la base de datos | Mensaje: "Error interno, por favor intente mas tarde" | 500 Internal Server Error |

---

## Plan de Implementacion
1.  Definir el tipo `UpdateSportRequest` en `@alentapp/shared`.
2.  Actualizar la interfaz `SportRepository` en la capa de Dominio añadiendo el método `update`.
3.  Implementar `UpdateSportUseCase` con la validación de exclusión de campos.
4.  Implementar el método de actualización parcial en `PostgresSportRepository`.
5.  Crear el endpoint PATCH en `SportController` y registrarlo en el router de Fastify.
6.  Integrar la llamada en el Frontend para permitir la edición.
---
id: 0011
estado: En revisión
autor: Jeronimo Molina
fecha: 2026-05-09
titulo: Editar Locker
---


# TDD-0011: Editar Locker

## Contexto de Negocio (PRD)

### Objetivo
Permitir la modificación de los datos de un casillero (número, ubicación, estado) y gestionar su asignación o desasignación a un socio específico, aplicando restricciones lógicas de estado.

### User Persona
* **Nombre**: Maximiliano (Rol: Administrativo / Encargado de Vestuarios)
* **Necesidad**: Actualizar el estado de un casillero (ej. marcarlo en mantenimiento) o registrar a qué socio se le entregó la llave.

### Criterios de Aceptacion
* El sistema debe permitir actualizar uno o múltiples campos del casillero de forma parcial.
* Si se modifica el número de casillero, el sistema debe garantizar que el nuevo número no pertenezca a otro existente.
* El sistema debe bloquear la asignación de un socio (`member_id`) si el casillero se encuentra en estado "Maintenance".

---

## Diseno Tecnico (RFC)

### Modelo de Datos
Se utiliza la entidad `Locker`:
* `id`: String — Identificador unico universal (UUID).
* `number`: Int — Número identificador del casillero (Único).
* `location`: String — Ubicación física dentro del club.
* `status`: String — Estado actual del casillero (Valores: Available | Occupied | Maintenance).
* `member_id`: String — Relacion con el socio al que pertenece el registro.

### Contrato de API (@alentapp/shared)

* **Endpoint**: `PATCH /api/v1/lockers/:id`

* **Request Body**:
```ts
{
  number?: number,
  location?: string,
  status?: 'Available' | 'Occupied' | 'Maintenance',
  member_id?: string | null
}
```

*  **Response Body**:*
```ts
{
  id: string,
  number: number,
  location: string,
  status: 'Available' | 'Occupied' | 'Maintenance',
  member_id: string | null
}
```

### Componentes de Arquitectura Hexagonal
*   **Domain**: Entidad Locker e interfaz LockerRepository (Puerto) con el método update necesario para esta operacion.
*   **Application**: EditLockerUseCase. Orquesta la validación de negocio (verifica que no se asigne un socio si el estado enviado es Maintenance o si ya está en Maintenance) y luego llama al repositorio para actualizar.
*   **Infrastructure**: PostgresLockerRepository que implementa el puerto usando Prisma, y LockerController que recibe el request HTTP PATCH, extrae los parametros y el body, y delega en el caso de uso.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Codigo HTTP |
| --------- | ------------------ | ----------- |
| Datos enviados con formato inválido | Mensaje: "Datos de actualización inválidos" | 400 Bad Request |
| Casillero a editar no existe | Mensaje: "El casillero no existe" | 404 Not Found |
| Socio a asignar no existe | Mensaje: "El socio referenciado no existe" | 404 Not Found |
| Asignar socio a casillero en mantenimiento | Mensaje: "No se puede asignar un casillero en mantenimiento" | 409 Conflict |
| Error de conexion a la base de datos | Mensaje: "Error interno, por favor intente mas tarde" | 500 Internal Server Error |

--- 

## Plan de Implementacion
1.  Definir los tipos `UpdateLockerRequest` en `@alentapp/shared`.
2.  Actualizar la interfaz `LockerRepository` en la capa de Dominio agregando el metodo update.
3.  Implementar `EditLockerUseCase` con las validaciones de regla de negocio (bloqueo por mantenimiento).
4.  Implementar el metodo correspondiente en `PostgresLockerRepository`.
5.  Crear el endpoint PATCH en `LockerController` y registrarlo en el router de Fastify.
6.  Integrar la llamada en el Frontend reutilizando el modal de creación y adaptándolo para edición.

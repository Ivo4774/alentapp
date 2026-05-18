---
id: 0012
estado: En revisión
autor: Jeronimo Molina
fecha: 2026-05-09
titulo: Eliminar Locker
---

# TDD-0012: Eliminar Locker

## Contexto de Negocio (PRD)

### Objetivo
Permitir dar de baja permanentemente un casillero del sistema (por ejemplo, si fue desmantelado físicamente o se cargó por error) para mantener el inventario real actualizado.

### User Persona
* **Nombre**: Maximiliano (Rol: Administrativo / Encargado de Vestuarios)
* **Necesidad**: Borrar un casillero que ya no existe físicamente, de forma rápida desde la tabla principal. 

### Criterios de Aceptacion
* El sistema debe requerir el identificador del casillero para proceder con el borrado físico (hard delete).
* El sistema debe validar que el casillero exista antes de intentar borrarlo.
* El sistema debe bloquear la eliminación si el casillero se encuentra actualmente asignado a un socio (`member_id` no es nulo o el estado es "Occupied").

---

## Diseno Tecnico (RFC)

### Modelo de Datos
Se utiliza la entidad `Locker`:
* `id`: String — Identificador unico universal (UUID).
* `number`: Int — Número identificador del casillero.
* `location`: String — Ubicación física dentro del club.
* `status`: String — Estado actual del casillero.
* `member_id`: String — Relacion con el socio al que pertenece el registro.

### Contrato de API (@alentapp/shared)

* **Endpoint**: `DELETE /api/v1/lockers/:id`

* **Request Body**: `None`

---

### Componentes de Arquitectura Hexagonal
*   **Domain**:  Entidad Locker e interfaz LockerRepository (Puerto) con el método update necesario para esta operacion.
*   **Application**: DeleteLockerUseCase. Orquesta la operación verificando primero que el casillero exista y que no esté ocupado por un socio. Si está desocupado, delega la eliminación.
*   **Infrastructure**: PostgresLockerRepository que implementa el puerto usando Prisma, y LockerController que recibe el request HTTP DELETE, extrae el id de los parámetros y delega en el caso de uso.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Codigo HTTP |
| --------- | ------------------ | ----------- |
| El casillero a eliminar no existe | Mensaje: "El casillero no existe" | 404 Not Found |
| Eliminar casillero asignado a un socio | Mensaje: "No se puede eliminar un casillero asignado" | 409 Conflict |
| Error de conexion a la base de datos | Mensaje: "Error interno, por favor intente mas tarde" | 500 Internal Server Error |

--- 

## Plan de Implementacion
1.  Actualizar la interfaz `LockerRepository` en la capa de Dominio agregando el metodo delete.
2.  Implementar `DeleteLockerUseCase` asegurando la validación del estado (rechazar si está ocupado).
3.  Implementar el metodo correspondiente en `PostgresLockerRepository` ejecutando un borrado físico en la base de datos.
4.  Crear el endpoint `DELETE` en `LockerController` devolviendo un status 204 y registrarlo en el router de Fastify.
5.  Integrar la llamada en el Frontend, agregando una confirmación visual (modal o window.confirm) antes de ejecutar el borrado.


---
id: 0012
estado: En revisión
autor: Jeronimo Molina
fecha: 2026-05-01
titulo: Baja de Casilleros (Locker)
---

# TDD-0012: Baja de Casilleros (Locker)

## Contexto de Negocio (PRD)

### Objetivo
Permitir a los administrativos dar de baja permanentemente un casillero del sistema (por ejemplo, si fue desmantelado físicamente o se cargó por error) para mantener el inventario real actualizado.

### User Persona
* **Nombre**: Personal Administrativo / Encargado de Vestuarios.
* **Necesidad**: Borrar un casillero que ya no existe físicamente, de forma rápida desde la tabla principal. Necesita una advertencia antes de borrar para no cometer equivocaciones.

### Criterios de Aceptación
* El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con el borrado.
* El sistema debe validar que el casillero exista antes de intentar borrarlo.
* **Regla de Negocio**: No se puede eliminar un casillero que se encuentre actualmente asignado a un socio (`status` == 'Occupied' o `member_id` != null). Debe ser liberado primero.
* El sistema debe realizar un borrado físico de la base de datos (hard delete).
* Si el borrado es exitoso, la tabla debe actualizarse automáticamente.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)
Al tratarse de una operación destructiva que solo requiere conocer el identificador, no se envía cuerpo en la petición HTTP.

* **Endpoint**: `DELETE /api/v1/lockers/:id`
* **Request Body**: `None`
* **Response**: `204 No Content` en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. Puerto: LockerRepository (Interface en el Dominio con el método `delete(id)`).
2. Caso de Uso: DeleteLocker (Lógica que verifica que el casillero exista y que NO esté ocupado antes de llamar al repositorio).
3. Adaptador de Salida: PostgresLockerRepository (Implementación real en BD usando el método `delete` de Prisma).
4. Adaptador de Entrada: LockerController (Ruta HTTP DELETE que extrae el `id` y devuelve un status 204).

## Casos de Borde y Errores

| Escenario                      | Resultado Esperado                                           | Código HTTP actual        |
| ------------------------------ | ------------------------------------------------------------ | ------------------------- |
| Casillero inexistente          | Mensaje: "El casillero no existe"                            | 400 Bad Request           |
| Eliminar casillero ocupado     | Mensaje: "No se puede eliminar un casillero asignado"        | 409 Conflict              |
| Error de conexión a DB         | Mensaje: error del motor de base de datos                    | 400 Bad Request           |
| Eliminación exitosa            | Respuesta vacía                                              | 204 No Content            |

## Plan de Implementación

1. Ampliar el `LockerRepository` y `PostgresLockerRepository` con el método `delete`.
2. Crear la lógica de negocio en `DeleteLockerUseCase` asegurando la validación del estado (rechazar si está ocupado).
3. Crear el endpoint `DELETE /api/v1/lockers/:id` en el `LockerController` y registrarlo en la app de Fastify.
4. Añadir el método `delete` al servicio Frontend (`lockers.ts`).
5. Enlazar el botón de eliminación en la vista de casilleros agregando la confirmación del navegador (`window.confirm`) antes de hacer la llamada HTTP.
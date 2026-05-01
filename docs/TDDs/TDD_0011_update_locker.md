---
id: 0011
estado: En revisión
autor: Jeronimo Molina
fecha: 2026-05-01
titulo: Modificación y Asignación de Casilleros (Locker)
---

# TDD-0011: Modificación y Asignación de Casilleros (Locker)

## Contexto de Negocio (PRD)

### Objetivo
Permitir la edición de los datos de un casillero (número, ubicación, estado) y gestionar su asignación a un socio específico.

### User Persona
* **Nombre**: Personal Administrativo.
* **Necesidad**: Modificar el estado de un casillero (ej. ponerlo en mantenimiento si se rompe la puerta) o asignarlo a un nuevo socio que lo solicitó.

### Criterios de Aceptación
* El sistema debe permitir actualizar la información del casillero.
* **Regla de Negocio**: Un casillero no puede asignarse a un socio si su `status` es "Maintenance".
* El sistema debe prevenir que se asigne un casillero que ya está ocupado sin liberarlo primero.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)
Actualización parcial de la entidad.
* **Endpoint**: `PATCH /api/v1/lockers/:id`
* **Request Body** (`UpdateLockerRequest`):
```ts
{
    number?: number;
    location?: string;
    status?: 'Available' | 'Occupied' | 'Maintenance';
    member_id?: string | null;
}

### Componentes de Arquitectura Hexagonal

1. Puerto: LockerRepository (Interface en el Dominio).
2. Caso de Uso: UpdateLocker (Lógica que valida el estado "Maintenance" y reglas de asignación antes de llamar al repositorio).
3. Adaptador de Salida: PostgresLockerRepository (Implementación real en BD usando Prisma).
4. Adaptador de Entrada: LockerController (Ruta HTTP PATCH).

## Casos de Borde y Errores

| Escenario                      | Resultado Esperado                                           | Código HTTP actual        |
| ------------------------------ | ------------------------------------------------------------ | ------------------------- |
| Casillero inexistente          | Mensaje: "El casillero no existe"                            | 400 Bad Request           |
| Asignar si es "Maintenance"    | Mensaje: "No se puede asignar un casillero en mantenimiento" | 400 Bad Request           |
| Asignar casillero ya ocupado   | Mensaje: "El casillero ya está asignado a otro socio"        | 409 Conflict              |
| Socio inexistente              | Mensaje: "El socio referenciado no existe"                   | 400 Bad Request           |
| Error de conexión a DB         | Mensaje: error del motor de base de datos                    | 400 Bad Request           |
| Modificación exitosa           | Retorna los datos del casillero actualizado                  | 200 OK                    |

## Plan de Implementación

1. Actualizar las interfaces en el paquete @alentapp/shared (UpdateLockerRequest).
2. Ampliar el LockerRepository con el método update.
3. Implementar la lógica en UpdateLockerUseCase utilizando el LockerValidator para bloquear asignaciones indebidas.
4. Crear la ruta PATCH en el controlador y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el servicio de Frontend y reutilizar el modal de creación de casilleros para permitir la edición.



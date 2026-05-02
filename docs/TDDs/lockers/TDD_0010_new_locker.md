---
id: 0010
estado: En revisión
autor: Jeronimo Molina
fecha: 2026-05-01
titulo: Alta de Casilleros (Locker)
---

# TDD-0010: Alta de Casilleros (Locker)

## Contexto de Negocio (PRD)

### Objetivo
Permitir a la administración del club registrar nuevos casilleros físicos en el sistema para ampliar el inventario disponible en los vestuarios.

### User Persona
* **Nombre**: Maximliano (Administrativo / Encargado de Vestuarios).
* **Necesidad**: Ingresar nuevos casilleros al sistema indicando su número y ubicación, asegurándose de no duplicar números existentes.

### Criterios de Aceptación
* El sistema debe permitir registrar un nuevo casillero con un número y ubicación.
* El sistema debe garantizar que el número de casillero (`number`) sea único en todo el club.
* Por defecto, el estado de un casillero recién creado debe ser "Available" (Disponible) y no debe tener un socio asignado.

## Diseño Técnico (RFC)

### Modelo de Datos
Se creará la entidad `Locker` en el esquema de Prisma (`schema.prisma`):
* `id`: UUID (PK).
* `number`: Int (Único / @unique).
* `location`: String.
* `status`: Enum ('Available', 'Occupied', 'Maintenance') con default en 'Available'.
* `member_id`: UUID (FK a Member, Nullable).

### Contrato de API (@alentapp/shared)
Definición de DTOs en el paquete compartido para asegurar el tipado entre frontend y backend.
* **Endpoint**: `POST /api/v1/lockers`
* **Request Body** (`CreateLockerRequest`):
```ts
{
    number: number;
    location: string;
}

### Componentes de Arquitectura Hexagonal
1. Puerto: LockerRepository (Interface en el Dominio).
2. Caso de Uso: CreateLocker (Lógica que verifica si el número de casillero ya existe antes de llamar al repositorio y asigna el estado 'Available' por defecto).
3. Adaptador de Salida: PostgresLockerRepository (Implementación real en BD usando Prisma).
4. Adaptador de Entrada: LockerController (Ruta HTTP POST).

## Casos de Borde y Errores

| Escenario                      | Resultado Esperado                                           | Código HTTP actual        |
| ------------------------------ | ------------------------------------------------------------ | ------------------------- |
| Crear con número duplicado     | Mensaje: "El número de casillero ya se encuentra registrado" | 409 Conflict              |
| Faltan datos requeridos        | Mensaje: "El número y la ubicación son obligatorios"         | 400 Bad Request           |
| Error de conexión a DB         | Mensaje: error del motor de base de datos                    | 500 Internal Server Error |
| Creación exitosa               | Retorna los datos del nuevo casillero                        | 201 Created               |

## Plan de Implementación

1. Definir esquema de persistencia (`Locker`) y correr migración.
2. Crear tipos en shared (`CreateLockerRequest`) y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso (`CreateLocker`).
4. Crear formulario de alta en React y conectar con el endpoint POST del backend.
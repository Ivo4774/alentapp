---
id: 0010
estado: En revisión
autor: Jeronimo Molina
fecha: 2026-05-09
titulo: Crear Locker
---

# TDD-0010: Crear Locker

## Contexto de Negocio (PRD)

### Objetivo
Permitir a la administración registrar nuevos casilleros físicos en el sistema para ampliar el inventario de los vestuarios. Asegura que no existan casilleros duplicados en el club.

### User Persona
* **Nombre**: Maximiliano (Rol: Administrativo / Encargado de Vestuarios)
* **Necesidad**: Ingresar manualmente al sistema los nuevos casilleros que el club compra, indicando su número exacto y su ubicación.

### Criterios de Aceptacion
* El sistema debe permitir registrar un nuevo casillero requiriendo obligatoriamente un número y una ubicación.
* El número de casillero (`number`) debe ser ingresado manualmente (no autogenerado) y el sistema debe garantizar que sea único.
* Por defecto, el estado de un casillero recién creado debe ser "Available" y no debe estar vinculado a ningún socio.

---

## Diseno Tecnico (RFC)

### Modelo de Datos
Se utiliza la entidad `Locker`:
* `id`: String — Identificador unico universal (UUID).
* `number`: Int — Número identificador del casillero (Único, ingresado manualmente, no autoincremental).
* `location`: String — Ubicación física dentro del club.
* `status`: String — Estado actual del casillero (Valores: Available | Occupied | Maintenance).
* `member_id`: String — Relacion con el socio al que pertenece el registro (Nullable).

### Contrato de API (@alentapp/shared)

* **Endpoint**: `POST /api/v1/lockers`

*  **Request Body**:
```ts
{
  number: number,  
  location: string  
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
*   **Domain**: Entidad Locker e interfaz LockerRepository (Puerto) con el método create necesario para esta operacion.
*   **Application**: CreateLockerUseCase. Orquesta la creación verificando primero que el número ingresado no exista ya en la base de datos, y luego asigna el estado inicial 'Available' antes de llamar al repositorio.
*   **Infrastructure**: PostgresLockerRepository que implementa el puerto usando Prisma, y LockerController que recibe el request HTTP POST, extrae el body y delega en el caso de uso.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Codigo HTTP |
| --------- | ------------------ | ----------- |
| Falta número o ubicación | Mensaje: "El número y la ubicación son obligatorios" | 400 Bad Request |
| El número de casillero ya existe | Mensaje: "El número de casillero ya se encuentra registrado" | 409 Conflict |
| Error de conexion a la base de datos | Mensaje: "Error interno, por favor intente mas tarde" | 500 Internal Server Error |

--- 

## Plan de Implementacion
1.  Definir los tipos `CreateLockerRequest` y `LockerResponse` en `@alentapp/shared`.
2.  Definir el modelo `Locker` en schema.prisma asegurando que number tenga la restricción @unique y no sea autoincremental. Correr la migracion con npx prisma migrate dev --name create_locker.
3.  Definir la interfaz `LockerRepository` en la capa de Dominio con el metodo create.
4.  Implementar `CreateLockerUseCase` con la validacion de unicidad del número.
5.  Implementar el metodo correspondiente en `PostgresLockerRepository`.
6.  Crear el endpoint POST en `LockerController` y registrarlo en el router de Fastify.
7.  Integrar la llamada en el Frontend creando el formulario de alta y actualizar la vista correspondiente.
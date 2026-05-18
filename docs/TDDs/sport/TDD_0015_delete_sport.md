---
id: 0015
estado: Propuesto
autor: Ariel Cayo
fecha: 2026-05-01
titulo: Eliminar Sport
---

# TDD-0015: Eliminar Sport

## Contexto de Negocio (PRD)

### Objetivo
Dar de baja una disciplina deportiva del catálogo del club, eliminándola permanentemente del sistema si ya no se ofrece.

### User Persona
* **Nombre**: Ariel (Administrativo)
* **Necesidad**: Eliminar un deporte obsoleto o mal cargado de la grilla. Requiere una advertencia visual en la interfaz antes de borrar para no cometer equivocaciones.

### Criterios de Aceptacion
* El sistema debe validar que el deporte exista antes de intentar borrarlo.
* El sistema debe realizar un borrado físico (hard delete) de la base de datos.
* La operación debe responder sin contenido en el body de éxito.

---

## Diseno Tecnico (RFC)

### Modelo de Datos
Eliminación física del registro en la tabla `Sport` mediante su identificador. No se altera la estructura, solo se actúa sobre:
* `id`: String — Identificador único universal (UUID).

### Contrato de API (@alentapp/shared)

* **Endpoint**: `DELETE /api/v1/sports/:id`

* **Request Body**:
*(No Necesario)*

* **Response Body**:
*(No aplica - 204 No Content - Se relizo con exito pero no hay nada para mostrar)*

### Componentes de Arquitectura Hexagonal
* **Domain**: Interfaz `SportRepository` (Puerto) con el método `delete`.
* **Application**: `DeleteSportUseCase`. Verifica la existencia del recurso previo al borrado.
* **Infrastructure**: `PostgresSportRepository` que ejecuta la eliminación en BD, y `SportController` que maneja el request HTTP DELETE.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Codigo HTTP |
| --------- | ------------------ | ----------- |
| Deporte inexistente | Mensaje: "El deporte no existe" | 404 Not Found |
| Error de conexión a la base de datos | Mensaje: "Error interno, por favor intente mas tarde" | 500 Internal Server Error |

---

## Plan de Implementacion
1.  Actualizar la interfaz `SportRepository` en la capa de Dominio con el método `delete`.
2.  Implementar `DeleteSportUseCase` para manejar la existencia previa del recurso.
3.  Implementar el borrado físico (`delete` de Prisma) en `PostgresSportRepository`.
4.  Crear el endpoint DELETE en `SportController` (retornando status 204) y registrarlo en Fastify.
5.  Implementar el borrado en el Frontend, agregando confirmación visual antes de disparar el endpoint.
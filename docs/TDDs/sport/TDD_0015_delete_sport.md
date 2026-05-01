---
id: 0015
estado: Propuesto
autor: Ariel Cayo
fecha: 2026-05-01
titulo: Eliminación de Deportes Existentes
---

# TDD-0015: Eliminación de Deportes Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos dar de baja permanentemente una disciplina deportiva que ya no se dictará en el club, para mantener limpio el catálogo de actividades.

### User Persona

- Nombre: Ariel (Administrativo).
- Necesidad: Eliminar un deporte obsoleto de la grilla. Requiere una advertencia visual antes de borrar para no cometer equivocaciones.

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita antes de proceder con el borrado.
- El sistema debe validar que el deporte exista antes de intentar borrarlo.
- El sistema debe realizar un borrado físico de la base de datos.
- Si el borrado es exitoso, la tabla en el frontend debe actualizarse automáticamente.

## Diseño Técnico (RFC)

### Modelo de Datos

Eliminación física del registro en la tabla Sport mediante su identificador.

- `id`: Identificador único universal (UUID).

### Contrato de API (@alentapp/shared)

Al tratarse de una operación destructiva, no se envía cuerpo en la petición HTTP.

- Endpoint: DELETE /api/v1/sports/:id
- Request Body: None
- Response: 204 No Content en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. Puerto: SportRepository (Método delete).
2. Caso de Uso: DeleteSportUseCase (Comprueba existencia previa y delega la eliminación).
3. Adaptador de Salida: PostgresSportRepository (Eliminación en BD).
4. Adaptador de Entrada: SportController (Ruta HTTP que devuelve status 204).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Deporte inexistente        | Mensaje: "El deporte no existe"               | 404 Not Found             |
| Deporte con inscriptos     | Mensaje: "No se puede borrar un deporte en uso"| 409 Conflict              |
| Error de conexión a DB     | Mensaje: error del motor de base de datos     | 500 Internal Server Error |
| Eliminación exitosa        | Respuesta vacía                               | 204 No Content            |

## Plan de Implementación

1. Ampliar el repositorio con el método delete.
2. Crear la lógica de negocio en el caso de uso.
3. Crear el endpoint DELETE en el controlador.
4. Añadir el método delete al servicio Frontend.
5. Enlazar el botón de eliminación en la vista agregando confirmación.
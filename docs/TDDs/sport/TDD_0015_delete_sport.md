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

Dar de baja una disciplina deportiva. Para proteger la integridad histórica, el sistema solo permitirá el borrado si no existen registros de inscripción (Enrollment) asociados, garantizando que no se pierda la trazabilidad de la facturación de los socios.

### User Persona

- Nombre: Ariel (Administrativo).
- Necesidad: Eliminar un deporte obsoleto de la grilla. Requiere una advertencia visual antes de borrar para no cometer equivocaciones.

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita antes de proceder con el borrado.
- El sistema debe validar que el deporte exista antes de intentar borrarlo.
- Regla de Negocio: El sistema no puede eliminar un deporte que tenga inscriptos porque se considera en uso, el sistema debe rechazar la eliminación si existen registros en la entidad Enrollment asociados al deporte.
- El sistema debe realizar un borrado físico de la base de datos solo si pasa las validaciones anteriores.
- Si el borrado es exitoso, la tabla en el frontend debe actualizarse automáticamente.

## Diseño Técnico (RFC)

### Modelo de Datos

Eliminación física del registro en la tabla Sport mediante su identificador.

- `id`: Identificador único universal (UUID).

### Contrato de API (@alentapp/shared)

Al tratarse de una operación destructiva, no se envía cuerpo en la petición HTTP.

- Endpoint: `DELETE /api/v1/sports/:id`
- Request Body: None
- Response: 204 No Content en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. Puerto: SportRepository (Método delete).
2. Caso de Uso: DeleteSportUseCase (Comprueba existencia previa, verifica la tabla de Enrollments y delega la eliminación).
3. Adaptador de Salida: PostgresSportRepository (Eliminación en BD).
4. Adaptador de Entrada: SportController (Ruta HTTP que devuelve status 204).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Deporte inexistente        | Mensaje: "El deporte no existe"               | 404 Not Found             |
| Deporte con inscriptos     | Mensaje: "No se puede borrar deporte en uso"  | 409 Conflict              |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |
| Eliminación exitosa        | Respuesta vacía                               | 204 No Content            |

## Plan de Implementación

1. Implementar DeleteSportUseCase en la capa Application verificando relaciones.
2. Asegurar que el adaptador de infraestructura realice el borrado físico (DELETE) en la base de datos.
3. Exponer el endpoint DELETE en el controlador.
---
id: 0009
estado: Propuesto
autor: Ivo Alejandro Balduzzi Hojman
fecha: 2026-04-30
titulo: Eliminación de Certificado Médico
---

# TDD-0009: Eliminación de Certificado Médico

## Contexto de Negocio (PRD)

### Objetivo

Permitir que los administrativos den de baja definitiva a los registros de certificados médicos que hayan sido cargados por error o que pertenezcan a socios que ya no forman parte de la institución, manteniendo la base de datos limpia y sin basura.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo).
- **Necesidad**: Borrar un certificado que se subió por error a un socio equivocado o eliminar registros antiguos que ya no tienen relevancia legal para el club.

### Criterios de Aceptación

- El sistema debe solicitar una confirmación visual antes de realizar la acción destructiva para evitar borrados accidentales.
- El sistema debe validar que el certificado exista antes de intentar eliminarlo.
- Se realizará un **borrado físico** (hard delete) de la fila en la tabla correspondiente de PostgreSQL.
- Una vez confirmada la eliminación, el registro debe desaparecer de la vista del administrador de forma inmediata.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Al ser una operación que solo requiere identificar el recurso a destruir, no se envía un cuerpo de datos:

- **Endpoint**: `DELETE /api/v1/medical-certificates/:id`
- **Request Body**: `None`
- **Response**: `Empty Body` (Status 204 No Content)

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `MedicalCertificateRepository` (Método `delete(id)` definido en la capa de Dominio).
2. **Caso de Uso**: `DeleteMedicalCertificateUseCase` (Encargado de verificar la existencia del recurso y orquestar la baja).
3. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (Implementación real usando el comando `delete` de Prisma).
4. **Adaptador de Entrada**: `MedicalCertificateController` (Controlador HTTP que recibe la petición y gestiona el flujo hacia el caso de uso).

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
| :--- | :--- | :--- |
| Certificado ya eliminado o inexistente | Mensaje: "No se encontró el registro a eliminar" | 404 Not Found |
| Error de conexión con PostgreSQL | Mensaje : "Error interno del servidor, intente más tarde" | 500 Internal Server Error |
| Intento de borrar sin confirmación | El sistema no debe disparar la petición a la API | N/A |

## Plan de Implementación

1. Agregar el método `delete` a la interfaz del repositorio en el Dominio.
2. Implementar el `DeleteMedicalCertificateUseCase` con las validaciones de existencia previas.
3. Crear el endpoint `DELETE` en el controlador y registrarlo en Fastify.
4. Implementar el método de borrado en el servicio de Frontend (`medical-certificates.ts`).
5. Añadir el botón de eliminar en la tabla de certificados y vincularlo con un modal de confirmación.
---
id: 0008
estado: Propuesto
autor: Ivo Alejandro Balduzzi Hojman
fecha: 2026-04-30
titulo: Actualización de Certificado Médico
---

# TDD_0008_update_medical_certificate: Actualización de Certificado Médico

## Contexto de Negocio (PRD)

### Objetivo
Permitir que el personal administrativo pueda corregir errores en la carga o actualizar la información de un certificado médico (como la matrícula del profesional o las fechas de vigencia) sin necesidad de eliminar el registro, asegurando que la historia clínica del socio en el sistema sea siempre precisa.

### User Persona
*   **Nombre**: Alberto (Tesorero/Administrativo)
*   **Necesidad**: Modificar datos de los certificados rápidamente desde el panel de gestión. Por ejemplo, corregir un error de tipeo en la matrícula del médico o revalidar un certificado cargado previamente que fue invalidado por error.

### Criterios de Aceptación
*   El sistema debe permitir la actualización parcial de los campos: `issue_date`, `expiry_date`, `doctor_license` e `is_validated`.
*   El sistema debe validar que la nueva fecha de vencimiento sea posterior a la de emisión.
*   Si se actualiza un certificado para que sea el vigente (`is_validated: true`), el sistema debe invalidar automáticamente cualquier otro certificado que pertenezca a ese mismo socio.
*   Al finalizar la edición, el sistema debe devolver el objeto con todos los datos actualizados.

## Diseño Técnico (RFC)

### Modelo de Datos
Se trabajará sobre la entidad `MedicalCertificate`:
*   `id`: UUID — Identificador único del certificado.
*   `issue_date`: Date — Fecha de emisión del certificado.
*   `expiry_date`: Date — Fecha de vencimiento de la aptitud física.
*   `doctor_license`: String — Matrícula del profesional médico.
*   `is_validated`: Boolean — Indica si el certificado es el vigente activo.
*   `member_id`: String — Relación con el socio al que pertenece el certificado.

### Contrato de API (@alentapp/shared)
Todos los campos son opcionales para permitir la actualización parcial del recurso.

*   **Endpoint**: `PUT /api/v1/medical-certificates/:id`
*   **Request Body**:
```ts
{
  issue_date?: string,
  expiry_date?: string,
  doctor_license?: string,
  is_validated?: boolean
}
```

### Componentes de Arquitectura Hexagonal
*   **Domain**: Interfaz `MedicalCertificateRepository` con método `update(id, data)` y servicio `MedicalCertificateValidator` con la lógica de validación de fechas y la regla de un solo certificado activo por socio.
*   **Application**: `UpdateMedicalCertificateUseCase`. Orquesta la validación, aplica la lógica de invalidación de registros previos si el certificado se marca como activo, y llama al repositorio.
*   **Infrastructure**: `PostgresMedicalCertificateRepository` que implementa el puerto usando Prisma y `MedicalCertificateController` que extrae el `id` de la URL y mapea las excepciones a códigos de estado HTTP.

## Casos de Borde y Errores
| Escenario                        | Resultado Esperado                                                        | Código HTTP               |
| -------------------------------- | ------------------------------------------------------------------------- | ------------------------- |
| Certificado inexistente          | Mensaje: "No se encontró el certificado solicitado"                       | 404 Not Found             |
| Fecha de vencimiento inválida    | Mensaje: "La fecha de vencimiento debe ser posterior a la de emisión"     | 400 Bad Request           |
| Formato de UUID incorrecto       | Mensaje: "El ID proporcionado no tiene un formato válido"                 | 400 Bad Request           |
| Error de conexión a DB           | Mensaje: "Error interno, por favor intente más tarde"                     | 500 Internal Server Error |

## Plan de Implementación
1.  Actualizar las interfaces en `@alentapp/shared` para incluir `UpdateMedicalCertificateRequest`.
2.  Agregar el método `update` a la interfaz del repositorio y su implementación en infraestructura.
3.  Implementar la lógica de negocio en `UpdateMedicalCertificateUseCase`, manejando la invalidación de certificados previos cuando `is_validated` es `true`.
4.  Crear el endpoint en el controlador y conectarlo al router de Fastify.
5.  Integrar la llamada en el Frontend y asegurar que la tabla se refresque tras editar un certificado.

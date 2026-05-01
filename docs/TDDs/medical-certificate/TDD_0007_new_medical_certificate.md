---
id: 0007
estado: Propuesto
autor: Ivo Alejandro Balduzzi Hojman
fecha: 2026-04-30
titulo: Alta de Certificado Médico
---

# TDD_0007_new_medical_certificate: Alta de Certificado Médico

## Contexto de Negocio (PRD)

### Objetivo
Digitalizar el proceso de recepción de aptitud física de los socios para asegurar que el club cuente con registros vigentes y centralizados, garantizando que un socio no posea más de un certificado activo a la vez para evitar conflictos en la cobertura de salud.

### User Persona
*   **Nombre**: Alberto (Tesorero/Administrativo)
*   **Necesidad**: Cargar los certificados físicos que traen los socios de forma rápida. El sistema debe gestionar automáticamente la vigencia para que Alberto no tenga que buscar y dar de baja certificados viejos manualmente.

### Criterios de Aceptación
*   El sistema debe permitir registrar la fecha de emisión, la fecha de vencimiento y la matrícula del médico.
*   Solo puede haber un certificado activo (`is_validated: true`) por socio.
*   Al finalizar la carga de un nuevo certificado, el sistema debe buscar certificados previos del mismo socio e invalidarlos (setear `is_validated: false`) de forma automática.

## Diseño Técnico (RFC)

### Modelo de Datos
Se utiliza la entidad `MedicalCertificate`:
*   `id`: UUID — Identificador único universal.
*   `issue_date`: Date — Fecha de emisión del certificado.
*   `expiry_date`: Date — Fecha de vencimiento de la aptitud física.
*   `doctor_license`: String — Matrícula del profesional médico.
*   `is_validated`: Boolean — Indica si el certificado es el vigente activo.
*   `member_id`: String — Relación con el socio al que pertenece el certificado.

### Contrato de API (@alentapp/shared)
*   **Endpoint**: `POST /api/v1/medical-certificates`
*   **Request Body**:
```ts
{
  issue_date: string,
  expiry_date: string,
  doctor_license: string,
  member_id: string
}
```

### Componentes de Arquitectura Hexagonal
*   **Domain**: Entidad `MedicalCertificate` e interfaz `MedicalCertificateRepository` (Puerto).
*   **Application**: `CreateMedicalCertificateUseCase`. Orquesta la invalidación de certificados previos y la creación del nuevo registro.
*   **Infrastructure**: `MedicalCertificateController` que recibe el DTO HTTP y `PostgresMedicalCertificateRepository` que implementa el puerto usando Prisma.

## Casos de Borde y Errores
| Escenario                                      | Resultado Esperado                                  | Código HTTP             |
| ---------------------------------------------- | --------------------------------------------------- | ----------------------- |
| Fecha de vencimiento anterior a la de emisión  | Mensaje: "La fecha de vencimiento es inválida"      | 400 Bad Request         |
| Certificado con fecha de vencimiento ya pasada | Mensaje: "No se puede cargar un certificado vencido"| 400 Bad Request         |
| El socio no existe en el sistema               | Mensaje: "Socio no encontrado"                      | 404 Not Found           |
| Error de conexión a la base de datos           | Mensaje: "Error interno del servidor"               | 500 Internal Server Error |

## Plan de Implementación
1.  Definir el modelo `MedicalCertificate` en `schema.prisma` sin restricciones de integridad referencial y generar la migración.
2.  Crear los tipos `CreateMedicalCertificateRequest` y `MedicalCertificateResponse` en `@alentapp/shared`.
3.  Definir el puerto `MedicalCertificateRepository` en la capa de Dominio.
4.  Implementar `CreateMedicalCertificateUseCase` con la lógica de invalidación de registros previos.
5.  Implementar `PostgresMedicalCertificateRepository` con Prisma.
6.  Implementar `MedicalCertificateController` con la ruta HTTP.
7.  Crear el formulario de carga en el Frontend.

---
id: 0014
estado: Propuesto
autor: Ariel Cayo
fecha: 2026-05-01
titulo: Actualización de Deportes Existentes
---

# TDD-0014: Actualización de Deportes Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos modificar la información operativa de un deporte existente, respetando estrictamente la regla de negocio que limita la edición únicamente a su descripción y capacidad.

### User Persona

- Nombre: Ariel (Administrativo).
- Necesidad: Modificar rápidamente la cantidad de cupos disponibles de un deporte o actualizar su detalle, sin tener permisos para alterar precios, requisitos o el nombre original.

### Criterios de Aceptación

- El sistema debe impedir la modificación del atributo name una vez que el deporte ha sido creado.
- Según las reglas de negocio, el sistema **solo** debe permitir la edición de los campos description (descripción) y max_capacity (cupo). Los demás atributos son inmutables.
- El sistema debe validar que si se actualiza el max_capacity, este siga siendo mayor a cero.
- Si la edición es correcta, debe retornar los datos actualizados.

## Diseño Técnico (RFC)

### Modelo de Datos

Actualización parcial estrictamente limitada a dos campos en la entidad Sport:

- `description`: Cadena de texto (opcional).
- `max_capacity`: Entero, debe ser mayor a 0 (opcional).

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. Los campos name, additional_price y requires_medical_certificate se excluyen intencionalmente del tipo por reglas del dominio.

- Endpoint: `PUT /api/v1/sports/:id`
- Request Body (UpdateSportRequest):
```ts
{
    description?: string;
    max_capacity?: number;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: SportRepository (Método update).
2. Servicio de Dominio: SportValidator (Asegura que solo ingresen los campos permitidos y verifica que el cupo sea > 0).
3. Caso de Uso: UpdateSportUseCase (Orquesta la validación y llama al repositorio).
4. Adaptador de Salida: PostgresSportRepository (Actualización en BD).
5. Adaptador de Entrada: SportController (Ruta HTTP).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Deporte inexistente        | Mensaje: "El deporte no existe"               | 404 Not Found             |
| Intento de modificar name  | Mensaje: "El nombre del deporte es inmutable" | 400 Bad Request           |
| Envío de campos no válidos | Se ignoran los campos (precio/certificado)    | 200 OK / 400 Bad Request  |
| Capacidad en 0 o negativa  | Mensaje: "La nueva capacidad debe ser > 0"    | 400 Bad Request           |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en el paquete shared restringiendo los campos.
2. Ampliar el repositorio con el método update.
3. Implementar la lógica en el caso de uso forzando las validaciones de exclusividad de campos.
4. Crear la ruta PUT en el controlador.
5. Consumir el endpoint desde el frontend para permitir la edición.
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

Permitir a los administrativos modificar la información operativa de un deporte existente, respetando estrictamente la regla de inmutabilidad sobre su nombre.

### User Persona

- Nombre: Ariel (Administrativo).
- Necesidad: Modificar rápidamente la cantidad de cupos disponibles de un deporte que tiene mucha demanda, sin alterar los registros históricos asociados al nombre.

### Criterios de Aceptación

- El sistema debe impedir la modificación del atributo name.
- Lógica de Integridad: Si se modifica el max_capacity, el nuevo valor debe ser mayor a 0 Y mayor o igual a la cantidad de socios ya inscriptos en el deporte.
- El sistema solo permite la edición de los atributos `description` y `max_capacity`. Cualquier intento de enviar otros campos (como precio) debe ser ignorado o rechazado por el servidor.
- Si la edición es correcta, debe retornar los nuevos datos actualizados.

## Diseño Técnico (RFC)

### Modelo de Datos

Actualización parcial de campos en la entidad Sport:

- `description`: Cadena de texto (opcional).
- `max_capacity`: Entero, debe ser mayor a 0 y mayor o igual a los inscriptos actuales (opcional).

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. El campo name se excluye intencionalmente.

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
2. Servicio de Dominio: SportValidator (Asegura exclusión de campos no permitidos y verifica capacidad básica).
3. Caso de Uso: UpdateSportUseCase (Orquesta validación, consulta inscriptos actuales al repositorio y guarda cambios).
4. Adaptador de Salida: PostgresSportRepository (Actualización en BD).
5. Adaptador de Entrada: SportController (Ruta HTTP).

## Casos de Borde y Errores

| Escenario                    | Resultado Esperado                            | Código HTTP               |
| ---------------------------- | --------------------------------------------- | ------------------------- |
| Deporte inexistente          | Mensaje: "El deporte no existe"               | 404 Not Found             |
| Intento de modificar name    | Mensaje: "El nombre del deporte es inmutable" | 400 Bad Request           |
| Capacidad en 0 o negativa    | Mensaje: "La nueva capacidad debe ser > 0"    | 400 Bad Request           |
| Capacidad menor a inscriptos | Mensaje: "Cupo menor a inscriptos actuales"   | 409 Conflict              |
| Envío de campos no válidos   | Mensaje: "Error de campos extra"    | 400 Bad Request           |
| Error de conexión a DB       | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Definir UpdateSportRequest en @alentapp/shared excluyendo el campo name y adicionales.
2. Agregar el caso de uso UpdateSportUseCase en la capa Application, incluyendo la lógica de conteo de inscriptos.
3. Exponer el endpoint PUT en el controlador para guardar los cambios.
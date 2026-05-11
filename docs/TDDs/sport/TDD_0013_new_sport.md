---
id: 0013
estado: Propuesto
autor: Ariel Cayo
fecha: 2026-05-01
titulo: Crear Sport
---

# TDD-0013: Crear Sport

## Contexto de Negocio (PRD)

### Objetivo
Permitir que un administrativo pueda dar de alta nuevas disciplinas deportivas en la oferta del club, estableciendo sus cupos, precios y requisitos médicos iniciales.

### User Persona
* **Nombre**: Ariel (Rol: Administrativo)
* **Necesidad**: Configurar rápidamente un nuevo deporte disponible para la temporada, asegurándose de que los cupos y requisitos médicos queden bien establecidos.

### Criterios de Aceptacion
* El sistema debe validar que el nombre del deporte sea único e inmutable tras su creación.
* El sistema debe validar obligatoriamente que el cupo máximo sea mayor a cero.
* El precio adicional (`additional_price`) debe ser igual o mayor a 0 (no se admiten valores negativos).
* El sistema debe permitir definir si el deporte requiere certificado médico mediante el campo `requires_medical_certificate`.
* Al finalizar, el sistema debe persistir la entidad y devolver el registro creado.

---

## Diseno Tecnico (RFC)

### Modelo de Datos
Se utiliza la entidad `Sport`:
* `id`: String — Identificador único universal (UUID).
* `name`: String — Cadena de texto, único e inmutable.
* `description`: String — Cadena de texto con el detalle del deporte.
* `max_capacity`: Int — Número entero, debe ser mayor a 0.
* `additional_price`: Float — Número decimal, no negativo.
* `requires_medical_certificate`: Boolean — Indica si la disciplina exige apto físico.

### Contrato de API (@alentapp/shared)

* **Endpoint**: `POST /api/v1/sports`

* **Request Body**:
```ts
{
  name: string,
  description: string,
  max_capacity: number,
  additional_price: number,
  requires_medical_certificate: boolean
}
```

* **Response Body**:
```ts
{
  id: string,
  name: string,
  description: string,
  max_capacity: number,
  additional_price: number,
  requires_medical_certificate: boolean
}
```

### Componentes de Arquitectura Hexagonal
* **Domain**: Entidad `Sport` e interfaz `SportRepository` (Puerto) con el método para crear el registro.
* **Application**: `CreateSportUseCase`. Orquesta la lógica de validación (capacidad mayor a 0, precio no negativo, unicidad de nombre) y llama al repositorio.
* **Infrastructure**: `PostgresSportRepository` que implementa el puerto usando Prisma, y `SportController` que recibe el request HTTP POST y delega en el caso de uso.

---

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Codigo HTTP |
| --------- | ------------------ | ----------- |
| Capacidad en 0 o negativa | Mensaje: "El cupo debe ser mayor a cero" | 400 Bad Request |
| Precio adicional negativo | Mensaje: "El precio no puede ser negativo" | 400 Bad Request |
| Nombre ya registrado | Mensaje: "Ya existe un deporte con ese nombre" | 409 Conflict |
| Error de conexión a la base de datos | Mensaje: "Error interno, por favor intente mas tarde" | 500 Internal Server Error |
| Creacion exitosa | Retorna el objeto del deporte creado | 201 Created |

---

## Plan de Implementacion
1.  Definir los tipos `CreateSportRequest` y `SportResponse` en `@alentapp/shared`.
2.  Definir el modelo `Sport` en `schema.prisma` y correr la migración con `npx prisma migrate dev --name create_sport`.
3.  Definir la interfaz `SportRepository` en la capa de Dominio con el método `create`.
4.  Implementar `CreateSportUseCase` con las validaciones correspondientes.
5.  Implementar el método correspondiente en `PostgresSportRepository`.
6.  Crear el endpoint POST en `SportController` y registrarlo en el router de Fastify.
7.  Integrar la llamada en el Frontend para el formulario de alta.
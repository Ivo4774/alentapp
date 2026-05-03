---
id: 0013
estado: Propuesto
autor: Ariel Cayo
fecha: 2026-05-01
titulo: Registro de Nuevos Deportes
---

# TDD-0013: Registro de Nuevos Deportes

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo pueda dar de alta nuevas disciplinas deportivas en la oferta del club, estableciendo sus cupos, precios y requisitos médicos iniciales.

### User Persona

- Nombre: Ariel (Administrativo).
- Necesidad: Configurar rápidamente un nuevo deporte disponible para la temporada, asegurándose de que los cupos y requisitos médicos queden bien establecidos.

### Criterios de Aceptación

- El sistema debe validar que el nombre del deporte sea único e inmutable tras su creación.
- El sistema debe validar obligatoriamente que el cupo máximo sea mayor a cero.
- Validación de Negocio: El precio adicional (additional_price) debe ser igual o mayor a 0 (no se admiten valores negativos).
- El sistema debe permitir definir si el deporte requiere certificado médico mediante el boolean `requires_medical_certificate`.
- Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad Sport con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `name`: Cadena de texto, único e inmutable.
- `description`: Cadena de texto.
- `max_capacity`: Entero, debe ser mayor a 0.
- `additional_price`: Número decimal, no negativo (mayor o igual a 0).
- `requires_medical_certificate`: Booleano.

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/sports`
- Request Body (CreateSportRequest):
```ts
{
    name: string;
    description: string;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: SportRepository (Interface en el Dominio).
2. Caso de Uso: CreateSportUseCase (Lógica que verifica capacidad, precio no negativo y unicidad del nombre).
3. Adaptador de Salida: PostgresSportRepository (Implementación real en BD).
4. Adaptador de Entrada: SportController (Ruta HTTP).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Nombre ya registrado       | Mensaje: "Ya existe un deporte con ese nombre"| 409 Conflict              |
| Capacidad en 0 o negativa  | Mensaje: "El cupo debe ser mayor a cero"      | 400 Bad Request           |
| Precio adicional negativo  | Mensaje: "El precio no puede ser negativo"    | 400 Bad Request           |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |
| Creación exitosa           | Retorna el objeto del deporte creado          | 201 Created               |

## Plan de Implementación

1. Definir CreateSportRequest y SportResponse en @alentapp/shared.
2. Implementar lógica de validación de capacidad y precio en la entidad Sport (Domain).
3. Implementar el caso de uso CreateSportUseCase y su puerto de salida.
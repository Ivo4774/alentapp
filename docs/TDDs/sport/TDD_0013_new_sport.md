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

- Nombre: Arriel (Administrativo).
- Necesidad: Configurar rápidamente un nuevo deporte disponible para la temporada, asegurándose de que los cupos y requisitos médicos queden bien establecidos.

### Criterios de Aceptación

- El sistema debe validar que el nombre del deporte sea único en la base de datos.
- El sistema debe validar obligatoriamente que el cupo máximo sea un valor numérico mayor a cero.
- Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario.
- El deporte debe quedar habilitado inmediatamente tras su creación.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Sport` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `name`: Cadena de texto, único e inmutable.
- `description`: Cadena de texto.
- `max_capacity`: Entero, debe ser mayor a 0.
- `additional_price`: Número decimal.
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
2. Caso de Uso: CreateSportUseCase (Lógica que verifica que la capacidad sea mayor a 0 y si el nombre ya existe).
3. Adaptador de Salida: PostgresSportRepository (Implementación real en BD).
4. Adaptador de Entrada: SportController (Ruta HTTP).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Nombre ya registrado       | Mensaje: "Ya existe un deporte con ese nombre"| 409 Conflict              |
| Capacidad en 0 o negativa  | Mensaje: "El cupo debe ser mayor a cero"      | 400 Bad Request           |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |
| Creación exitosa           | Retorna el objeto del deporte creado          | 201 Created               |

## Plan de Implementación

1. Definir esquema de persistencia y correr migración.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso.
4. Crear formulario en React y conectar con el endpoint del backend.
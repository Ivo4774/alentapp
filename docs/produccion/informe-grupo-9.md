# Informe Técnico: Implementación de Producción y Observabilidad

## 1. Resumen 
El presente documento detalla las métricas de rendimiento y la huella de infraestructura resultantes de la implementación del entorno de producción. Las mejoras introducidas se centran en la optimización de contenedores mediante *Multi-stage Builds*, el establecimiento de límites de recursos y la integración de un ecosistema de observabilidad basado en el modelo de métricas RED (Rate, Errors, Duration).

---

## 2. Optimización de Infraestructura (Antes y Después)

La aplicación del patrón *Multi-stage Build* ha permitido segregar los entornos de compilación de los entornos de ejecución, descartando dependencias de desarrollo y mitigando vulnerabilidades. A continuación, se detalla el impacto volumétrico exacto en los artefactos generados:

### 2.1. Tamaño de Imágenes Docker
| Servicio | Tamaño Previo (Desarrollo) | Tamaño Final (Producción) | Porcentaje de Reducción |
| :--- | :--- | :--- | :--- |
| **API (Backend)** | [~406 MB]  | **[~165 MB]** | **[-59.3%]** |
| **Web (Frontend)** | [~221 MB] | **[~26 MB]** | **[-96.2%]** |

### 2.2. Consumo de Memoria RAM
Gracias al aislamiento de recursos y a la eliminación de procesos secundarios (como servidores de desarrollo tipo *nodemon* o *Vite HMR*), la huella de memoria en el servidor *host* se ha reducido significativamente:
* **Consumo Base Promedio (API):** [36 MB] 
* **Consumo Máximo Bajo Estrés (API):** [40.5 MB]

---

## 3. Rendimiento y Telemetría (Métricas RED)

Se ha ejecutado una prueba de estrés iterativa inyectando tráfico concurrente hacia los *endpoints* principales de la plataforma para poblar el *dashboard* de telemetría.

### 3.1. Tiempos de Respuesta (Duration)
* **Percentil 95 (p95):** El 95% de las solicitudes se resuelven en **[20 ms]** o menos.
* **Comportamiento bajo carga:** El sistema mantuvo estabilidad sin degradación severa durante la inyección continua de tráfico.

### 3.2. Tasas y Errores (Rate & Errors)
* **Tasa de éxito:** Durante la prueba, la tasa de disponibilidad (solicitudes respondidas con código 2xx) se mantuvo en el **[59.6%]**.
* **Gestión de fallos:** Los códigos 4xx y 5xx forzados fueron capturados y tabulados correctamente por el sistema de observabilidad.

---

## 4. Deuda Técnica y Oportunidades de Mejora

* **Instrumentación Semántica:** Durante el despliegue del sistema de telemetría, se detectó que el auto-instrumentador genérico HTTP predomina sobre la instrumentación específica del *framework* subyacente. Como medida de contingencia, los paneles analíticos de cuellos de botella ("Top 5 Endpoints Lentos") se han configurado temporalmente para agrupar las métricas bajo la dimensión `http_method`.

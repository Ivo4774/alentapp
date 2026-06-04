# Fase 1: Analizar y proponer

## 1.1. Analizar la infraestructura Docker actual

Tras analizar los archivos de configuración Docker (`docker-compose.yml`, `packages/api/Dockerfile` y `packages/web/Dockerfile`), se identificaron los siguientes 5 problemas o vulnerabilidades respecto a buenas prácticas de producción:

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|---|---|---|
| **Contraseñas y variables sensibles hardcodeadas** | `docker-compose.yml:7` y `30` | Alto | Eliminar los valores hardcodeados de la base de datos y la URL. Utilizar un archivo `.env` pasándolas mediante variables de entorno. |
| **Uso de servidores de desarrollo en lugar de código compilado** | `docker-compose.yml:35-38`, `packages/web/Dockerfile:16` | Alto | Compilar el código. Usar `node build/app.js` para la API y configurar Nginx para servir los archivos estáticos del frontend. |
| **Ejecución de los contenedores como usuario `root`** | `packages/api/Dockerfile:22`, `packages/web/Dockerfile:16` | Alto | Configurar un usuario sin privilegios. Agregar la instrucción `USER node` (o un usuario creado específicamente) antes de iniciar la aplicación. |
| **Imágenes pesadas y con dependencias de desarrollo** | `packages/api/Dockerfile:12`, `packages/web/Dockerfile:8` | Medio | Implementar *Multi-stage builds*. Instalar solo dependencias de producción (`npm ci --omit=dev`) y excluir el código fuente original en la imagen final. |
| **Falta de límites de recursos (CPU y Memoria)** | `docker-compose.yml` (en todos los servicios) | Medio | Configurar la sección `deploy.resources.limits` especificando topes de CPU y memoria para prevenir que un contenedor agote los recursos del host. |

## 1.2. Investigar OpenTelemetry

**¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?**
OpenTelemetry es un framework de observabilidad de código abierto (un conjunto de APIs, SDKs y herramientas) diseñado para instrumentar, generar, recolectar y exportar datos de telemetría (métricas, logs y trazas) de manera estandarizada y agnóstica al proveedor. La diferencia principal es que OpenTelemetry **solo se encarga de la recolección y exportación** de los datos; no ofrece bases de datos para almacenarlos ni interfaces para visualizarlos. En cambio, Prometheus es un sistema completo que incluye **almacenamiento de series temporales**, un motor de consultas (PromQL) y un sistema de alertas.

**¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?**
Los tres pilares de la observabilidad son:
1. **Métricas:** Datos numéricos agregados a lo largo del tiempo (ej. uso de CPU, cantidad de peticiones).
2. **Trazas (Traces):** El recorrido y tiempo que toma una petición individual a través de distintos microservicios.
3. **Logs:** Registros detallados de eventos específicos en formato de texto.
OpenTelemetry **aborda los tres pilares** en un estándar único e integrado, permitiendo recolectar los tres tipos de señales.

**Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?**
El método RED es un enfoque centrado en el usuario para monitorizar servicios:
- **Rate (Tasa):** Número de peticiones por segundo. Sirve para medir el volumen de tráfico que está recibiendo el servicio.
- **Errors (Errores):** Cantidad de peticiones fallidas. Sirve para detectar rápidamente si el servicio está roto o rechazando tráfico de usuarios.
- **Duration (Duración):** El tiempo o latencia que tarda en procesarse una petición. Sirve para medir el rendimiento y garantizar una buena experiencia al usuario (que el sistema responda rápido).

**¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?**
OTLP es el protocolo de comunicación estándar y nativo de OpenTelemetry para enviar métricas, trazas y logs de manera eficiente. Su ventaja principal es el **desacoplamiento**: al usar OTLP para enviar los datos a un "OpenTelemetry Collector", la aplicación no necesita saber qué sistema final se utilizará. El colector puede encargarse de transformar y exportar esos datos a Prometheus (para métricas) y a otro sistema como Jaeger (para trazas) sin tener que cambiar ni recompilar el código de la aplicación.

**¿Cómo se relaciona OpenTelemetry con Grafana?**
OpenTelemetry genera y exporta los datos de telemetría hacia un backend de almacenamiento (por ejemplo, exporta las métricas a Prometheus). **Grafana es la capa de visualización**. Grafana se conecta a ese backend (Prometheus) para leer las métricas y permitirte crear los dashboards y gráficos para interpretar y analizar fácilmente los datos recolectados por OpenTelemetry.

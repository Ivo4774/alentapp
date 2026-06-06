# Análisis de Infraestructura y Observabilidad

## 1.1. Análisis de la Infraestructura Docker Actual

A continuación, detallo 5 problemas críticos identificados en la configuración actual (orientada a desarrollo) que representan riesgos operativos y de seguridad si fuesen promovidos a un entorno productivo:

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
| :--- | :--- | :--- | :--- |
| **1. Acoplamiento del código fuente mediante Bind Mounts (`volumes: - .:/app`)** | `docker-compose.yml` (servicios `api` y `web`, sección `volumes`) | **Alto** | En producción, el contenedor debe ser un artefacto inmutable y sellado. Se deben eliminar los mapeos de volúmenes locales y, en su lugar, usar la instrucción `COPY` dentro del `Dockerfile` para inyectar el código compilado de forma definitiva en la imagen. |
| **2. Construcción monolítica de la imagen (Falta de Multi-Stage Build)** | `Dockerfile` (uso de una única etapa base `FROM node:20-alpine`) | **Alto** | La imagen final retiene herramientas de compilación y todo el código fuente. Se debe implementar un patrón *Multi-Stage*, separando la instalación (`npm install`), la compilación (`build`) y el empaquetado final (`runtime`) usando `npm ci --omit=dev`, logrando una imagen minúscula y segura. |
| **3. Ejecución implícita con privilegios de Superusuario (Root)** | `Dockerfile` (Ausencia de directiva `USER`) | **Alto** | Los contenedores ejecutan sus procesos como `root` por defecto. Se debe mitigar este vector de ataque inyectando la directiva `USER node` justo antes de la instrucción `CMD` o `ENTRYPOINT`, garantizando que la aplicación corra con los permisos mínimos necesarios. |
| **4. Exposición de secretos en el control de versiones** | `docker-compose.yml` (`DATABASE_URL=postgres://admin:password123@...`) | **Alto** | La inyección de cadenas de conexión hardcodeadas es una vulnerabilidad crítica. Se debe reemplazar por referencias a variables de entorno (`${DATABASE_URL}`) consumidas desde un archivo `.env` seguro que no se suba al repositorio. |
| **5. Riesgo de Inanición de Recursos (Starvation) en el Host** | `docker-compose.yml` (Servicios `db`, `api`, `web`) | **Medio** | Ante un pico de tráfico o un *memory leak*, un contenedor podría consumir toda la RAM/CPU del servidor físico, tirando abajo toda la infraestructura. Se debe implementar la etiqueta `deploy.resources.limits` para contener la huella de hardware de cada servicio. |

---

## 1.2. Investigación de OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?
OpenTelemetry (OTel) es un estándar universal (framework) compuesto por APIs y SDKs que se encarga exclusivamente de instrumentar el código, generar los datos de telemetría y exportarlos. Su filosofía es ser "Agnóstico del Proveedor". 
La gran diferencia radica en su propósito: OpenTelemetry **no almacena datos ni tiene un motor de visualización**. Prometheus, por el contrario, es una Base de Datos de Series Temporales (TSDB) que se encarga de raspar (*scrape*), almacenar esos datos generados, evaluarlos y disparar alertas.

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?
Los pilares fundamentales para entender el estado de un sistema son:
1. **Métricas:** Medidas cuantitativas del sistema en el tiempo (ej. % de CPU, cantidad de peticiones).
2. **Logs:** Registros inmutables y discretos de eventos específicos que ocurrieron en la aplicación.
3. **Trazas (Traces):** La representación del viaje completo de una petición a lo largo de distintos microservicios.

**OpenTelemetry aborda los tres pilares simultáneamente.** Su mayor logro es ofrecer una solución unificada para instrumentar y recolectar Métricas, Logs y Trazas bajo un mismo estándar, eliminando la necesidad de usar librerías separadas para cada pilar.

### El concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?
El método RED es un estándar de la industria enfocado en medir el comportamiento de los servicios desde la perspectiva del consumidor:
* **Rate (Tasa):** Número de peticiones por segundo. Sirve para entender la carga actual del sistema y la demanda de los usuarios.
* **Errors (Errores):** Cantidad de peticiones que fallan (códigos 4xx o 5xx). Sirve para evaluar la disponibilidad y confiabilidad técnica del servicio.
* **Duration (Duración):** El tiempo de respuesta o latencia de las peticiones (ej. percentiles p95). Sirve para medir el rendimiento y garantizar que la experiencia de usuario no se esté degradando.

### ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?
El OTLP es el protocolo de transporte nativo creado por OpenTelemetry para enviar los datos de telemetría desde la aplicación hacia un colector o backend.
Su mayor ventaja frente a usar el formato propio de Prometheus es el **desacoplamiento**. Si nuestra aplicación exporta vía OTLP hacia un "OpenTelemetry Collector", el día de mañana la empresa puede decidir abandonar Prometheus y migrar a Datadog, New Relic o Dynatrace, y **no será necesario modificar ni una sola línea del código de nuestra API**.

### ¿Cómo se relaciona OpenTelemetry con Grafana?
Funcionan como los extremos opuestos de la cadena de observabilidad. OpenTelemetry es el motor invisible que extrae los datos puros desde las entrañas del código (Fastify/Node.js) y los envía a una base de datos (Prometheus). 
Grafana se posiciona en la cima de esa arquitectura como la interfaz visual. Se conecta a la base de datos para leer la información recolectada por OpenTelemetry y la transforma en Dashboards interactivos, gráficos de líneas y paneles de control legibles por humanos.
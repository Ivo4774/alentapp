# Análisis de Infraestructura y Observabilidad

## 1.1. Análisis de la Infraestructura Docker Actual

Voy a detallar los 5 problemas críticos identificados en la configuración de desarrollo actual, que impiden su despliegue seguro y eficiente en un entorno de producción:

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
| -------- | -------------- | ------- | ------------------ |

| **1. El servidor de desarrollo de Vite en el Frontend.** Vite gasta un montón de memoria y CPU vigilando los archivos. Está bien para desarrollo porque no recibe miles de usuarios reales, pero está mal en producción.

 | `packages/web/Dockerfile` (Línea del `CMD`) y `docker-compose.yml` (servicio `web`, línea de `command`). | **Alto** | Implementar un *Multi-Stage Build*. En la etapa final, compilar la aplicación usando `vite build` y transferir los assets estáticos resultantes a una imagen liviana de **Nginx Alpine** para su distribución eficiente.

 |
| **2. Comandos de desarrollo en la API (prisma migrate dev y tsx watch)** `prisma migrate dev`: En un contenedor automático, esto puede romper todo o, peor,
borrar los datos reales. `tsx watch`: gasta CPU inútilmente porque en producción el código nunca va a cambiar
mientras corre.

 | `docker-compose.yml` (servicio `api`, línea de `command`). | **Alto** | Reemplazar `prisma migrate dev` por `prisma migrate deploy`. Compilar el código TypeScript a JavaScript puro en una etapa previa de build (`tsc`) y ejecutar el proceso final directamente con `node dist/app.js`.

 |
| **3. Exposición de Credenciales** Credenciales y secretos de configuración hardcodeados en texto plano. | `docker-compose.yml` (En las variables `POSTGRES_PASSWORD` y `DATABASE_URL`). | **Alto** | Eliminar las contraseñas explícitas del archivo de configuración. En su lugar, utilizar un archivo `.env` externo (excluido de Git mediante `.gitignore`) e inyectar las credenciales usando la directiva `env_file` del Dockerfile.

 |
| **4. Correr como usuario root (Administrador)** por defecto dentro de los contenedores. Si un hacker encuentra un fallo de seguridad logra "romper" la aplicación, al estar como root gana control absoluto de todo el contenedor.

 | `packages/api/Dockerfile` y `packages/web/Dockerfile` (por omisión de la directiva `USER`). | **Alto** | Configurar explícitamente la directiva `USER node` (aprovechando el usuario sin privilegios que ya incluyen las imágenes base de Node Alpine) en la etapa de ejecución de producción.

 |
| **5. Monitoreo constante de archivos mediante Polling activo** Hay  variables que fuerzan al contenedor a escanear el disco duro constantemente (`CHOKIDAR_USEPOLLING` y `WATCHPACK_POLLING`). El *polling* se usa para actualizar la pantalla en desarrollo. En producción consume CPU innecesariamente. | `docker-compose.yml` (servicios `api` y `web`, variables de entorno `environment`). | **Medio** | Eliminar por completo estas variables de entorno en el entorno productivo. |

---

## 1.2. Investigación de OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un estándar abierto de la industria y un conjunto de herramientas (APIs, SDKs) especializado únicamente en la **generación, recolección e instrumentación** de datos de observabilidad (métricas, trazas distribuidas y registros/logs). OpenTelemetry solo se encarga de medir e instrumentar de forma interna en un formato universal llamado OTLP. No almacena datos, expone las métricas en un endpoint neutro o las transmite hacia afuera de forma inmediata.

**Prometheus** es un servidor independiente que funciona como **base de datos cronológica (Time Series Database)** y un motor de alertas. Se conecta periódicamente a los endpoints expuestos por OpenTelemetry (*scraping*) para llevarse y almacenar esas métricas a lo largo del tiempo.

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?

Los tres pilares de la observabilidad son:

1. **Métricas:** Datos numéricos agregados que cuantifican el rendimiento del sistema en un intervalo de tiempo (ej: uso de CPU o memoria).

2. **Trazas distribuidas:** El registro detallado del camino y el ciclo de vida exacto de una solicitud (request) cruzando por todas las capas de la arquitectura.

3. **Logs:** Registros en texto plano con marcas de tiempo emitidos ante eventos puntuales.

**OpenTelemetry aborda los tres pilares por igual.** Proporciona un estándar único y una sola herramienta integrada capaz de capturar y unificar los tres pilares bajo el mismo formato, evitando que el desarrollador deba instalar librerías distintas para cada pilar.

### El concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?

El método **RED** se enfoca en medir la salud de los servicios desde la perspectiva de la experiencia del usuario final:

* **Rate (Tasa):** Mide la cantidad de solicitudes HTTP que recibe la aplicación por segundo. Sirve para entender el volumen de tráfico actual y dimensionar la infraestructura.

* **Errors (Errores):** Mide la cantidad de solicitudes que fallan (usualmente respuestas con códigos de estado HTTP 4xx o 5xx). Sirve para detectar inmediatamente bugs en producción o caídas de servicios críticos.

* **Duration (Duración / Latencia):** Mide el tiempo que tardan las solicitudes en ser procesadas (generalmente analizado mediante percentiles como p95 o p99). Sirve para diagnosticar cuellos de botella y degradación de performance percibida por el usuario.

### ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?

**OTLP (OpenTelemetry Protocol)** es el protocolo nativo de comunicación diseñado por OpenTelemetry para transmitir datos de telemetría de forma estandarizada y agnóstica mediante gRPC o HTTP.

La ventaja principal de utilizar OTLP frente a exportar directamente al formato nativo de Prometheus es el **desacoplamiento total del código (Vendor Agnosticism)**. Al instrumentar con OTLP, el software se vuelve independiente del proveedor. Si el día de mañana la organización decide cambiar Prometheus por otra herramienta de monitoreo del mercado (como Datadog o New Relic), **no se modifica una sola línea del código de la API**, solo se redirige la configuración del colector externo.

### ¿Cómo se relaciona OpenTelemetry con Grafana?

OpenTelemetry funciona como el **emisor/recolector** de los datos del sistema. Estos datos son almacenados en Prometheus, el cual actúa como la base de datos centralizadora. Finalmente, **Grafana se conecta a Prometheus como una fuente de datos (DataSource) para construir los paneles visuales gráficos (Dashboards)**.
Grafana traduce las consultas en lenguaje PromQL ejecutadas sobre las métricas recolectadas por OpenTelemetry en gráficos de series temporales interactivos en tiempo real.

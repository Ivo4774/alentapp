# Diseño Grupo 9

## Diseño del Dockerfile de la API (Backend)

**Propósito:** Optimizar y securizar el empaquetado de la API (Node.js/TypeScript) para su despliegue en producción. Se implementará un patrón Multi-Stage Build para separar las herramientas de desarrollo y compilación del entorno de ejecución final, reduciendo el tamaño de la imagen y mitigando vulnerabilidades.

**Estructura del Multi-Stage Build:**

| Etapa | Nombre | Base | Propósito |
| :--- | :--- | :--- | :--- |
| **Stage 1** | `deps` | `node:22-alpine` | Instalación de dependencias de producción. Al ser un monorepo, se copian primero el `package.json` y `package-lock.json` de la raíz y se ejecuta `npm ci --omit=dev`. Luego, se copia el `schema.prisma` y se ejecuta `npx prisma generate` para inyectar el código del cliente ORM dentro del `node_modules` de producción. |
| **Stage 2** | `build` | `node:22-alpine` | Instalación de todas las dependencias (incluyendo dev), respetando también la estructura raíz del workspace. Luego se compila el código TypeScript para generar los archivos JavaScript en el directorio de salida (ej. `dist`). |
| **Stage 3** | `runtime` | `node:22-alpine` | Imagen final. Descarta compiladores y dependencias de desarrollo. Contiene únicamente el código limpio compilado, los `node_modules` productivos de la etapa `deps`, y se prepara el entorno para ejecución sin privilegios. |

**Requisitos No Funcionales y Configuraciones:**

*   **Seguridad (Principio de menor privilegio):** El contenedor final no correrá como `root`. Se utilizará la instrucción `USER node` para ejecutar el proceso con un usuario sin privilegios del sistema.
*   **Migraciones de Base de Datos:** Se ejecutará automáticamente `npx prisma migrate deploy` antes de levantar el servidor. Para garantizar que funcione sin conexión a internet ni descargas en caliente, el paquete `prisma` (CLI) se moverá a `dependencies` en el `package.json`, asegurando que el binario esté disponible localmente en el *Stage 3*.
*   **Puertos Expuestos y Monitoreo de Salud:** El contenedor declarará la exposición del puerto `3000` (para el tráfico estándar de la API) y del puerto `9464` (para que Prometheus pueda obtener las métricas de telemetría). Adicionalmente, se implementará un `HEALTHCHECK` sobre el puerto 3000 ejecutado con Node nativo. Ejemplo: `HEALTHCHECK --interval=30s CMD node -e "require('http').get('http://localhost:3000/api/v1/ping', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"`.
*   **Optimización de Contexto:** Uso estricto de un `.dockerignore` para excluir carpetas pesadas (`node_modules`, `.git`, `dist`) y evitar invalidar la caché de Docker durante el *build*.

## Diseño del Dockerfile de la Web (Frontend)

**Propósito:** Optimizar el empaquetado del Frontend (React/Vite) para producción. Se abandonará el servidor de desarrollo en favor de una arquitectura de compilación estática servida por un servidor web de alto rendimiento (Nginx). Se asegura un entorno completamente sin privilegios (rootless) y adaptado a la arquitectura de monorrepo.

**Estructura del Multi-Stage Build:**

| Etapa | Nombre | Base | Propósito |
| :--- | :--- | :--- | :--- |
| **Stage 1** | `deps` | `node:22-alpine` | Instalación de dependencias. Al ser un monorrepo, primero se copian los archivos de configuración globales (`package.json`, `package-lock.json`) de la raíz del proyecto para asegurar la correcta resolución de los workspaces antes de instalar. |
| **Stage 2** | `build` | `node:22-alpine` | Ejecución de `vite build` para transpilar React/TypeScript a archivos estáticos (HTML, CSS, JS puros) en la carpeta `dist`. |
| **Stage 3** | `runtime` | `nginxinc/nginx-unprivileged:stable-alpine` | Descarte de todo el entorno Node.js. Se copian únicamente los archivos compilados de la etapa `build` al directorio público de Nginx (`/usr/share/nginx/html`). Esta variante de Nginx garantiza la ejecución bajo un usuario sin privilegios y expone el puerto seguro `8080`. |

**Requisitos No Funcionales y Configuraciones:**
* **Servidor Web y Enrutamiento SPA:** Reemplazo de Node.js por Nginx. Se requiere inyectar un archivo de configuración personalizado (`nginx.conf`) que incluya la regla de redirección `try_files $uri $uri/ /index.html;` para que React Router pueda manejar la navegación interna sin generar errores `404 Not Found`.
* **Optimización de red:** Configuración de compresión `gzip` para minimizar el tamaño de transferencia y políticas de caché (Cache-Control) para assets estáticos.
* **Seguridad (Rootless & Headers):** Ejecución garantizada sin usuario `root` mitigando riesgos de escape al host. Adicionalmente, inyección de *Security Headers* (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security).
* **Tolerancia a fallos:** Implementación de un `HEALTHCHECK` interno utilizando la herramienta nativa de Alpine: `wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1` para que Docker Compose monitoree la disponibilidad de la interfaz.


## Diseño del Docker Compose de Producción

**Propósito:** Definir la infraestructura y el esquema de orquestación optimizados para el entorno de producción en el archivo `docker-compose.prod.yml`. El objetivo principal es unificar el despliegue de los servicios del ecosistema (`db`, `api` y `web`), eliminando dependencias propias del entorno de desarrollo y aplicando políticas estrictas de aislamiento, inmutabilidad, seguridad y control de recursos físicos sobre el servidor host.

**Especificación del Diseño por Aspectos:**

| Aspecto             | Requisito                                                                            | Diseño e Implementación Grupal                                                                                                                                                                                                                                                                                                                                                                           |
| :------------------ | :----------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resource Limits** | CPU y memoria definidos por servicio                                                 | Implementar la directiva `deploy.resources.limits` en cada contenedor para evitar que fugas de memoria o consumos excesivos comprometan la estabilidad del servidor. Para el servicio `api` se establece un límite de `cpus: '0.50'` y `memory: 512M`. Para el servicio `web` (Nginx) se establece un límite de `cpus: '0.25'` y `memory: 256M`.                                                         |
| **Healthchecks**    | Validaciones de salud para API y Base de Datos                                       | Definir verificaciones periódicas de disponibilidad. El servicio `db` utilizará el comando nativo `pg_isready -U admin -d alentapp_db` para confirmar que PostgreSQL se encuentra operativo. El servicio `api` implementará una validación local mediante un script que consulte el endpoint de ping disponible en el puerto `3000`.                                                             |
| **Seguridad**       | `read_only: true`, `cap_drop: ALL`, `cap_add: NET_BIND_SERVICE`, `no-new-privileges` | Aplicar políticas de hardening estrictas sobre los contenedores. Se bloqueará la escritura mediante `read_only: true`, se eliminarán todas las capacidades del kernel utilizando `cap_drop: ALL`, agregando únicamente `NET_BIND_SERVICE` cuando resulte necesario para la escucha de puertos protegidos. Además, se activará `no-new-privileges: true` para reducir riesgos de escalada de privilegios. |
| **Logging**         | Driver `json-file` con rotación automática                                           | Configurar el bloque `logging` en todos los servicios utilizando el driver oficial `json-file`. Se limitará el crecimiento de los archivos mediante `max-size: "10m"` y `max-file: "3"`, evitando la saturación del almacenamiento por acumulación de registros.                                                                                                                                         |
| **Red**             | Red interna personalizada                                                            | Declarar una red propia denominada `alentapp-prod-net` utilizando el driver `bridge`. Esta configuración aísla los contenedores del entorno externo, restringe el acceso directo a la base de datos y garantiza la comunicación interna necesaria para el monitoreo mediante el endpoint `api:9464/metrics`.                                                                                             |
| **Secrets**         | Variables sensibles gestionadas externamente                                         | Prohibir la inclusión de contraseñas o tokens en texto plano dentro del repositorio. Se utilizará la directiva `env_file: .env.prod` para inyectar de forma segura la variable `DATABASE_URL` y las credenciales administrativas necesarias durante el tiempo de ejecución.                                                                                                                              |

**Requisitos No Funcionales y Configuraciones:**

* **Tiempo de Startup y Sincronización de Dependencias:** El orquestador gestionará la secuencia de arranque mediante la directiva `depends_on` utilizando la condición `service_healthy`. Esto garantiza que la API no inicie su ejecución ni ejecute migraciones automáticas hasta que la base de datos se encuentre completamente disponible para aceptar conexiones.

* **Persistencia e Inmutabilidad de los Datos:** Se elimina completamente el uso de volúmenes de desarrollo basados en carpetas locales (`bind mounts` como `- .:/app`). Los servicios funcionarán exclusivamente utilizando el código empaquetado dentro de sus imágenes productivas, delegando la persistencia de datos al volumen nombrado `pgdata` administrado por Docker.

* **Aislamiento de Puertos de Telemetría:** El archivo Compose expondrá únicamente los puertos indispensables para el acceso externo. El tráfico de usuarios ingresará por el puerto público `80`, redirigido internamente al puerto `8080` de Nginx rootless. Por su parte, el puerto de telemetría `9464` permanecerá inaccesible desde el exterior y estará disponible únicamente para el sistema interno de monitoreo basado en el modelo *Pull*.

## Tarjeta de Observabilidad: Plan de Telemetría y Monitoreo

Para la API desarrollada sobre Fastify, implementaremos una estrategia de instrumentación robusta y eficiente utilizando el SDK nativo de OpenTelemetry para Node.js.

El flujo de recolección de datos funcionará bajo el siguiente modelo arquitectónico:

* **Carga Temprana (Prioritaria):** El motor de telemetría se ejecutará en el punto de entrada más alto de la aplicación, antes de que se cargue cualquier controlador de Fastify o modelo de Prisma. Esto garantiza que ningún request inicial quede sin registrar.
* **Auto-instrumentación Absoluta (Zero-Code Metrics):** Delegaremos por completo la captura de las métricas RED en la capa de abstracción de OpenTelemetry mediante plugins oficiales. Esto evita tener que inyectar código de monitoreo manualmente dentro de los controladores de nuestra lógica de negocio, reduciendo el acoplamiento y previniendo el impacto en la performance por procesamiento duplicado.
  * `@opentelemetry/instrumentation-http`: Intercepta los sockets de red para capturar el tráfico HTTP crudo.
  * `@opentelemetry/instrumentation-fastify`: Traduce los eventos del framework en rutas semánticas de nuestra API (ej: identifica `/members/:id` en lugar de registrar cientos de métricas individuales con IDs distintos).
* **Mecanismo de Exposición (Pull Model):** Utilizaremos un Prometheus Exporter que levanta un servidor HTTP interno en el puerto `9464` bajo la ruta `/metrics`. La API solo expone el estado de los contadores en memoria; el servidor central de Prometheus se encargará de pasar a buscar los datos de forma asrónica (scraping).

### Catálogo Estructurado de Métricas (Modelo RED)

Este es el inventario de datos que nuestra capa de auto-instrumentación generará de forma nativa y transparente. Está diseñado bajo el estándar RED (Rate, Errors, Duration) para medir la salud del software desde la perspectiva del usuario final, sumando métricas esenciales de infraestructura.

| Métrica Semántica (OTel) | Tipo de Instrumento | Descripción Técnica | Dimensiones / Etiquetas (Labels) |
| :--- | :--- | :--- | :--- |
| `http.server.request.count` | **Counter** | Contador acumulativo que registra la cantidad total de solicitudes HTTP que ingresan a la API. Sirve para calcular la Tasa de tráfico (Rate). | `http.method` (GET/POST), `http.route` (endpoint), `http.status_code` |
| `http.server.request.errors` | **Counter** | Filtro automático que registra únicamente las solicitudes que fallaron con códigos de estado 4xx y 5xx. Mide los Errores (Errors). | `http.method`, `http.route`, `http.status_code` |
| `http.server.duration` | **Histogram** | Histograma de distribución que mide el tiempo de respuesta en milisegundos. Permite calcular la Duración (Duration) mediante percentiles. | `http.method`, `http.route` |
| `process.runtime.nodejs.memory.usage` | **Gauge** | Medidor instantáneo que registra el consumo de memoria RAM del proceso Node.js en bytes para detectar fugas de memoria. | N/A |
| `process.runtime.nodejs.cpu.usage` | **Gauge** | Medidor que registra el porcentaje de uso de CPU asignado al contenedor de la API. | N/A |

### Plano del Archivo de Inicialización (`telemetry.ts`)

Este es el diseño definitivo de cómo se estructurará el archivo `packages/api/src/infrastructure/telemetry.ts`. Al delegar el 100% de las métricas en la auto-instrumentación, el archivo se mantiene limpio, mantenible y enfocado puramente en la configuración del ciclo de vida del SDK.

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// CONFIGURACIÓN DEL PUERTO DE ESCUCHA PARA PROMETHEUS
const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics'
});

// CONFIGURACIÓN CENTRAL DEL SDK
const sdk = new NodeSDK({
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Componentes que impactan en Fastify
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-fastify': { enabled: true }
    })
  ]
});

// ARRANQUE DEL SISTEMA DE TELEMETRÍA
sdk.start();

```

### Plan de Visualización: Dashboard RED en Grafana

Para que los datos crudos recopilados por la auto-instrumentación sean útiles, diseñamos un tablero en Grafana compuesto por **6 paneles visuales críticos** para el control del entorno productivo.

* **Panel 1: Tasa de Tráfico Actual (Rate)**
  * **Tipo de Gráfico:** Gráfico de Series Temporales (Time Series).
  * **Fórmula PromQL:** `sum(rate(http_server_request_count[1m]))`
  * **Propósito:** Muestra cuántas peticiones por segundo está procesando la API en tiempo real. Permite dimensionar la infraestructura ante picos de usuarios.

* **Panel 2: Porcentaje de Disponibilidad / Errores (Errors)**
  * **Tipo de Gráfico:** Indicador Numérico Grande (Stat / Gauge Circular).
  * **Fórmula PromQL:** `(sum(rate(http_server_request_errors[5m])) / sum(rate(http_server_request_count[5m]))) * 100`
  * **Propósito:** Calcula el porcentaje exacto de requests fallidos. Si este número sube del 1%, significa que hay una degradación del servicio o una caída de la base de datos.

* **Panel 3: Latencia del Percentil 95 (Duration)**
  * **Tipo de Gráfico:** Gráfico de Series Temporales.
  * **Fórmula PromQL:** `histogram_quantile(0.95, sum(rate(http_server_duration_bucket[5m])) by (le))`
  * **Propósito:** Monitorea el tiempo de respuesta del 5% de los usuarios que experimentan mayor lentitud. Es el indicador real de la experiencia de usuario (un promedio simple escondería los requests lentos).

* **Panel 4: Distribución de Respuestas por Código de Estado HTTP**
  * **Tipo de Gráfico:** Gráfico de Barras Apiladas (Stacked Bar Chart).
  * **Fórmula PromQL:** `sum by (http_status_code) (rate(http_server_request_count[5m]))`
  * **Propósito:** Permite ver de forma visual cuántas respuestas son exitosas (verdes / 2xx), cuántas son errores de cliente (amarillas / 4xx) y cuántas son fallas del servidor (rojas / 5xx).

* **Panel 5: Consumo de Memoria RAM del Contenedor**
  * **Tipo de Gráfico:** Gráfico de Líneas con umbrales de alerta.
  * **Fórmula PromQL:** `process_runtime_nodejs_memory_usage / 1024 / 1024`
  * **Propósito:** Controla el consumo de RAM en Megabytes. Ayuda a verificar si los límites estrictos puestos en el Docker Compose (`deploy.resources.limits.memory`) están cerca de saturarse o si hay fugas de memoria en el proceso Node.js.

* **Panel 6: Top 5 de Endpoints más lentos (Análisis de Cuellos de Botella)**
  * **Tipo de Gráfico:** Tabla Ordenada o Gráfico de Barras Horizontal.
  * **Fórmula PromQL:** `topk(5, avg by (http_route) (http_server_duration_sum / http_server_duration_count))`
    * **Propósito:** Identifica con nombre exacto cuáles son las 5 rutas de la API que más tardan en responder para que el equipo sepa exactamente qué controladores optimizar o qué consultas a Prisma requieren índices.

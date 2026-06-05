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

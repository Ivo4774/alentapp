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

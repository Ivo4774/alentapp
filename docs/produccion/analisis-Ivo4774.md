# Análisis de Infraestructura y Observabilidad

## 1.1. Análisis de la Infraestructura Docker Actual

Voy a detallar los 5 problemas críticos identificados en la configuración de desarrollo actual, que impiden su despliegue seguro y eficiente en un entorno de producción:

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
| :--- | :--- | :--- | :--- |
| **Credenciales y datos sensibles expuestos en texto plano.** Dejar contraseñas de la base de datos hardcodeadas en un archivo de configuración vulnera la seguridad del entorno y rompe con las buenas prácticas de diseño de las *12 Factor Apps*. | `docker-compose.yml` (Líneas 6-8 en el servicio `db`, y Línea 23 en el entorno de la `api`). | **Alto**. | Quitar por completo las claves del archivo. Propongo inyectarlas en tiempo de ejecución consumiendo un archivo `.env` local (añadido al `.gitignore`) o mediante Docker Secrets para aislar el entorno productivo. |
| **Contenedores ejecutando sus procesos principales como usuario `root`.** Al no especificar un usuario con privilegios restringidos, la aplicación hereda el control total del contenedor. Si un atacante logra explotar una vulnerabilidad en la API, podría comprometer directamente el sistema de archivos del host principal. | `packages/api/Dockerfile` y `packages/web/Dockerfile` (Ausencia total de la directiva `USER` en todo el archivo). | **Alto**. | Configurar la directiva `USER node` en la última capa de ambos Dockerfiles productivos para forzar a los procesos a correr bajo un usuario del sistema operativo sin privilegios elevados. |
| **Ausencia total de límites de hardware (RAM y CPU) por servicio.** Al no tener un techo de consumo asignado, cualquier fuga de memoria en la API o un proceso pesado en bucle infinito puede comerse los recursos enteros del servidor, provocando una caída generalizada del sistema por denegación de servicio. | `docker-compose.yml` (Falta la sección de recursos en las declaraciones de servicios de las líneas 2, 17 y 34). | **Medio-Alto**. | Incorporar la propiedad `deploy.resources.limits` dentro de cada bloque de servicio del Compose productivo para definir topes físicos máximos de memoria RAM y porcentaje de CPU permitidos. |
| **Falta de rotación y límites en los logs acumulados.** Por defecto, el demonio de Docker escribe las salidas de consola en archivos JSON de forma indefinida. En producción, el flujo continuo de solicitudes HTTP va a inflar el tamaño de estos archivos hasta llenar el disco del host. | `docker-compose.yml` (Ausencia absoluta de configuraciones de la sección `logging` en todo el archivo). | **Medio**. | Definir explícitamente el driver `json-file` junto con políticas rígidas de rotación de logs (`max-size: 10m` y `max-file: 3`) para garantizar que el historial acumulado nunca comprometa el almacenamiento. |
| **Falta de monitoreo interno del estado de salud (Healthchecks) de la aplicación.** Docker solo vigila si el proceso PID principal está levantado, pero no sabe si la app está colgada internamente o si dejó de responder peticiones HTTP. El contenedor figurará activo en el orquestador cuando en realidad el servicio está totalmente caído. | `docker-compose.yml` (Falta el bloque de verificación en los servicios `api` y `web`, líneas 17-32 y 34-40). | **Medio-Alto**. | Diseñar y agregar directivas de `healthcheck` dedicadas en el archivo de producción, usando comandos basados en `curl` o herramientas HTTP nativas que verifiquen el estado real de los endpoints en `localhost:3000` y `localhost:80`. |


## 1.2. Investigación de OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry (OTel)** es un framework de código abierto y un estándar de la industria impulsado por la CNCF para generar, recolectar y exportar datos de telemetría (métricas, logs y trazas) de forma unificada. Su única responsabilidad es la **instrumentación**: le da a nuestra aplicación las herramientas (SDKs y APIs) para capturar lo que pasa adentro, sin importar dónde se van a guardar esos datos.

La diferencia clave con **Prometheus** es el alcance:
* **OpenTelemetry** solo recolecta y transporta datos, pero no los almacena ni tiene un motor de consultas. Además, es agnóstico y maneja el "combo completo" (trazas, logs y métricas).
* **Prometheus** es principalmente una base de datos de series temporales (un motor de almacenamiento) con su propio lenguaje de consultas (PromQL) y sistema de alertas. Tradicionalmente funciona mediante un modelo *pull* (trata de capturar las métricas expuestas por las apps).

En resumen: OpenTelemetry es el  que recolecta la informacion en la app y Prometheus es donde se guarda y se analiza.

---

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?

Los tres pilares fundamentales de la observabilidad son:
1. **Métricas (Metrics):** Datos numéricos agregados que miden el comportamiento del sistema en el tiempo (ej. uso de CPU, cantidad de requests). Sirven para saber *si algo está fallando*.
2. **Trazas (Traces):** El viaje completo de una petición a lo que atraviesa el sistema (los microservicios, la base de datos, etc.). Sirven para saber *dónde está la falla o el cuello de botella*.
3. **Logs:** El registro histórico de texto con sello de tiempo que emite la app (mensajes de error, eventos del servidor). Sirven para saber *por qué ocurrió la falla*.

**OpenTelemetry aborda los tres pilares de forma simultánea.** Su gran ventaja competitiva es que unifica la captura de trazas, métricas y logs bajo un mismo estándar técnico, evitando tener que meter tres librerías distintas en el código de nuestra API.

---

### El concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?

El método RED está específicamente diseñado para monitorear servicios web y arquitecturas de APIs orientadas a peticiones request/response. Cada sigla sirve para un control crítico:

* **Rate (Tasa de solicitudes):** Mide la cantidad de peticiones por segundo que está recibiendo nuestra API. Sirve para entender el volumen de tráfico actual, detectar picos inusuales de uso o identificar posibles ataques de denegación de servicio (DDoS).
* **Errors (Errores):** Mide la cantidad de solicitudes HTTP que fallan (comúnmente las respuestas con códigos de estado 4xx y 5xx). Sirve para calcular la tasa de error del sistema y alertar de inmediato si un cambio en el código o una caída de la base de datos está rompiendo la experiencia del usuario.
* **Duration (Duración / Latencia):** Mide el tiempo exacto que tarda el sistema en procesar y responder con éxito una solicitud HTTP (generalmente analizado mediante histogramas como los percentiles p95 o p99). Sirve para evaluar la performance real y detectar si la API se volvió lenta debido a una query ineficiente o degradación de la infraestructura.

---

### ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?

**OTLP** es el protocolo de transporte nativo de OpenTelemetry. Define cómo se codifican y envían los datos de telemetría de forma súper eficiente y serializada a través de conexiones de alto rendimiento como HTTP.

La ventaja principal de transmitir vía OTLP en lugar de usar el formato de exportación tradicional de Prometheus es el **desacoplamiento absoluto de la aplicación**:
* Si exportamos directo al formato de Prometheus, nuestra API queda atada a la estructura de métricas y al modelo de raspado que impone esa herramienta.
* Al exportar mediante OTLP, la API escupe un flujo estándar estandarizado hacia un componente intermedio (un Collector o un agente de telemetría). Si el día de mañana el equipo decide migrar de Prometheus a Dynatrace, el código de nuestra API no se toca en absoluto; simplemente se reconfigura el destino del flujo en el agente externo.

---

### ¿Cómo se relaciona OpenTelemetry con Grafana?

Se relacionan como el origen de datos y el panel de control visual. 

OpenTelemetry actúa en la primera fase de la cadena: se mete en nuestro código de Fastify (API), captura las métricas RED y las exporta. Un motor intermedio de base de datos, en este caso Prometheus, se encarga de recibir esa data y guardarla cronológicamente.

**Grafana entra al final de la arquitectura como la capa de visualización.** Se conecta a Prometheus configurándolo como su *Data Source* y, mediante consultas en lenguaje PromQL, consume esos datos duros para transformarlos en gráficos de series temporales, diagramas de barras o paneles de alerta interactivos en tiempo real. Básicamente, OpenTelemetry aporta la verdad de lo que pasa en el código y Grafana la convierte en un Dashboard legible para operaciones.
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { metrics, Meter } from '@opentelemetry/api'; 
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify'; 

// Configuración del exportador de Prometheus
const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
  host: '0.0.0.0',
});

const sdk = new NodeSDK({
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {}, 
    }),
    new FastifyInstrumentation(), 
  ],
});

// Iniciamos el SDK de OpenTelemetry
try {
  sdk.start();
  console.log("🚀 [Telemetría] Servidor de Prometheus iniciado automáticamente en el puerto 9464");
} catch (error) {
  console.error("❌ [Telemetría] Error al iniciar el SDK de OpenTelemetry:", error);
}

const meter = metrics.getMeter('alentapp-api');

// Función helper para las métricas RED (Rate, Errors, Duration)
export function createREDMetrics(meter: Meter) {
  const requestCounter = meter.createCounter('http.requests.total', {
    description: 'Total de requests HTTP',
  });
  const errorCounter = meter.createCounter('http.requests.errors', {
    description: 'Total de errores HTTP',
  });
  const requestDuration = meter.createHistogram('http.request.duration', {
    description: 'Duración de requests',
    unit: 'ms',
  });
  return { requestCounter, errorCounter, requestDuration };
}

export { sdk, meter, prometheusExporter };
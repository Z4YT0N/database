// Import stats to register Prometheus metrics
import "@noted/trpc/stats";

import { prometheus } from "@hono/prometheus";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { register } from "prom-client";

import serverConfig from "@noted/shared/config";

type PrometheusHandlers = ReturnType<typeof prometheus>;

const globalForPrometheus = globalThis as typeof globalThis & {
  __notedApiPrometheus?: PrometheusHandlers;
};

const prometheusHandlers = (globalForPrometheus.__notedApiPrometheus ??=
  prometheus({
    registry: register,
    prefix: "noted_",
    collectDefaultMetrics: true,
  }));

export const { printMetrics, registerMetrics } = prometheusHandlers;

const app = new Hono().get(
  "/",
  bearerAuth({ token: serverConfig.prometheus.metricsToken }),
  printMetrics,
);

export default app;

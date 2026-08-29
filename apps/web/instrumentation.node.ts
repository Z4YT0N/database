import {
  initEventLogger,
  initTracing,
  loadAllPlugins,
} from "@noted/shared-server";

await loadAllPlugins();
initTracing("web");
initEventLogger("web");

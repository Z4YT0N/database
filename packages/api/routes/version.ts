import { Hono } from "hono";

import serverConfig from "@noted/shared/config";
import { Context } from "@noted/trpc";

const version = new Hono<{
  Variables: {
    ctx: Context;
  };
}>().get("/", (c) => {
  return c.json({
    version: serverConfig.serverVersion ?? "unknown",
  });
});

export default version;

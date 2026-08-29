import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";

import logger from "@noted/shared/logger";
import { Context } from "@noted/trpc";
import { appRouter } from "@noted/trpc/routers/_app";

const trpc = new Hono<{
  Variables: {
    ctx: Context;
  };
}>().use(
  "/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext: (_, c) => {
      return c.var.ctx;
    },
    onError: ({ path, error }) => {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        logger.error(`tRPC failed on ${path}: ${error.message}`);
        if (error.stack) {
          logger.error(error.stack);
        }
      }
    },
  }),
);

export default trpc;

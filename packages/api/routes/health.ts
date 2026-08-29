import { Hono } from "hono";

import { Context } from "@noted/trpc";

const health = new Hono<{
  Variables: {
    ctx: Context;
  };
}>().get("/", (c) => {
  return c.json({
    status: "ok",
    message: "Web app is working",
  });
});

export default health;

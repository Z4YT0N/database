import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import {
  apiKeyScopesGrantScope,
  getApiKeyScope,
} from "@noted/shared/types/apiKeys";
import type {
  ZApiKeyScopeAccess,
  ZApiKeyScopeResource,
} from "@noted/shared/types/apiKeys";
import type { AuthedContext } from "@noted/trpc";

export function apiKeyScopeMiddleware(
  resource: ZApiKeyScopeResource,
  access: ZApiKeyScopeAccess,
) {
  return createMiddleware<{
    Variables: {
      ctx: AuthedContext;
    };
  }>(async (c, next) => {
    const auth = c.var.ctx.auth;
    if (auth?.type !== "apiKey") {
      await next();
      return;
    }

    const scope = getApiKeyScope(resource, access);
    if (apiKeyScopesGrantScope(auth.scopes, scope)) {
      await next();
      return;
    }

    throw new HTTPException(403, {
      message: `API key is missing required scope: ${scope}`,
    });
  });
}

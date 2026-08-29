import { createCallerFactory } from "@noted/trpc";
import { buildImpersonatingAuthedContext as buildAuthedContext } from "@noted/trpc/lib/impersonate";
import { appRouter } from "@noted/trpc/routers/_app";

export const buildImpersonatingAuthedContext = buildAuthedContext;

/**
 * This is only safe to use in the context of a worker.
 */
export async function buildImpersonatingTRPCClient(userId: string) {
  const createCaller = createCallerFactory(appRouter);

  return createCaller(await buildImpersonatingAuthedContext(userId));
}

import { clientConfig } from "@noted/shared/config";
import { zClientConfigSchema } from "@noted/shared/types/config";

import { publicProcedure, router } from "../index";

export const configAppRouter = router({
  clientConfig: publicProcedure
    .output(zClientConfigSchema)
    .query(() => clientConfig),
});

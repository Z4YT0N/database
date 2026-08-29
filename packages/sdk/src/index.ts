import createClient from "openapi-fetch";

import type { components, paths } from "./noted-api.d.ts";

export const createNotedClient = createClient<paths>;

export type NotedAPISchemas = components["schemas"];

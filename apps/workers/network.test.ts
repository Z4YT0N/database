import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@noted/shared/config", () => ({
  default: {
    allowedInternalHostnames: undefined,
    crawler: { ipValidation: { dnsResolverTimeoutSec: 1 } },
    proxy: {
      httpProxy: undefined,
      httpsProxy: undefined,
      noProxy: undefined,
    },
  },
}));

// resolveHostAddresses is module-private, so these drive it through
// validateUrl, which is the only way the crawler reaches it.
const resolve4 = vi.fn<(hostname: string) => Promise<string[]>>();
const resolve6 = vi.fn<(hostname: string) => Promise<string[]>>();
const lookup =
  vi.fn<
    (
      hostname: string,
      options: unknown,
    ) => Promise<{ address: string; family: number }[]>
  >();

vi.mock("node:dns/promises", () => ({
  default: {
    Resolver: class {
      resolve4(hostname: string) {
        return resolve4(hostname);
      }
      resolve6(hostname: string) {
        return resolve6(hostname);
      }
    },
    lookup: (hostname: string, options: unknown) => lookup(hostname, options),
    getServers: () => ["127.0.0.1"],
  },
}));

import { createPinnedLookup, validateUrl } from "./network";

// Every test here uses its own hostname, so the module-level 5-minute DNS
// cache can't serve one test's addresses to another.
describe("resolveHostAddresses DNS fallback", () => {
  beforeEach(() => {
    resolve4.mockReset();
    resolve6.mockReset();
    lookup.mockReset();
  });

  test("falls back to the OS resolver when c-ares has no usable nameserver", async () => {
    const econnrefused = new Error("queryA ECONNREFUSED fallback-ok.example");
    resolve4.mockRejectedValue(econnrefused);
    resolve6.mockRejectedValue(econnrefused);
    lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

    const result = await validateUrl("https://fallback-ok.example/", false);

    expect(result).toMatchObject({
      ok: true,
      resolvedAddresses: ["93.184.216.34"],
    });
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  test("still rejects a private address that only the OS resolver returned", async () => {
    const econnrefused = new Error(
      "queryA ECONNREFUSED fallback-private.example",
    );
    resolve4.mockRejectedValue(econnrefused);
    resolve6.mockRejectedValue(econnrefused);
    // e.g. a hosts-file entry, or an attacker-controlled zone pointing inward.
    lookup.mockResolvedValue([{ address: "192.168.1.10", family: 4 }]);

    const result = await validateUrl(
      "https://fallback-private.example/",
      false,
    );

    expect(result.ok).toBe(false);
  });

  test("does not consult the OS resolver when c-ares answers", async () => {
    resolve4.mockResolvedValue(["93.184.216.34"]);
    resolve6.mockRejectedValue(new Error("no AAAA record"));

    const result = await validateUrl("https://cares-ok.example/", false);

    expect(result).toMatchObject({
      ok: true,
      resolvedAddresses: ["93.184.216.34"],
    });
    expect(lookup).not.toHaveBeenCalled();
  });

  test("reports a failure when both resolvers fail", async () => {
    const econnrefused = new Error("queryA ECONNREFUSED fallback-dead.example");
    resolve4.mockRejectedValue(econnrefused);
    resolve6.mockRejectedValue(econnrefused);
    lookup.mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));

    const result = await validateUrl("https://fallback-dead.example/", false);

    expect(result.ok).toBe(false);
  });
});

describe("createPinnedLookup", () => {
  test("returns a previously validated address without another DNS lookup", async () => {
    const lookup = createPinnedLookup([
      "93.184.216.34",
      "2606:2800:220:1:248:1893:25c8:1946",
    ]);

    const result = await new Promise<{ address: string; family: number }>(
      (resolve, reject) => {
        lookup("rebind.example", {}, (error, address, family) => {
          if (error) {
            reject(error);
          } else if (typeof address !== "string" || family === undefined) {
            reject(new Error("Expected a single lookup result"));
          } else {
            resolve({ address, family });
          }
        });
      },
    );

    expect(result).toEqual({ address: "93.184.216.34", family: 4 });
  });

  test("honors the socket's requested address family", async () => {
    const lookup = createPinnedLookup([
      "93.184.216.34",
      "2606:2800:220:1:248:1893:25c8:1946",
    ]);

    const result = await new Promise<{ address: string; family: number }>(
      (resolve, reject) => {
        lookup("rebind.example", { family: 6 }, (error, address, family) => {
          if (error) {
            reject(error);
          } else if (typeof address !== "string" || family === undefined) {
            reject(new Error("Expected a single lookup result"));
          } else {
            resolve({ address, family });
          }
        });
      },
    );

    expect(result).toEqual({
      address: "2606:2800:220:1:248:1893:25c8:1946",
      family: 6,
    });
  });

  test("returns all validated addresses when requested by the socket", async () => {
    const lookup = createPinnedLookup([
      "93.184.216.34",
      "2606:2800:220:1:248:1893:25c8:1946",
    ]);

    const result = await new Promise<{ address: string; family: number }[]>(
      (resolve, reject) => {
        lookup("rebind.example", { all: true }, (error, addresses) => {
          if (error) {
            reject(error);
          } else if (typeof addresses === "string") {
            reject(new Error("Expected all lookup results"));
          } else {
            resolve(addresses);
          }
        });
      },
    );

    expect(result).toEqual([
      { address: "93.184.216.34", family: 4 },
      { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 },
    ]);
  });

  test("refuses to return a forbidden address", async () => {
    const lookup = createPinnedLookup(["127.0.0.1", "169.254.169.254"]);

    const error = await new Promise<NodeJS.ErrnoException>(
      (resolve, reject) => {
        lookup("rebind.example", {}, (lookupError) => {
          if (lookupError) {
            resolve(lookupError);
          } else {
            reject(
              new Error("Expected the lookup to reject forbidden addresses"),
            );
          }
        });
      },
    );

    expect(error.code).toBe("ENOTFOUND");
  });

  test("never selects a forbidden address from a mixed result set", async () => {
    const lookup = createPinnedLookup(["127.0.0.1", "93.184.216.34"]);

    const result = await new Promise<{ address: string; family: number }>(
      (resolve, reject) => {
        lookup("rebind.example", {}, (error, address, family) => {
          if (error) {
            reject(error);
          } else if (typeof address !== "string" || family === undefined) {
            reject(new Error("Expected a single lookup result"));
          } else {
            resolve({ address, family });
          }
        });
      },
    );

    expect(result).toEqual({ address: "93.184.216.34", family: 4 });
  });
});

import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";

describe("server config", () => {
  it("allows unauthenticated loopback development", () => {
    const config = loadConfig({
      INIT_CWD: "D:/Codex/contextarr",
      CONTEXTARR_HOST: "127.0.0.1"
    });

    expect(config.host).toBe("127.0.0.1");
    expect(config.apiToken).toBeUndefined();
  });

  it("requires an API token for non-loopback binds", () => {
    expect(() =>
      loadConfig({
        INIT_CWD: "D:/Codex/contextarr",
        CONTEXTARR_HOST: "0.0.0.0"
      })
    ).toThrow(/CONTEXTARR_API_TOKEN is required/);
  });

  it("allows non-loopback binds when token auth is configured", () => {
    const config = loadConfig({
      INIT_CWD: "D:/Codex/contextarr",
      CONTEXTARR_HOST: "0.0.0.0",
      CONTEXTARR_API_TOKEN: "test-token"
    });

    expect(config.host).toBe("0.0.0.0");
    expect(config.apiToken).toBe("test-token");
  });
});

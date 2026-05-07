import { describe, expect, it } from "vitest";
import { ApiError, createApiClient, toApiUrl } from "./api";

describe("Contextarr API client", () => {
  it("builds API URLs with optional base URLs", () => {
    expect(toApiUrl("", "/api/packs")).toBe("/api/packs");
    expect(toApiUrl("http://127.0.0.1:3210/", "/api/packs")).toBe("http://127.0.0.1:3210/api/packs");
  });

  it("sends bearer auth when configured", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const client = createApiClient({
      baseUrl: "http://api.local/",
      token: "test-token",
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init });
        return jsonResponse({ packs: [] });
      }
    });

    await client.getPacks();

    expect(requests[0]).toMatchObject({
      url: "http://api.local/api/packs",
      init: {
        headers: {
          Authorization: "Bearer test-token"
        }
      }
    });
  });

  it("omits auth headers when no token is configured", async () => {
    const requests: Array<{ init?: RequestInit }> = [];
    const client = createApiClient({
      fetchImpl: async (_url, init) => {
        requests.push({ init });
        return jsonResponse({ status: "ok" });
      }
    });

    await client.getHealth();

    expect(requests[0].init?.headers).toBeUndefined();
  });

  it("reads pack detail, pack records, and record detail", async () => {
    const requests: string[] = [];
    const client = createApiClient({
      fetchImpl: async (url) => {
        requests.push(String(url));
        if (String(url).includes("/records/record-1")) {
          return jsonResponse({ id: "record-1", body: "# Record" });
        }
        if (String(url).includes("/records")) {
          return jsonResponse({ records: [{ id: "record-1" }] });
        }
        return jsonResponse({ id: "pack-1" });
      }
    });

    await expect(client.getPack("pack-1")).resolves.toMatchObject({ id: "pack-1" });
    await expect(client.getPackRecords("pack-1")).resolves.toEqual([{ id: "record-1" }]);
    await expect(client.getRecord("record-1")).resolves.toMatchObject({ body: "# Record" });
    expect(requests).toEqual(["/api/packs/pack-1", "/api/packs/pack-1/records", "/api/records/record-1"]);
  });

  it("throws ApiError for failed responses", async () => {
    const client = createApiClient({
      fetchImpl: async () => jsonResponse({ message: "API token required." }, 401)
    });

    await expect(client.getPacks()).rejects.toEqual(new ApiError("API token required.", 401));
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

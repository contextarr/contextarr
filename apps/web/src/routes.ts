import type { Route } from "./types";

export function parseHashRoute(hash: string): Route {
  const value = hash.replace(/^#/, "") || "/library";
  const parts = value.split("/").filter(Boolean).map(decodeURIComponent);

  if (parts[0] === "packs" && parts[1]) {
    return { name: "pack", packId: parts[1] };
  }

  if (parts[0] === "records" && parts[1]) {
    return { name: "record", recordId: parts[1] };
  }

  return { name: "library" };
}

export function packHref(packId: string): string {
  return `#/packs/${encodeURIComponent(packId)}`;
}

export function recordHref(recordId: string): string {
  return `#/records/${encodeURIComponent(recordId)}`;
}

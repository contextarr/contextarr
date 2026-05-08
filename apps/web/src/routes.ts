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

  if (parts[0] === "skills" && parts[1]) {
    return { name: "skill", skillId: parts[1] };
  }

  if (parts[0] === "skills") {
    return { name: "skills" };
  }

  if (parts[0] === "agent-kits" && parts[1]) {
    return { name: "agentKit", agentKitId: parts[1] };
  }

  if (parts[0] === "review-queue") {
    return { name: "reviewQueue" };
  }

  if (parts[0] === "composer") {
    if (parts[1] === "agent-kit" || parts[1] === "record-export") {
      return { name: "composer", mode: parts[1] };
    }

    return { name: "composer" };
  }

  if (parts[0] === "exports") {
    return { name: "exports" };
  }

  if (parts[0] === "health") {
    return { name: "health" };
  }

  return { name: "library" };
}

export function packHref(packId: string): string {
  return `#/packs/${encodeURIComponent(packId)}`;
}

export function recordHref(recordId: string): string {
  return `#/records/${encodeURIComponent(recordId)}`;
}

export function skillsHref(): string {
  return "#/skills";
}

export function skillHref(skillId: string): string {
  return `#/skills/${encodeURIComponent(skillId)}`;
}

export function agentKitHref(agentKitId: string): string {
  return `#/agent-kits/${encodeURIComponent(agentKitId)}`;
}

export function reviewQueueHref(): string {
  return "#/review-queue";
}

export function exportsHref(): string {
  return "#/exports";
}

export function composerHref(mode?: "agent-kit" | "record-export"): string {
  return mode ? `#/composer/${mode}` : "#/composer";
}

export function healthHref(): string {
  return "#/health";
}

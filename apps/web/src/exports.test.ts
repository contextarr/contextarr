import { describe, expect, it, vi } from "vitest";
import { buildExportOptions, copyTextToClipboard, createExportBlob, downloadExportArtifact, getExportTargets } from "./exports";
import type { ExportArtifact, PackDetail } from "./types";

const pack = {
  id: "pack-1",
  name: "Pack One",
  exportProfiles: [
    { id: "chatgpt", name: "ChatGPT", target: "chatgpt", format: "markdown" },
    { id: "json", name: "JSON", target: "json_records", format: "json" }
  ]
} as PackDetail;

describe("export UI helpers", () => {
  it("filters export options by target", () => {
    expect(buildExportOptions(pack)).toHaveLength(2);
    expect(buildExportOptions(pack, "chatgpt")).toEqual([
      expect.objectContaining({ packId: "pack-1", profile: expect.objectContaining({ id: "chatgpt" }) })
    ]);
  });

  it("returns sorted unique targets", () => {
    expect(getExportTargets(pack.exportProfiles)).toEqual(["chatgpt", "json_records"]);
  });

  it("creates export blobs with returned content", async () => {
    const artifact = { content: "# Export", mimeType: "text/markdown" } as ExportArtifact;
    const blob = createExportBlob(artifact);

    expect(blob.type).toBe("text/markdown");
    expect(await blob.text()).toBe("# Export");
  });

  it("downloads export artifacts with the returned filename", () => {
    const remove = vi.fn();
    const click = vi.fn();
    const appendChild = vi.fn();
    const link = { href: "", download: "", click, remove };
    const createObjectURL = vi.fn(() => "blob:export");
    const revokeObjectURL = vi.fn();

    downloadExportArtifact(
      { content: "{}", mimeType: "application/json", filename: "pack.json" } as ExportArtifact,
      {
        createElement: () => link as unknown as HTMLAnchorElement,
        body: { appendChild } as unknown as HTMLElement
      },
      { createObjectURL, revokeObjectURL }
    );

    expect(link.href).toBe("blob:export");
    expect(link.download).toBe("pack.json");
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:export");
  });

  it("copies export text through the clipboard API", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    await expect(copyTextToClipboard("export", { clipboard: { writeText } } as unknown as Navigator)).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("export");
  });
});

import type { ExportArtifact, ExportProfileSummary } from "./types";

export interface ExportOption {
  packId: string;
  packName: string;
  profile: ExportProfileSummary;
}

export interface ExportSubject {
  id: string;
  name: string;
  exportProfiles: ExportProfileSummary[];
}

export function buildExportOptions(subject: ExportSubject | null, target = "all"): ExportOption[] {
  if (!subject) {
    return [];
  }

  return subject.exportProfiles
    .filter((profile) => target === "all" || profile.target === target)
    .map((profile) => ({
      packId: subject.id,
      packName: subject.name,
      profile
    }));
}

export function getExportTargets(profiles: ExportProfileSummary[]): string[] {
  return Array.from(new Set(profiles.map((profile) => profile.target))).sort((left, right) => left.localeCompare(right));
}

export function createExportBlob(artifact: ExportArtifact): Blob {
  return new Blob([artifact.content], { type: artifact.mimeType });
}

export async function copyTextToClipboard(
  text: string,
  navigatorRef: Pick<Navigator, "clipboard"> | undefined = typeof navigator === "undefined" ? undefined : navigator,
  documentRef?: Document
): Promise<boolean> {
  const fallbackDocument = documentRef ?? (typeof document === "undefined" ? undefined : document);
  if (fallbackDocument) {
    try {
      if (copyTextWithDocument(text, fallbackDocument)) {
        return true;
      }
    } catch {
      // Fall back to the async Clipboard API when document commands are unavailable.
    }
  }

  if (navigatorRef?.clipboard?.writeText) {
    try {
      await withTimeout(navigatorRef.clipboard.writeText(text), 750);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

function copyTextWithDocument(text: string, documentRef: Document): boolean {
  const textarea = documentRef.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  documentRef.body.appendChild(textarea);
  textarea.select();

  try {
    return documentRef.execCommand("copy");
  } finally {
    textarea.remove();
  }
}

export function downloadExportArtifact(
  artifact: ExportArtifact,
  documentRef: Pick<Document, "createElement" | "body"> = document,
  urlApi: Pick<typeof URL, "createObjectURL" | "revokeObjectURL"> = URL
): void {
  const url = urlApi.createObjectURL(createExportBlob(artifact));
  const link = documentRef.createElement("a");
  link.href = url;
  link.download = artifact.filename;
  documentRef.body.appendChild(link);
  link.click();
  link.remove();
  urlApi.revokeObjectURL(url);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => reject(new Error("Clipboard timeout")), timeoutMs);
    promise.then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        globalThis.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

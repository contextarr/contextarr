export const brandMarkUrl = new URL("../../../assets/brand/svg/mini-mark.svg", import.meta.url).href;
export const faviconMarkUrl = new URL("../../../assets/brand/svg/favicon-mark.svg", import.meta.url).href;

export function installBrandMetadata(documentRef: Document = document): void {
  const existingIcon = documentRef.querySelector<HTMLLinkElement>('link[rel="icon"]');
  const icon = existingIcon ?? documentRef.createElement("link");
  icon.rel = "icon";
  icon.type = "image/svg+xml";
  icon.href = faviconMarkUrl;

  if (!existingIcon) {
    documentRef.head.appendChild(icon);
  }

  const theme = documentRef.querySelector<HTMLMetaElement>('meta[name="theme-color"]') ?? documentRef.createElement("meta");
  theme.name = "theme-color";
  theme.content = "#0B1020";

  if (!theme.parentElement) {
    documentRef.head.appendChild(theme);
  }
}

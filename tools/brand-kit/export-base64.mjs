import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const brandRoot = path.join(repoRoot, "assets", "brand");
const outRoot = path.join(brandRoot, "base64");

const sources = [
  { dir: path.join(brandRoot, "svg"), mime: "image/svg+xml", prefix: "svg" },
  { dir: path.join(brandRoot, "png"), mime: "image/png", prefix: "png" },
  { dir: path.join(brandRoot, "png", "small"), mime: "image/png", prefix: "small" },
];

async function directoryExists(dir) {
  try {
    return (await fs.stat(dir)).isDirectory();
  } catch {
    return false;
  }
}

async function main() {
  await fs.mkdir(outRoot, { recursive: true });
  const manifest = [];

  for (const source of sources) {
    if (!(await directoryExists(source.dir))) continue;
    const files = await fs.readdir(source.dir, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile()) continue;
      const ext = path.extname(file.name).toLowerCase();
      if (![".svg", ".png"].includes(ext)) continue;

      const inputPath = path.join(source.dir, file.name);
      const baseName = path.basename(file.name, ext);
      const outputName = `${source.prefix}-${baseName}`;
      const bytes = await fs.readFile(inputPath);
      const base64 = bytes.toString("base64");
      const dataUri = `data:${source.mime};base64,${base64}`;
      const base64Path = path.join(outRoot, `${outputName}.base64.txt`);
      const dataUriPath = path.join(outRoot, `${outputName}.data-uri.txt`);

      await fs.writeFile(base64Path, `${base64}\n`, "utf8");
      await fs.writeFile(dataUriPath, `${dataUri}\n`, "utf8");

      manifest.push({
        source: path.relative(repoRoot, inputPath).replaceAll("\\", "/"),
        mime: source.mime,
        bytes: bytes.length,
        base64: path.relative(repoRoot, base64Path).replaceAll("\\", "/"),
        dataUri: path.relative(repoRoot, dataUriPath).replaceAll("\\", "/"),
      });
    }
  }

  await fs.writeFile(path.join(outRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Exported ${manifest.length} base64/data URI pairs under ${path.relative(repoRoot, outRoot)}`);
}

await main();

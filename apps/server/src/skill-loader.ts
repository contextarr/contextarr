import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import {
  skillExportProfileSchema,
  skillInstructionFrontmatterSchema,
  skillManifestSchema,
  sourceMapSchema,
  type SkillManifest,
  type Source
} from "@contextarr/schema";
import { validateSkill } from "@contextarr/skill-validator";
import type { LoadedSkill, LoadedSkillDocument, LoadSkillsResult, SkippedSkill } from "./types";

export function loadSkills(skillsDir: string): LoadSkillsResult {
  if (!fs.existsSync(skillsDir) || !fs.statSync(skillsDir).isDirectory()) {
    return {
      skills: [],
      skipped: [
        {
          skillPath: skillsDir,
          issues: [
            {
              severity: "error",
              code: "skills_dir.missing",
              message: `Skills directory does not exist: ${skillsDir}`
            }
          ]
        }
      ]
    };
  }

  const skills: LoadedSkill[] = [];
  const skipped: SkippedSkill[] = [];

  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillPath = path.join(skillsDir, entry.name);
    const validation = validateSkill(skillPath);
    const manifest = readManifest(skillPath);

    if (!validation.valid || !manifest) {
      skipped.push({
        skillPath,
        skillId: manifest?.id,
        issues: validation.issues
      });
      continue;
    }

    try {
      skills.push({
        skillPath,
        manifest,
        validation,
        instructions: readSkillDocuments(skillPath, manifest, manifest.instructionsPath),
        examples: readSkillDocuments(skillPath, manifest, manifest.examplesPath),
        sources: readSources(skillPath, manifest),
        exportProfiles: readExportProfiles(skillPath, manifest)
      });
    } catch (error) {
      skipped.push({
        skillPath,
        skillId: manifest.id,
        issues: [
          {
            severity: "error",
            code: "skill_loader.read_failed",
            message: error instanceof Error ? error.message : String(error)
          }
        ]
      });
    }
  }

  return { skills, skipped };
}

function readManifest(skillPath: string): SkillManifest | undefined {
  const manifestPath = path.join(skillPath, "contextarr-skill.json");

  if (!fs.existsSync(manifestPath)) {
    return undefined;
  }

  try {
    return skillManifestSchema.parse(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
  } catch {
    return undefined;
  }
}

function readSkillDocuments(skillPath: string, manifest: SkillManifest, documentPath: string): LoadedSkillDocument[] {
  const documentDir = resolveManifestPath(skillPath, documentPath);
  const documents: LoadedSkillDocument[] = [];

  if (!documentDir || !fs.existsSync(documentDir) || !fs.statSync(documentDir).isDirectory()) {
    return documents;
  }

  for (const file of listFiles(documentDir).filter((documentFile) => documentFile.toLowerCase().endsWith(".md"))) {
    const parsed = matter(fs.readFileSync(file, "utf8"));
    documents.push({
      file: normalizePath(path.relative(skillPath, file)),
      metadata: skillInstructionFrontmatterSchema.parse(parsed.data),
      body: parsed.content.trim()
    });
  }

  return documents;
}

function readSources(skillPath: string, manifest: SkillManifest): Source[] {
  const sourceMapPath = resolveManifestPath(skillPath, manifest.sourcesPath);
  if (!sourceMapPath || !fs.existsSync(sourceMapPath)) {
    return [];
  }

  const sourceMap = sourceMapSchema.parse(YAML.parse(fs.readFileSync(sourceMapPath, "utf8")));
  return sourceMap.sources;
}

function readExportProfiles(skillPath: string, manifest: SkillManifest) {
  const exportsDir = resolveManifestPath(skillPath, manifest.exportsPath);
  if (!exportsDir || !fs.existsSync(exportsDir) || !fs.statSync(exportsDir).isDirectory()) {
    return [];
  }

  return listFiles(exportsDir)
    .filter((file) => [".yaml", ".yml"].includes(path.extname(file).toLowerCase()))
    .map((file) => skillExportProfileSchema.parse(YAML.parse(fs.readFileSync(file, "utf8"))));
}

function listFiles(root: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    return files;
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function resolveManifestPath(skillPath: string, manifestPath: string): string | undefined {
  const root = path.resolve(skillPath);
  const resolved = path.resolve(root, manifestPath);
  const relative = path.relative(root, resolved);

  if (path.isAbsolute(manifestPath) || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return undefined;
  }

  return resolved;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

import fs from "node:fs";
import path from "node:path";
import {
  validateAgentKitTemplate,
  type AgentKitValidationIssue,
  type AgentKitTemplateValidationResult
} from "@contextarr/agent-kit-validator";
import type { AgentKitTemplate } from "@contextarr/schema";

export interface LoadedAgentKitTemplate {
  templatePath: string;
  template: AgentKitTemplate;
  validation: AgentKitTemplateValidationResult;
}

export interface SkippedAgentKitTemplate {
  templatePath: string;
  templateId?: string;
  issues: AgentKitValidationIssue[];
}

export interface LoadAgentKitTemplatesOptions {
  templatesDir: string;
  contextPacksDir: string;
  skillsDir: string;
}

export interface LoadAgentKitTemplatesResult {
  templates: LoadedAgentKitTemplate[];
  skipped: SkippedAgentKitTemplate[];
}

export function loadAgentKitTemplates(options: LoadAgentKitTemplatesOptions): LoadAgentKitTemplatesResult {
  const root = path.resolve(options.templatesDir);
  if (!fs.existsSync(root)) {
    return { templates: [], skipped: [] };
  }

  if (!fs.statSync(root).isDirectory()) {
    return {
      templates: [],
      skipped: [
        {
          templatePath: displayPath(root),
          issues: [
            {
              severity: "error",
              code: "agent_kit_template_root.not_directory",
              message: "Agent Kit template root must be a directory."
            }
          ]
        }
      ]
    };
  }

  const templates: LoadedAgentKitTemplate[] = [];
  const skipped: SkippedAgentKitTemplate[] = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true }).filter((item) => item.isDirectory())) {
    const templatePath = path.join(root, entry.name);
    const validation = validateAgentKitTemplate(templatePath, {
      contextPacksDir: options.contextPacksDir,
      skillsDir: options.skillsDir
    });

    if (validation.valid && validation.template) {
      templates.push({ templatePath: validation.templatePath, template: validation.template, validation });
    } else {
      skipped.push({
        templatePath: validation.templatePath,
        templateId: validation.templateId,
        issues: validation.issues
      });
    }
  }

  templates.sort((left, right) => left.template.name.localeCompare(right.template.name));
  skipped.sort((left, right) => left.templatePath.localeCompare(right.templatePath));

  return { templates, skipped };
}

export function getAgentKitTemplate(
  templates: LoadedAgentKitTemplate[],
  id: string
): LoadedAgentKitTemplate | undefined {
  return templates.find((template) => template.template.id === id);
}

function displayPath(value: string): string {
  const cwd = path.resolve(process.env.INIT_CWD ?? process.cwd());
  const relative = path.relative(cwd, path.resolve(value));
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return relative.replace(/\\/g, "/");
  }

  return path.basename(value);
}

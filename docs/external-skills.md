# External Skills

Status: future import and packaging direction. Current Contextarr Native Skills are data-only and non-executable. Current `import-skill` flows generate private draft Contextarr Skills and skip executable or script-like files. This document records the desired next model for pre-made external Skills.

## Core Distinction

Use three classes:

| Class | Meaning | Execution |
|---|---|---|
| Contextarr Native Skill | Data-only Contextarr instruction artifact. | Never executed by Contextarr. |
| External Skill Artifact | Original Skill folder imported from Claude, Codex, Copilot, Agent Skills spec, or another ecosystem. May contain scripts, references, assets, or templates. | Never executed by Contextarr. |
| Adapted Skill | Contextarr-generated safe view of an External Skill Artifact. | Never executed by Contextarr. |

The corrected product rule is:

```text
Preserve external Skills as artifacts.
Classify and warn honestly.
Never execute them.
```

## Current Behavior

Current local Skill importers:

- Support folder, Markdown, prompt template, Claude Skill, and ChatGPT prompt inputs.
- Create a private unreviewed Contextarr Native Skill draft.
- Tag imported documents with `imported_draft` and `never_export`.
- Skip script-like files, executable extensions, unsafe paths, shell-command patterns, and credential-like content.

That behavior is safe for the current core gate, but it is not the final external Skill manager model.

## Future Artifact Layout

A future external Skill archive should preserve the original artifact and add Contextarr sidecars:

```text
external-skills/
  imported-claude-log-analysis/
    original/
      SKILL.md
      scripts/
      references/
      assets/
    contextarr-import.json
    contextarr-safety-report.json
    contextarr-compatibility-report.json
    contextarr-review.md
    adapted/
      contextarr-skill.json
      instructions/
      examples/
```

The `original/` folder remains untrusted source material. The `adapted/` folder, if present, is the safe Contextarr-native view.

## Capability Classification

External Skill artifacts should be classified instead of flattened into safe/unsafe:

- `instruction_only`
- `reference_bearing`
- `asset_bearing`
- `template_bearing`
- `script_bearing`
- `tool_requesting`
- `network_capable`
- `credential_requesting`
- `browser_automation`
- `unknown`
- `blocked`

Classification should drive warnings, export eligibility, and compatible targets.

## Import States

External Skills should move through states:

- Imported.
- Scanned.
- Classified.
- Quarantined.
- Reviewed.
- Approved for storage.
- Approved for export.
- Blocked.

There should be no `approved for execution` state in Contextarr.

There is no `approved_for_execution` state in Contextarr. Script-bearing imported Skills remain untrusted source material or data-only drafts; Contextarr may classify, warn, preserve later, and export compatible bundles later, but it must not turn script-bearing Skills into executable local capabilities.

## Export Modes

Future external Skill exports should support:

| Mode | Purpose |
|---|---|
| Summary-only | Safe text summary for ChatGPT or generic Markdown targets. Scripts and raw executable resources excluded. |
| Native Skill bundle | Original folder plus Contextarr safety and compatibility reports for compatible downstream runtimes. Requires explicit approval. |
| Agent Kit bundle | Context Pack export, selected Skill artifact, reports, redaction report, and Agent Kit manifest. |
| Target adapter | A layout tailored to Claude Code, Codex, Copilot, OpenCode, or generic folder conventions. |

Every export must state:

- Contextarr does not execute this Skill.
- Downstream runtime may treat script-bearing Skills differently.
- Script-bearing, network-capable, or credential-requesting artifacts require explicit user approval before export.

## Safety Defaults

| Finding | Default |
|---|---|
| Script exists | Warning and explicit export approval required. |
| Network URL exists | High-risk warning. |
| Webhook URL exists | High-risk warning. |
| Credential request exists | Block export by default. |
| Hidden instruction exists | Block. |
| Exfiltration language exists | Block. |
| Destructive shell command exists | Block. |
| Binary payload exists | Quarantine. |

## Relationship To Context Packs

Skills may contain intrinsic method context such as templates, rubrics, examples, and lightweight reference material.

Context Packs own grounding context such as project state, account facts, user preferences, source-backed operational records, and current constraints.

Agent Kits intentionally pair the two.

## Current Boundary

Do not change current validation to allow executable Contextarr Native Skills without a separate scoped implementation plan. The next step should be an external artifact archive and classifier, not weakening the Native Skill schema.

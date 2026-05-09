import type { SecurityFindingCategory, SecurityFindingSeverity, SecurityRecommendedAction } from "./types";

export const DEFAULT_SECURITY_SCANNER_VERSION = "contextarr-security-scanner.v0";

export interface FilePolicy {
  code: string;
  severity: SecurityFindingSeverity;
  category: SecurityFindingCategory;
  message: string;
  recommendedAction: SecurityRecommendedAction;
  blocking: boolean;
  ruleId: string;
  confidence: number;
}

export interface TextPolicy extends FilePolicy {
  pattern: RegExp;
}

export const SCRIPT_AND_EXECUTABLE_EXTENSIONS = new Map<string, FilePolicy>([
  [
    ".exe",
    {
      code: "scan.executable_file",
      severity: "critical",
      category: "executable_file",
      message: "Executable files are not allowed in Contextarr artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.executable_extension",
      confidence: 0.99
    }
  ],
  [
    ".com",
    {
      code: "scan.executable_file",
      severity: "critical",
      category: "executable_file",
      message: "Executable files are not allowed in Contextarr artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.executable_extension",
      confidence: 0.99
    }
  ],
  [
    ".dll",
    {
      code: "scan.executable_file",
      severity: "critical",
      category: "executable_file",
      message: "Executable binary files are not allowed in Contextarr artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.executable_extension",
      confidence: 0.99
    }
  ],
  [
    ".msi",
    {
      code: "scan.executable_file",
      severity: "critical",
      category: "executable_file",
      message: "Executable installer files are not allowed in Contextarr artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.executable_extension",
      confidence: 0.99
    }
  ],
  [
    ".ps1",
    {
      code: "scan.script_file",
      severity: "critical",
      category: "script_file",
      message: "Script files are not allowed in Contextarr artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.script_extension",
      confidence: 0.99
    }
  ],
  [
    ".sh",
    {
      code: "scan.script_file",
      severity: "critical",
      category: "script_file",
      message: "Script files are not allowed in Contextarr artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.script_extension",
      confidence: 0.99
    }
  ],
  [
    ".bat",
    {
      code: "scan.script_file",
      severity: "critical",
      category: "script_file",
      message: "Script files are not allowed in Contextarr artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.script_extension",
      confidence: 0.99
    }
  ],
  [
    ".cmd",
    {
      code: "scan.script_file",
      severity: "critical",
      category: "script_file",
      message: "Script files are not allowed in Contextarr artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.script_extension",
      confidence: 0.99
    }
  ],
  [
    ".cjs",
    {
      code: "scan.script_file",
      severity: "critical",
      category: "script_file",
      message: "JavaScript files are treated as executable content and blocked for v0/v1 artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.script_extension",
      confidence: 0.95
    }
  ],
  [
    ".js",
    {
      code: "scan.script_file",
      severity: "critical",
      category: "script_file",
      message: "JavaScript files are treated as executable content and blocked for v0/v1 artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.script_extension",
      confidence: 0.95
    }
  ],
  [
    ".mjs",
    {
      code: "scan.script_file",
      severity: "critical",
      category: "script_file",
      message: "JavaScript files are treated as executable content and blocked for v0/v1 artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.script_extension",
      confidence: 0.95
    }
  ],
  [
    ".py",
    {
      code: "scan.script_file",
      severity: "critical",
      category: "script_file",
      message: "Script files are not allowed in Contextarr artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.script_extension",
      confidence: 0.95
    }
  ],
  [
    ".rb",
    {
      code: "scan.script_file",
      severity: "critical",
      category: "script_file",
      message: "Script files are not allowed in Contextarr artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.script_extension",
      confidence: 0.95
    }
  ],
  [
    ".vbs",
    {
      code: "scan.script_file",
      severity: "critical",
      category: "script_file",
      message: "Script files are not allowed in Contextarr artifacts.",
      recommendedAction: "block",
      blocking: true,
      ruleId: "file.script_extension",
      confidence: 0.95
    }
  ]
]);

export const TEXT_FILE_EXTENSIONS = new Set([
  ".json",
  ".md",
  ".txt",
  ".yaml",
  ".yml",
  ".toml",
  ".csv",
  ".html"
]);

export const BINARY_FILE_EXTENSIONS = new Set([
  ".zip",
  ".gz",
  ".tar",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".db",
  ".sqlite",
  ".wasm"
]);

export const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".contextarr-cache",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "generated-exports",
  "rendered"
]);

export const TEXT_POLICIES: TextPolicy[] = [
  {
    code: "scan.secret.private_key",
    severity: "critical",
    category: "secret",
    message: "Private key material is not allowed in Contextarr artifacts.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "secret.private_key_marker",
    confidence: 0.99,
    pattern: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/i
  },
  {
    code: "scan.secret.api_key",
    severity: "critical",
    category: "secret",
    message: "Credential-like API key content is not allowed in Contextarr artifacts.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "secret.api_key_assignment",
    confidence: 0.8,
    pattern: /\b(api[_-]?key|secret[_-]?key)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{20,}/i
  },
  {
    code: "scan.secret.token",
    severity: "critical",
    category: "secret",
    message: "Token-like credential content is not allowed in Contextarr artifacts.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "secret.token_assignment",
    confidence: 0.75,
    pattern: /\b(token|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{24,}/i
  },
  {
    code: "scan.credential_request",
    severity: "critical",
    category: "credential_request",
    message: "Artifacts must not ask users or agents to provide credentials.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "credential.request",
    confidence: 0.85,
    pattern: /\b(enter|provide|paste|send|share)\b.{0,50}\b(password|api key|token|private key|credential|secret)\b/i
  },
  {
    code: "scan.shell_pipe_to_shell",
    severity: "critical",
    category: "shell_command",
    message: "Piping remote content to a shell is blocked.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "shell.pipe_to_shell",
    confidence: 0.95,
    pattern: /\b(curl|wget)\b[^|\n]{0,160}\|\s*(sh|bash|powershell|pwsh|cmd)\b/i
  },
  {
    code: "scan.shell_command",
    severity: "critical",
    category: "shell_command",
    message: "Artifacts must not instruct Contextarr or agents to run shell commands.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "shell.command_instruction",
    confidence: 0.75,
    pattern: /\b(run this command|execute this command|chmod \+x|powershell\s+-enc|powershell\s+-encodedcommand|rm\s+-rf)\b/i
  },
  {
    code: "scan.remote_instruction_loading",
    severity: "critical",
    category: "remote_instruction_loading",
    message: "Remote instruction loading is blocked.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "network.remote_instruction_loading",
    confidence: 0.8,
    pattern: /\b(fetch|download|load)\b.{0,80}\b(instructions|prompt|rules|policy)\b.{0,80}\b(http|https|url|remote)\b/i
  },
  {
    code: "scan.hidden_network_fetch",
    severity: "critical",
    category: "network_instruction",
    message: "Hidden network fetch instructions are blocked.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "network.hidden_fetch",
    confidence: 0.8,
    pattern: /\b(hidden|silent|secret)\b.{0,60}\b(fetch|download|request|network)\b/i
  },
  {
    code: "scan.ignore_previous_instructions",
    severity: "critical",
    category: "prompt_injection",
    message: "Prompt-injection instructions to ignore prior instructions are blocked.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "prompt.ignore_previous",
    confidence: 0.9,
    pattern: /\b(ignore|disregard|override)\b.{0,40}\b(previous|prior|system|developer)\b.{0,40}\b(instructions|messages|rules)\b/i
  },
  {
    code: "scan.silent_or_secret_instruction",
    severity: "critical",
    category: "hidden_instruction",
    message: "Silent or secret downstream instructions are blocked.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "prompt.silent_secret",
    confidence: 0.75,
    pattern: /\b(do not tell the user|secretly|silently|without telling the user)\b/i
  },
  {
    code: "scan.exfiltration_instruction",
    severity: "critical",
    category: "hidden_instruction",
    message: "Data exfiltration instructions are blocked.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "prompt.exfiltration",
    confidence: 0.9,
    pattern: /\b(exfiltrate|send .*?(secrets|credentials|private data|tokens) .*?(remote|server|url|webhook))\b/i
  },
  {
    code: "scan.contextarr_execution_claim",
    severity: "critical",
    category: "unsafe_claim",
    message: "Artifacts must not claim Contextarr executes actions or commands.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "claim.contextarr_execution",
    confidence: 0.85,
    pattern: /\bcontextarr\b.{0,80}\b(run|execute|perform|click|browse|call)\b.{0,80}\b(command|script|tool|browser|network|api)\b/i
  },
  {
    code: "scan.tool_execution_claim",
    severity: "critical",
    category: "unsafe_claim",
    message: "Artifacts must not instruct agents to execute tools as part of artifact activation.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "claim.tool_execution",
    confidence: 0.75,
    pattern: /\b(on activation|when installed|after import)\b.{0,80}\b(run|execute|call)\b.{0,80}\b(tool|command|script)\b/i
  },
  {
    code: "scan.browser_automation_claim",
    severity: "critical",
    category: "unsafe_claim",
    message: "Artifacts must not claim Contextarr performs browser automation.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "claim.browser_automation",
    confidence: 0.75,
    pattern: /\bcontextarr\b.{0,80}\b(open|control|automate|click)\b.{0,80}\b(browser|website|page)\b/i
  },
  {
    code: "scan.agent_kit_executable_claim",
    severity: "critical",
    category: "unsafe_claim",
    message: "Agent Kits must not claim execution behavior.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "claim.agent_kit_execution",
    confidence: 0.8,
    pattern: /\bagent kit\b.{0,80}\b(run|execute|perform actions|call tools)\b/i
  },
  {
    code: "scan.hidden_unicode",
    severity: "critical",
    category: "unicode_invisible_text",
    message: "Invisible Unicode control characters are blocked.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "obfuscation.hidden_unicode",
    confidence: 0.9,
    pattern: /[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/
  },
  {
    code: "scan.obfuscated_payload",
    severity: "critical",
    category: "obfuscation",
    message: "Obfuscated command payloads are blocked.",
    recommendedAction: "block",
    blocking: true,
    ruleId: "obfuscation.encoded_command",
    confidence: 0.8,
    pattern: /\b(frombase64string|base64\s+(-d|--decode)|encodedcommand)\b.{0,120}\b(sh|bash|powershell|cmd|iex|invoke-expression)\b/i
  },
  {
    code: "scan.suspicious_authority_claim",
    severity: "medium",
    category: "prompt_injection",
    message: "Suspicious authority claim should be reviewed by a human.",
    recommendedAction: "review",
    blocking: false,
    ruleId: "prompt.suspicious_authority",
    confidence: 0.55,
    pattern: /\b(system prompt|developer message|highest priority|override the user)\b/i
  },
  {
    code: "scan.suspicious_mismatch",
    severity: "medium",
    category: "unknown",
    message: "Suspicious mismatch language should be reviewed by a human.",
    recommendedAction: "review",
    blocking: false,
    ruleId: "content.suspicious_mismatch",
    confidence: 0.5,
    pattern: /\b(mark public-safe|label as safe)\b.{0,80}\b(private|secret|credential|sensitive)\b/i
  }
];

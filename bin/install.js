#!/usr/bin/env node

import * as p from "@clack/prompts";
import { mkdirSync, cpSync, readdirSync } from "fs";
import { join, resolve, dirname } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Available skills (auto-detected from skills/ folder) ─────────────────
const skillsDir = resolve(__dirname, "..", "skills");
const skills = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

if (skills.length === 0) {
  p.cancel("No skills found in the skills/ directory.");
  process.exit(1);
}

// ─── Agent destinations ────────────────────────────────────────────────────
const AGENTS = [
  {
    value: "copilot",
    label: "GitHub Copilot",
    hint: ".github/skills/",
    rel: ".github/skills",
  },
  {
    value: "claude",
    label: "Claude Code",
    hint: ".claude/skills/",
    rel: ".claude/skills",
  },
  {
    value: "codex",
    label: "OpenAI Codex CLI",
    hint: ".codex/skills/",
    rel: ".codex/skills",
  },
  {
    value: "cursor",
    label: "Cursor",
    hint: ".cursor/rules/",
    rel: ".cursor/rules",
  },
  {
    value: "windsurf",
    label: "Windsurf",
    hint: ".windsurf/rules/",
    rel: ".windsurf/rules",
  },
  {
    value: "agents",
    label: "General agents",
    hint: ".agents/skills/",
    rel: ".agents/skills",
  },
  {
    value: "global",
    label: "User-global",
    hint: "~/.agents/skills/ — applies to all projects",
    abs: join(homedir(), ".agents", "skills"),
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────
p.intro(" n8n Custom Node Skill Installer ");

const cwd = process.env.INIT_CWD || process.cwd();

const responses = await p.group(
  {
    skill: () =>
      skills.length === 1
        ? Promise.resolve(skills[0])
        : p.select({
            message: "Which skill do you want to install?",
            options: skills.map((s) => ({ value: s, label: s })),
          }),

    agent: () =>
      p.select({
        message: "Install for which coding agent?",
        options: AGENTS,
      }),
  },
  {
    onCancel: () => {
      p.cancel("Installation cancelled.");
      process.exit(0);
    },
  },
);

const agent = AGENTS.find((a) => a.value === responses.agent);
const destBase = agent.abs ?? join(cwd, agent.rel);
const dest = join(destBase, responses.skill);

const confirmed = await p.confirm({ message: `Install to ${dest}?` });

if (p.isCancel(confirmed) || !confirmed) {
  p.cancel("Installation cancelled.");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(join(skillsDir, responses.skill), dest, { recursive: true });

p.outro(`Installed ${responses.skill}  →  ${dest}`);

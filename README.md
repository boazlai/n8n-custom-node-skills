# n8n Custom Node Skills

A portable skill pack for AI coding agents (GitHub Copilot, Claude Code, Cursor, Windsurf, Codex CLI) that teaches them how to build production-grade n8n community nodes, including AI tool and vector store / hybrid-search nodes.

Install it into your preferred agent, then ask for an n8n custom node and it will follow the correct scaffold, runtime architecture, testing loop, and publishing path.

## What's Included

### Skill: `n8n-custom-community-node`

Covers the complete lifecycle of building and publishing an n8n community node:

| Topic                    | What you get                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Node variants**        | Standard (`Main→Main`), AI Tool (`AiTool + supplyData`), Vector Store (`AiTool + AiEmbedding + AiReranker`)                                 |
| **Two-phase invocation** | Deep explanation of how n8n calls `supplyData()` at setup vs `execute()` at runtime                                                         |
| **Build & test**         | `npm run build`, embedded dev server, Docker copy method, npm link method                                                                   |
| **Publish & verify**     | `npm run release`, GitHub Actions provenance (required from May 1 2026), n8n Creator Portal checklist                                       |
| **Common pitfalls**      | 10 documented gotchas with fixes (Zod cross-instance, `logWrapper` unavailability, reranker toggle guard, action/trigger merge rules, etc.) |
| **Templates**            | Ready-to-use TypeScript scaffolds for all 3 node variants                                                                                   |
| **Native vs community**  | Reverse-engineered comparison of n8n v2.12.3 internals vs what community nodes can import                                                   |

## Install

Run the interactive installer from your project directory:

```bash
npx n8n-custom-node
```

The CLI will ask:

1. **Which skill** to install (auto-detected from the package)
2. **Which coding agent** to install for — navigate with arrow keys, press Enter to select:

| Agent            | Installs to                        |
| ---------------- | ---------------------------------- |
| GitHub Copilot   | `.github/skills/`                  |
| Claude Code      | `.claude/skills/`                  |
| OpenAI Codex CLI | `.codex/skills/`                   |
| Cursor           | `.cursor/rules/`                   |
| Windsurf         | `.windsurf/rules/`                 |
| General agents   | `.agents/skills/`                  |
| User-global      | `~/.agents/skills/` (all projects) |

3. **Confirm** the destination path — press Enter to install

Once installed, the AI agent can pick up the skill automatically when you ask it to build or review n8n custom nodes.

## Example

```
npx n8n-custom-node

┌   n8n Custom Node Skill Installer
│
◇  Which skill do you want to install?
│  n8n-custom-community-node
│
◇  Install for which coding agent?
│  GitHub Copilot  (.github/skills/)
│
◇  Install to /your/project/.github/skills/n8n-custom-community-node?
│  Yes
│
└  Installed n8n-custom-community-node → /your/project/.github/skills/n8n-custom-community-node
```

## What the Skill Teaches Your Agent

After installation, when you ask your AI agent to build an n8n community node, it will:

- Use the correct `AiTool + supplyData() + execute()` architecture (not the simplified `usableAsTool` shortcut)
- Know that `execute()` must handle two contexts: empty-input setup phase and real agent invocations
- Use plain JSON Schema for `DynamicStructuredTool` (not Zod, which fails across module boundaries)
- Guard optional reranker connections behind a toggle — not fetch them unconditionally
- Return structured `{ json: doc }` items from `execute()`, not `JSON.stringify(...)` blobs
- Avoid importing `logWrapper` or `createToolFromNode` from `@n8n/ai-utilities` (unreachable from community nodes)
- Model native-style action/trigger pairing correctly: keep triggers in a separate trigger node named `<actionNodeName>Trigger`, and do not rely on icon matching for node-creator merging

## Skill File Structure

```text
skills/n8n-custom-community-node/
  SKILL.md                          ← entry point, variant picker
  references/
    shared-foundations.md           ← CLI, scaffold, testing, publishing
    normal-node.md                  ← Main→Main node pattern
    tool-node.md                    ← AiTool node pattern
    vector-store-node.md            ← Vector store / hybrid search pattern
    native-vs-custom.md             ← n8n internals comparison (v2.12.3)
  assets/
    normal-node.template.ts         ← TypeScript scaffold
    tool-node.template.ts
    vector-store-node.template.ts   ← Production-grade with addInputData tracking
```

## License

MIT

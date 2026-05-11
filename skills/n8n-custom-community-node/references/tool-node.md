# AI Tool Node Pattern

Use this path for a custom node that an n8n AI Agent should call as a tool.

## Use When

- The node should output `AiTool`.
- The node is selected by an AI Agent rather than only by main data-flow routing.
- The node must register a tool definition through `supplyData()`.

## Required Architecture: Two-Phase Invocation

Implement **both** methods. They serve completely different roles:

### Phase 1 — `supplyData()`: Schema Registration (setup time)

Called once when the agent is configured. Registers the tool name, description, and
JSON schema with LangChain. The `func` callback inside `DynamicStructuredTool` is a
**dead stub** — it is **never called** by the n8n agent runtime. It must exist to
satisfy the TypeScript interface but put no real logic there.

```typescript
async supplyData(this: ISupplyDataFunctions): Promise<SupplyData> {
  const { DynamicStructuredTool } = require('@langchain/core/tools');
  const tool = new DynamicStructuredTool({
    name: 'myToolName',
    description: 'What this tool does and how to call it.',
    schema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'JSON string: {"action":"doSomething","param":"value"}',
        },
      },
      required: ['input'],
    },
    func: async (_payload: unknown) => {
      // DEAD STUB — never called by the n8n agent runtime.
      return 'Runtime execution happens through the node execution path.';
    },
  });
  return { response: tool };
}
```

### Phase 2 — `execute()`: Real Logic (runtime, every tool call)

Called by the n8n agent runtime each time the AI invokes the tool. The agent passes
the tool's arguments as a **plain JSON string** in `items[0].json.input`. Do not
look for individual fields like `items[0].json.action` — the entire payload arrives
as one raw string in `input`.

```typescript
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const raw = String(items[0]?.json?.input ?? '').trim();

  // Empty = setup/partial run, not a real tool call
  if (!raw) return [[]];

  let parsed: { action: string; param?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [[{ json: { output: `Error: input must be valid JSON. Got: ${raw}` } }]];
  }

  const result = doRealWork(parsed);
  return [[{ json: { output: result } }]];
}
```

Keep the connection shape explicit:

- `outputs: [NodeConnectionTypes.AiTool]`
- `inputs` should list only the sub-node dependencies the tool actually needs.

## Schema Rule

**Always** use `DynamicStructuredTool` with a plain JSON Schema object (not Zod).
If you use `DynamicTool` or pass a Zod schema to `DynamicStructuredTool`, the agent
will fail with: `"schema must be a JSON Schema of 'type: \"object\"', got 'type: \"None\"'"`.

Use a single `input: string` property. The AI Agent will pass all its arguments as
one JSON string inside that field. If your tool accepts multiple parameters (e.g.,
`action` and `type`), the AI encodes them as JSON and your `execute()` parses them:

```
// AI calls with: { "input": "{\"action\":\"getGuide\",\"type\":\"echarts\"}" }
// execute() receives: items[0].json.input === '{"action":"getGuide","type":"echarts"}'
```

## Output Rule

Return ordinary n8n items from runtime execution. Preserve arrays and objects as
structured values instead of stringifying them unless the downstream contract
explicitly requires a string.

## Common Pitfalls

- **Putting logic in `func`**: `func` is never called. All real logic belongs in `execute()`.
- **Reading individual fields**: The agent does NOT put `action`, `type`, etc. as separate `items[0].json` keys. Everything arrives as a raw JSON string in `items[0].json.input`.
- **Using `DynamicTool` or Zod**: Causes a "type: None" OpenAI schema error. Use `DynamicStructuredTool` with a plain JSON Schema object.
- **Building only `supplyData()` and forgetting `execute()`**: Node will show "Success in 0s" with 0 output items.
- **Registering `AiTool` output but still wiring the node like a standard `Main` node**.
- **Leaving stale `dist/` output in place and testing the wrong artifact**.

## Starter Template

Use `../assets/tool-node.template.ts` as the starting point.

---

## Quick Start

```bash
# Scaffold (programmatic style — required for AiTool nodes)
npm create @n8n/node@latest my-package -- --template programmatic/example
cd my-package
# Replace the generated node class with the AiTool + supplyData() architecture
npm run build
npm run dev   # starts n8n at localhost:5678 with hot-reload
```

Note: The scaffold templates generate standard nodes. Switch to the AiTool architecture manually using `../assets/tool-node.template.ts`.

---

## Official Documentation Links

| Topic                           | URL                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| AI sub-nodes overview           | https://docs.n8n.io/integrations/builtin/cluster-nodes/                                                            |
| Programmatic node tutorial      | https://docs.n8n.io/integrations/creating-nodes/build/programmatic-style-node/                                     |
| Node base file (execute method) | https://docs.n8n.io/integrations/creating-nodes/build/reference/node-base-files/programmatic-style-execute-method/ |
| CLI tool (n8n-node)             | https://docs.n8n.io/integrations/creating-nodes/build/n8n-node/                                                    |
| Node linter                     | https://docs.n8n.io/integrations/creating-nodes/test/node-linter/                                                  |

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError, nodeNameToToolName } from 'n8n-workflow';

// ─── Input type ────────────────────────────────────────────────────────────────
// The AI Agent always sends a single JSON string in items[0].json.input.
// Define the shape you expect after parsing that string.
type ToolInput = {
	action: string;
	param?: string;
};

// ─── Node class ────────────────────────────────────────────────────────────────
export class ExampleToolNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Example Tool Node',
		name: 'exampleToolNode',
		group: ['transform'],
		version: 1,
		description: 'Example custom community node that exposes an AI tool',
		defaults: {
			name: 'Example Tool Node',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiTool],
		properties: [
			{
				displayName: 'Tool Description',
				name: 'toolDescription',
				type: 'string',
				typeOptions: { rows: 3 },
				default: 'Use this tool to process a plain-text request.',
			},
		],
	};

	// ─── PHASE 1: Schema registration ──────────────────────────────────────────
	// Called once at agent setup time. Registers the tool name, description, and
	// JSON schema with LangChain so the AI knows how to call this node.
	//
	// CRITICAL: Use DynamicStructuredTool with a PLAIN JSON Schema object (not Zod).
	// Using DynamicTool or a Zod schema causes:
	//   "schema must be a JSON Schema of 'type: \"object\"', got 'type: \"None\"'"
	//
	// CRITICAL: `func` is a DEAD STUB — it is NEVER called by the n8n agent
	// runtime. The agent always routes execution through execute() below.
	// Do NOT put real logic here.
	async supplyData(this: ISupplyDataFunctions): Promise<SupplyData> {
		const { DynamicStructuredTool } = require('@langchain/core/tools');
		const description = this.getNodeParameter('toolDescription', 0) as string;

		const tool = new DynamicStructuredTool({
			name: nodeNameToToolName(this.getNode()),
			description,
			// Single `input` property — the AI packs all its arguments as a JSON
			// string into this field. execute() receives and parses it.
			schema: {
				type: 'object',
				properties: {
					input: {
						type: 'string',
						description: 'JSON string with action and optional params. Example: {"action":"doSomething","param":"value"}',
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

	// ─── PHASE 2: Real execution ────────────────────────────────────────────────
	// Called by the n8n agent runtime every time the AI invokes the tool.
	//
	// How the AI's arguments arrive:
	//   items[0].json.input = '{"action":"doSomething","param":"value"}'
	//
	// The entire payload is ONE raw JSON string in items[0].json.input.
	// Individual fields (action, param, etc.) are NOT separate keys on json.
	// Parse the string to access them.
	//
	// items[0].json.input is empty on partial/setup runs — return [[]] in that case.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const raw = String(items[0]?.json?.input ?? '').trim();

		// Empty = setup run or no input — not a real tool call
		if (!raw) return [[]];

		// Parse the JSON string the AI sent
		let input: ToolInput;
		try {
			input = JSON.parse(raw) as ToolInput;
		} catch {
			return [[{ json: { output: `Error: input must be valid JSON. Got: ${raw}` } }]];
		}

		if (!input.action) {
			throw new NodeOperationError(this.getNode(), 'Tool input must include an "action" field');
		}

		// ── Put your real logic here ──────────────────────────────────────────
		const result = {
			action: input.action,
			param: input.param ?? null,
			handled: true,
		};
		// ─────────────────────────────────────────────────────────────────────

		return [[{ json: { output: result } }]];
	}

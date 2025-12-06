import type { CustomContext } from "../bot/telegram.js";
import { searchMessages } from "./embedder/messages.js";

export type ToolName = "send_message" | "search_messages";

export type ToolCall = {
	function: ToolName;
	args: Record<string, unknown>;
};

export type ToolDefinition = {
	name: ToolName;
	description: string;
	parameters: Record<string, unknown>;
	required: string[];
	execute: (
		context: CustomContext,
		// biome-ignore lint/suspicious/noExplicitAny: TODO
		input: any,
	) => Promise<unknown>;
};

async function executeSendMessage(
	context: CustomContext,
	input: { text: string },
) {
	const text = String(input.text ?? "<empty>");
	const message = await context.reply(text);
	return {
		messageId: message.message_id,
		output: null,
	};
}

async function executeSearchMessages(
	context: CustomContext,
	input: {
		query: string;
		dateMin?: string;
		dateMax?: string;
	},
) {
	const startDate = input.dateMin ? new Date(input.dateMin) : undefined;
	const endDate = input.dateMax ? new Date(input.dateMax) : undefined;
	if (startDate && endDate && startDate >= endDate) {
		return {
			output: [],
		};
	}
	const query = String(input.query ?? "");
	const results = await searchMessages({
		client: context.embeddings.client,
		embedder: context.embeddings.embedder,
		query,
		chatId: context.chat?.id,
		dateMin: startDate,
		dateMax: endDate,
	});
	return {
		output: results,
	};
}

export const toolDefinitions: ToolDefinition[] = [
	{
		name: "send_message",
		description:
			"Send a text message. This is the main way to communicate and provide response to the user.",
		parameters: {
			text: { type: "string" },
			last_call: { type: "boolean" },
		},
		required: ["text", "last_call"],
		execute: executeSendMessage,
	},
	{
		name: "search_messages",
		description: "Search messages in the chat.",
		parameters: {
			query: { type: "string" },
			dateMin: { type: "string" },
			dateMax: { type: "string" },
			last_call: { type: "boolean" },
		},
		required: ["query", "last_call"],
		execute: executeSearchMessages,
	},
];

export async function executeTool(
	context: CustomContext,
	call: ToolCall,
): Promise<unknown> {
	console.log(
		`EXECUTING TOOL: ${call.function} (${JSON.stringify(call.args)})`,
	);
	const definition = toolDefinitions.find(
		(tool) => tool.name === call.function,
	);
	if (!definition) return null;
	return definition.execute(context, call.args);
}

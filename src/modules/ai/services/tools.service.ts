import type { Tool } from "ollama";
import type { CustomContext } from "../../bot/types/telegram.js";
import { searchMessages } from "../../embeddings/services/chat.service.js";

export type ToolName = "send_message" | "search_messages" | "finish";

export type ToolDefinition = {
	name: ToolName;
	description: string;
	parameters: Record<string, unknown>;
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
	const text = String(input.text ?? "");
	await context.reply(text);
	return null;
}

async function executeSearchMessages(
	context: CustomContext,
	input: {
		query: string;
		dateMin?: string;
		dateMax?: string;
	},
) {
	const query = String(input.query ?? "");
	const results = await searchMessages({
		client: context.embeddings.client,
		embedder: context.embeddings.embedder,
		query,
		chatId: context.chat?.id,
		dateMin: input.dateMin ? new Date(input.dateMin) : undefined,
		dateMax: input.dateMax ? new Date(input.dateMax) : undefined,
	});
	return results;
}

async function executeFinish(
	_context: CustomContext,
	_input: Record<string, never>,
) {
	return null;
}

const toolDefinitions: ToolDefinition[] = [
	{
		name: "send_message",
		description:
			"Reply to the user with a text message. This is the main way to communicate and provide response to the user.",
		parameters: {
			type: "object",
			properties: {
				text: { type: "string" },
			},
			required: ["text"],
		},
		execute: executeSendMessage,
	},
	{
		name: "search_messages",
		description: "Search messages in the chat.",
		parameters: {
			type: "object",
			properties: {
				query: { type: "string" },
				dateMin: { type: "string" },
				dateMax: { type: "string" },
			},
			required: ["query"],
		},
		execute: executeSearchMessages,
	},
	{
		name: "finish",
		description:
			"Finish interaction. Always call this after you finished your response.",
		parameters: {},
		execute: executeFinish,
	},
];

export function getOllamaToolSpecifications(): Tool[] {
	return toolDefinitions.map((toolDefinition) => ({
		type: "function" as const,
		function: {
			name: toolDefinition.name,
			description: toolDefinition.description,
			parameters: toolDefinition.parameters,
		},
	}));
}

export async function executeToolByName(
	context: CustomContext,
	name: ToolName,
	input: Record<string, unknown>,
) {
	const definition = toolDefinitions.find((tool) => tool.name === name);
	if (!definition) return null;
	return definition.execute(context, input);
}

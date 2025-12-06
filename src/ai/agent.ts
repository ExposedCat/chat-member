import type { Message } from "ollama";
import type { CustomContext } from "../bot/telegram.js";
import { getSystemPrompt, TOOL_RESPONSE_KIND } from "./prompts.js";
import { serializeMessageHistory } from "./serialize.js";
import { executeTool, type ToolCall } from "./tools.js";

export async function runAgent(
	context: CustomContext,
	options?: {
		priorConversation?: Message[];
	},
): Promise<
	Array<{
		message: Message;
		messageIds: number[];
	}>
> {
	const conversation: Message[] = [];
	conversation.push({
		role: "system",
		content: getSystemPrompt(),
	});
	if (options?.priorConversation) {
		conversation.push(...serializeMessageHistory(options.priorConversation));
	}

	const temperatureEnv = process.env.OLLAMA_TEMPERATURE;
	const temperature = temperatureEnv
		? Number.parseFloat(temperatureEnv)
		: undefined;

	const newMessages: Array<{
		message: Message;
		messageIds: number[];
	}> = [];
	let lastCall = false;
	for (let i = 0; i < 10; i++) {
		if (lastCall) {
			break;
		}
		const response = await context.ai.client.chat({
			model: context.ai.env.ollamaModel,
			messages: conversation,
			options: temperature !== undefined ? { temperature } : undefined,
			format: {
				type: "array",
				items: {
					type: "object",
					properties: {
						function: { type: "string" },
						args: { type: "object" },
					},
				},
			},
		});

		conversation.push(response.message);

		const messageIds: number[] = [];
		const toolCalls: ToolCall[] = JSON.parse(response.message.content) ?? [];
		for (const toolCall of toolCalls) {
			if (toolCall.args.last_call) {
				lastCall = true;
			}
			const toolOutput = (await executeTool(context, toolCall)) as {
				messageId?: number;
				output?: unknown;
			};
			if (toolOutput.messageId) {
				messageIds.push(toolOutput.messageId);
			}
			if (!toolOutput.output) {
				continue;
			}
			conversation.push({
				role: "user",
				content: JSON.stringify({
					kind: TOOL_RESPONSE_KIND,
					response: toolOutput,
				}),
			});
		}
		newMessages.push({
			message: response.message,
			messageIds,
		});
	}

	return newMessages;
}

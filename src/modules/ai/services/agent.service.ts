import type { Message } from "ollama";
import type { CustomContext } from "../../bot/types/telegram.js";
import {
	SEND_MESSAGE_WARNING,
	SYSTEM_PROMPT,
	TOOL_RESPONSE_INSTRUCTION,
	TOOL_RESPONSE_KIND,
} from "../utils/prompts.js";
import {
	executeToolByName,
	getOllamaToolSpecifications,
	type ToolName,
} from "./tools.service.js";

export async function runAgent(
	context: CustomContext,
	userMessage: string,
): Promise<void> {
	const conversation: Message[] = [];
	conversation.push({
		role: "system",
		content: SYSTEM_PROMPT,
	});
	conversation.push({
		role: "user",
		content: JSON.stringify({
			kind: "message",
			content: userMessage,
		}),
	});

	iterations: for (let steps = 0; steps < 10; steps++) {
		const temperatureEnv = process.env.OLLAMA_TEMPERATURE;
		const temperature = temperatureEnv
			? Number.parseFloat(temperatureEnv)
			: undefined;
		const response = await context.ai.client.chat({
			model: context.ai.env.ollamaModel,
			messages: conversation,
			options: temperature !== undefined ? { temperature } : undefined,
			tools: getOllamaToolSpecifications(),
		});

		const assistantMessage = response.message;
		conversation.push(assistantMessage);

		const toolCalls = assistantMessage?.tool_calls ?? [];
		if (toolCalls.length === 0) {
			conversation.push({
				role: "user",
				content: SEND_MESSAGE_WARNING,
			});
		}

		for (const toolCall of toolCalls) {
			const toolName = toolCall.function.name as ToolName;
			const args = toolCall.function.arguments;
			const toolOutput = await executeToolByName(context, toolName, args);
			conversation.push({
				role: "user",
				content: JSON.stringify({
					kind: TOOL_RESPONSE_KIND,
					output: toolOutput,
					instruction: TOOL_RESPONSE_INSTRUCTION,
				}),
			});
			if (toolName === "finish") {
				break iterations;
			}
		}
	}
}

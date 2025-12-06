import type { Message } from "ollama";

export function serializeUserMessage(text: string): string {
	return `[{"function":"send_message","args":{"text":"${text}"}}]`;
}

export function serializeMessageHistory(history: Message[]): Message[] {
	return history.map((message) =>
		message.role === "user"
			? {
					...message,
					content: serializeUserMessage(message.content),
				}
			: message,
	);
}

export function makeUserMessage(text: string): Message {
	return {
		role: "user",
		content: JSON.stringify({
			function: "send_message",
			args: { text },
		}),
	};
}

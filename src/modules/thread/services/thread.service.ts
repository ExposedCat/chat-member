import type { WithId } from "mongodb";
import type { Message } from "ollama";
import type {
	Database,
	Thread,
	ThreadMessage,
} from "../../database/types/database.js";
import { appendToThread } from "../repositories/thread.repository.js";

export async function appendMessageToThread(params: {
	db: Database;
	thread: WithId<Thread>;
	userMessage?: {
		messageId: number;
		userId: number;
		message: Message;
	};
	agentMessages?: { message: Message; messageId?: number }[];
}): Promise<WithId<Thread> | null> {
	const messages: ThreadMessage[] = [];

	if (params.userMessage) {
		messages.push(params.userMessage);
	}
	for (const item of params.agentMessages ?? []) {
		messages.push(item);
	}
	if (messages.length === 0) return params.thread;
	return appendToThread({
		db: params.db,
		threadId: params.thread._id,
		messages,
	});
}

export function isLastMessageInThread(params: {
	thread: WithId<Thread>;
	telegramMessageId: number;
}): boolean {
	const last = params.thread.messages[params.thread.messages.length - 1];
	return last?.messageId === params.telegramMessageId;
}

export function toConversationMessages(thread: Thread): Message[] {
	return thread.messages.map((message) => message.message);
}

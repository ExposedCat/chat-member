import type { WithId } from "mongodb";
import type { Message } from "ollama";
import type { Database } from "./connection.js";

export type ThreadMessage = {
	message: Message;
	messageIds: number[];
	userId?: number;
};

export type Thread = {
	chatId: number;
	messages: ThreadMessage[];
};

export async function appendMessageToThread(params: {
	db: Database;
	thread: WithId<Thread>;
	messages: ThreadMessage[];
}): Promise<WithId<Thread> | null> {
	if (params.messages.length === 0) return params.thread;
	return params.db.thread.findOneAndUpdate(
		{ _id: params.thread._id },
		{ $push: { messages: { $each: params.messages } } },
		{ returnDocument: "after" },
	);
}

export function isLastMessageInThread(params: {
	thread: WithId<Thread>;
	telegramMessageId: number;
}): boolean {
	const last = params.thread.messages[params.thread.messages.length - 1];
	return last?.messageIds.includes(params.telegramMessageId);
}

export function toConversationMessages(messages: ThreadMessage[]): Message[] {
	return messages.map((message) => message.message);
}

type CreateThreadFromSliceParams = {
	db: Database;
	thread: Thread;
	telegramMessageId: number;
};

export async function createThreadFromSlice({
	db,
	thread,
	telegramMessageId,
}: CreateThreadFromSliceParams): Promise<WithId<Thread>> {
	const index = thread.messages.findIndex((message) =>
		message.messageIds.includes(telegramMessageId),
	);
	const sliceEnd = index >= 0 ? index + 1 : 0;
	const messages = thread.messages.slice(0, sliceEnd);
	const doc: Thread = {
		chatId: thread.chatId,
		messages,
	};
	const result = await db.thread.insertOne(doc);
	return {
		_id: result.insertedId,
		...doc,
	};
}

type CreateThreadParams = {
	db: Database;
	chatId: number;
	userMessage?: {
		messageId: number;
		userId: number;
		message: Message;
	};
};

export async function createThread({
	db,
	chatId,
	userMessage,
}: CreateThreadParams): Promise<WithId<Thread>> {
	const doc: Thread = {
		chatId,
		messages: userMessage
			? [
					{
						userId: userMessage.userId,
						message: userMessage.message,
						messageIds: [userMessage.messageId],
					},
				]
			: [],
	};
	const result = await db.thread.insertOne(doc);
	return {
		_id: result.insertedId,
		...doc,
	};
}

type FindThreadByMessageParams = {
	db: Database;
	chatId: number;
	messageId: number;
};

export async function findThreadByMessage({
	db,
	chatId,
	messageId,
}: FindThreadByMessageParams): Promise<WithId<Thread> | null> {
	return db.thread.findOne({
		chatId,
		"messages.messageIds": messageId,
	});
}

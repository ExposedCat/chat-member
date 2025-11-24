import type { ObjectId, WithId } from "mongodb";
import type { Message } from "ollama";
import type {
	Database,
	Thread,
	ThreadMessage,
} from "../../database/types/database.js";

type CreateThreadParams = {
	db: Database;
	chatId: number;
	threadId: number;
	userMessage: {
		messageId: number;
		userId: number;
		message: Message;
	};
};

export async function createThread({
	db,
	chatId,
	threadId,
	userMessage,
}: CreateThreadParams): Promise<Thread> {
	const doc: Thread = {
		chatId,
		telegramThreadId: threadId,
		messages: [userMessage],
	};
	await db.thread.insertOne(doc);
	return doc;
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
		"messages.messageId": messageId,
	});
}

type FindThreadByIdParams = {
	db: Database;
	chatId: number;
	telegramThreadId: number;
};

export async function findThreadById({
	db,
	chatId,
	telegramThreadId,
}: FindThreadByIdParams): Promise<WithId<Thread> | null> {
	return db.thread.findOne({ chatId, telegramThreadId });
}

type AppendToThreadParams = {
	db: Database;
	threadId: ObjectId;
	messages: ThreadMessage[];
};

export async function appendToThread({
	db,
	threadId,
	messages,
}: AppendToThreadParams): Promise<WithId<Thread> | null> {
	return db.thread.findOneAndUpdate(
		{ _id: threadId },
		{ $push: { messages: { $each: messages } } },
		{ returnDocument: "after" },
	);
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
}: CreateThreadFromSliceParams): Promise<Thread> {
	const index = thread.messages.findIndex(
		(message) => message.messageId === telegramMessageId,
	);
	const sliceEnd = index >= 0 ? index + 1 : 0;
	const messages = thread.messages.slice(0, sliceEnd);
	const doc: Thread = {
		chatId: thread.chatId,
		telegramThreadId: thread.telegramThreadId,
		messages,
	};
	await db.thread.insertOne(doc);
	return doc;
}

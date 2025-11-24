import type { Collection } from "mongodb";
import type { Message } from "ollama";

export type Chat = {
	chatId: number;
	title: string;
};

export type ThreadMessage = {
	message: Message;
	messageId?: number;
	userId?: number;
};

export type Thread = {
	chatId: number;
	telegramThreadId: number;
	messages: ThreadMessage[];
};

export type Database = {
	chat: Collection<Chat>;
	thread: Collection<Thread>;
};

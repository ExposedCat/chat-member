import type { Database } from "./connection.js";

export type Chat = {
	chatId: number;
	title: string;
};

type UpsertChatParams = {
	db: Database;
	chatId: number;
	title: string;
};

export async function upsertChat({
	db,
	chatId,
	title,
}: UpsertChatParams): Promise<Chat> {
	const chat = await db.chat.findOneAndUpdate(
		{ chatId },
		{ $set: { title } },
		{ returnDocument: "after", upsert: true },
	);

	if (!chat) {
		throw new Error("Failed to upsert chat");
	}

	return chat;
}

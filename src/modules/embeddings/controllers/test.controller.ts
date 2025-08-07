import { Composer } from "grammy";
import type { CustomContext } from "../../bot/types/telegram.js";
import { saveMessage } from "../repositories/chat.repository.js";
import { searchMessages } from "../services/chat.service.js";

export const testEmbeddingsController = new Composer<CustomContext>();

testEmbeddingsController.command("put", async (ctx) => {
	if (!ctx.match || !ctx.message) {
		await ctx.reply("/put [TEXT]");
		return;
	}
	await saveMessage({
		client: ctx.embeddings.client,
		embedder: ctx.embeddings.embedder,
		text: ctx.match,
		id: ctx.message.message_id,
		chatId: ctx.message.chat.id,
		sender: ctx.message.from.first_name,
	});
	await ctx.reply("Saved");
});

testEmbeddingsController.command("get", async (ctx) => {
	const results = await searchMessages({
		client: ctx.embeddings.client,
		embedder: ctx.embeddings.embedder,
		query: ctx.match,
		chatId: ctx.message?.chat.id,
	});
	await ctx.reply(JSON.stringify(results, null, 2));
});

testEmbeddingsController.command("flush", async (ctx) => {
	await ctx.embeddings.client.deleteCollection("chat");
	await ctx.embeddings.client.createCollection("chat", {
		vectors: {
			size: 1024,
			distance: "Cosine",
		},
	});
	await ctx.reply("Flushed");
});

import { Composer } from "grammy";
import type { CustomContext } from "../../bot/types/telegram.js";
import { saveMessage } from "../repositories/chat.repository.js";

export const messageEmbeddingsController = new Composer<CustomContext>();

messageEmbeddingsController.on("message:text", async (ctx) => {
	await saveMessage({
		client: ctx.embeddings.client,
		embedder: ctx.embeddings.embedder,
		text: ctx.message.text,
		sender: ctx.message.from.first_name,
		id: ctx.message.message_id,
		chatId: ctx.message.chat.id,
	});
	// await ctx.reply("Saved");
});

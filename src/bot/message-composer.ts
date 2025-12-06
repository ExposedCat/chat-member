import { Composer } from "grammy";
import { saveMessage } from "../ai/embedder/messages.js";
import type { CustomContext } from "./telegram.js";

export const messageEmbeddingsComposer = new Composer<CustomContext>();

messageEmbeddingsComposer.on("message:text", async (ctx) => {
	await saveMessage({
		client: ctx.embeddings.client,
		embedder: ctx.embeddings.embedder,
		text: ctx.message.text,
		sender: ctx.message.from.first_name,
		id: ctx.message.message_id,
		chatId: ctx.message.chat.id,
	});
});

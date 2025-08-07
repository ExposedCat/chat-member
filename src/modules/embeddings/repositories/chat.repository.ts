import type { QdrantClient } from "@qdrant/js-client-rest";
import { embedTextWithChunking } from "../services/embedding.helpers.js";
import type { Embedder } from "../types/embedder.types.js";

type SaveMessageParams = {
	client: QdrantClient;
	embedder: Embedder;
	sender: string;
	text: string;
	id: number;
	chatId: number;
};

export async function saveMessage({
	client,
	embedder: { session, tokenizer },
	sender,
	text,
	id,
	chatId,
}: SaveMessageParams): Promise<number[][]> {
	const record = `${sender} said "${text}"`;
	const maxLength = 512;
	const stride = 64;
	const { texts, vectors } = await embedTextWithChunking(
		session,
		tokenizer,
		record,
		maxLength,
		stride,
	);
	const pointIdBase = id * 1000;
	const points = texts.map((_, chunkIndex) => ({
		id: pointIdBase + chunkIndex,
		vector: vectors[chunkIndex],
		payload: {
			text,
			timestamp: Date.now(),
			chat_id: chatId,
			sender,
			message_id: id,
			chunk_index: chunkIndex,
		},
	}));
	await client.upsert("chat", {
		wait: true,
		points,
	});
	return vectors;
}

export async function flushMessages(client: QdrantClient) {
	await client.deleteCollection("chat");
}

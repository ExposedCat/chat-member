import type { QdrantClient } from "@qdrant/js-client-rest";
import type { components } from "@qdrant/js-client-rest/dist/types/openapi/generated_schema.js";
import type { Embedder } from "./embedder.js";
import { embedTextWithChunking } from "./helpers.js";

type SearchMessagesParams = {
	client: QdrantClient;
	embedder: Embedder;
	query: string;
	chatId?: number;
	dateMin?: Date;
	dateMax?: Date;
};

const wrapQuery = (
	query: string,
) => `Instruct: Given a chat search query, retrieve relevant chat passages that answer the query
Query: ${query}`;

export async function searchMessages({
	client,
	embedder: { session, tokenizer },
	query,
	chatId,
	dateMin,
	dateMax,
}: SearchMessagesParams): Promise<
	Array<{ score: number; text: string; date: string }>
> {
	const maxLength = 512;
	const stride = 64;
	const { vectors } = await embedTextWithChunking(
		session,
		tokenizer,
		wrapQuery(query),
		maxLength,
		stride,
	);
	const averagedVector =
		vectors.length === 1
			? vectors[0]
			: vectors
					.reduce(
						(runningSum, currentVector) =>
							runningSum.map(
								(component, index) => component + currentVector[index],
							),
						new Array(vectors[0].length).fill(0),
					)
					.map((component) => component / vectors.length);

	const must: components["schemas"]["Condition"][] = [];
	if (chatId) {
		must.push({
			key: "chat_id",
			match: { value: chatId },
		});
	}
	if (dateMin) {
		must.push({
			key: "timestamp",
			range: { gte: dateMin.getTime() },
		});
	}
	if (dateMax) {
		must.push({
			key: "timestamp",
			range: { lte: dateMax.getTime() },
		});
	}

	const results = await client.search("chat", {
		vector: averagedVector,
		limit: 3,
		with_payload: true,
		filter: { must },
	});

	return results.map((result) => ({
		score: result.score,
		text: result.payload?.text as string,
		date: new Date(result.payload?.timestamp as number).toLocaleString(),
	}));
}

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

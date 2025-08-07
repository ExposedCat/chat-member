import type { QdrantClient } from "@qdrant/js-client-rest";
import type { components } from "@qdrant/js-client-rest/dist/types/openapi/generated_schema.js";
import type { Embedder } from "../types/embedder.types.js";
import { embedTextWithChunking } from "./embedding.helpers.js";

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
			match: { gte: dateMin.getTime() },
		});
	}
	if (dateMax) {
		must.push({
			key: "timestamp",
			match: { lte: dateMax.getTime() },
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

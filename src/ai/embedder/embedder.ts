import { QdrantClient } from "@qdrant/js-client-rest";
import { InferenceSession } from "onnxruntime-node";
import { Tokenizer } from "tokenizers";

export type Embedder = {
	session: InferenceSession;
	tokenizer: Tokenizer;
};

async function createEmbedder() {
	const [session, tokenizer] = await Promise.all([
		InferenceSession.create("model/model.onnx"),
		Tokenizer.fromFile("model/tokenizer.json"),
	]);

	return { session, tokenizer };
}

async function createEmbeddingClient() {
	console.log("Creating embedding client...");
	const client = new QdrantClient({
		url: "http://localhost:6333",
	});

	console.log("Embedding client created");
	await ensureCollection(client);

	console.log("Collection ensured");

	return client;
}

export async function ensureCollection(client: QdrantClient) {
	const { exists: hasCollection } = await client.collectionExists("chat");

	if (!hasCollection) {
		await client.createCollection("chat", {
			vectors: {
				size: 1024,
				distance: "Cosine",
			},
		});
	}
}

export async function setupEmbeddings() {
	const embedder = await createEmbedder();
	const client = await createEmbeddingClient();

	return { embedder, client };
}

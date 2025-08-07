import type { InferenceSession } from "onnxruntime-node";
import type { Tokenizer } from "tokenizers";

export type Embedder = {
	session: InferenceSession;
	tokenizer: Tokenizer;
};

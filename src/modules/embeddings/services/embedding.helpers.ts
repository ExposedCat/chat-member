import { type InferenceSession, Tensor } from "onnxruntime-node";
import type { Tokenizer } from "tokenizers";

export async function generateTokenAlignedChunks(
	tokenizer: Tokenizer,
	text: string,
	maxLength: number,
	stride: number,
): Promise<string[]> {
	const encoding = await tokenizer.encode(text);
	const tokenIds = encoding.getIds();
	if (tokenIds.length <= maxLength) {
		return [text];
	}
	const tokenOffsets = encoding.getOffsets();
	const tokenStep = Math.max(1, maxLength - stride);
	const textChunks: string[] = [];
	let tokenStart = 0;
	while (tokenStart < tokenIds.length) {
		const tokenEnd = Math.min(tokenStart + maxLength, tokenIds.length);
		const windowOffsets = tokenOffsets.slice(tokenStart, tokenEnd);
		const firstValidRelativeIndex = windowOffsets.findIndex(
			([startChar, endChar]) => endChar > startChar,
		);
		const lastValidRelativeIndex = windowOffsets.findLastIndex(
			([startChar, endChar]) => endChar > startChar,
		);
		let charStart = 0;
		let charEnd = text.length;
		if (firstValidRelativeIndex !== -1 && lastValidRelativeIndex !== -1) {
			const absoluteFirstIndex = tokenStart + firstValidRelativeIndex;
			const absoluteLastIndex = tokenStart + lastValidRelativeIndex;
			charStart = tokenOffsets[absoluteFirstIndex][0];
			charEnd = tokenOffsets[absoluteLastIndex][1];
		}
		const chunkText = text.slice(charStart, charEnd);
		if (chunkText.length > 0) {
			textChunks.push(chunkText);
		}
		if (tokenEnd === tokenIds.length) {
			break;
		}
		tokenStart += tokenStep;
	}
	return textChunks;
}

export async function embedSingleText(
	session: InferenceSession,
	tokenizer: Tokenizer,
	text: string,
	maxLength: number,
): Promise<number[]> {
	const encoding = await tokenizer.encode(text);
	let inputTokenIds = encoding.getIds();
	let inputAttentionMask = encoding.getAttentionMask();
	if (inputTokenIds.length > maxLength) {
		inputTokenIds = inputTokenIds.slice(0, maxLength);
		inputAttentionMask = inputAttentionMask.slice(0, maxLength);
	}
	const ids = BigInt64Array.from(
		inputTokenIds.map((tokenId) => BigInt(tokenId)),
	);
	const mask = BigInt64Array.from(
		inputAttentionMask.map((maskValue) => BigInt(maskValue)),
	);
	const outputs = await session.run({
		input_ids: new Tensor("int64", ids, [1, ids.length]),
		attention_mask: new Tensor("int64", mask, [1, mask.length]),
	});
	const outputName = session.outputNames?.[0] as keyof typeof outputs;
	const hiddenStates = outputs[outputName] as Tensor;
	const [, sequenceLength, embeddingDimension] = hiddenStates.dims;
	const hiddenData = hiddenStates.data as Float32Array;
	const componentSums = new Float32Array(embeddingDimension);
	for (let sequenceIndex = 0; sequenceIndex < sequenceLength; sequenceIndex++) {
		for (
			let dimensionIndex = 0;
			dimensionIndex < embeddingDimension;
			dimensionIndex++
		) {
			componentSums[dimensionIndex] +=
				hiddenData[sequenceIndex * embeddingDimension + dimensionIndex];
		}
	}
	for (
		let dimensionIndex = 0;
		dimensionIndex < embeddingDimension;
		dimensionIndex++
	) {
		componentSums[dimensionIndex] /= sequenceLength;
	}
	const norm = Math.hypot(...componentSums);
	return Array.from(
		componentSums.map((componentValue) => componentValue / norm),
	);
}

export async function embedTextWithChunking(
	session: InferenceSession,
	tokenizer: Tokenizer,
	text: string,
	maxLength: number,
	stride: number,
): Promise<{ texts: string[]; vectors: number[][] }> {
	const chunks = await generateTokenAlignedChunks(
		tokenizer,
		text,
		maxLength,
		stride,
	);
	const vectors = await Promise.all(
		chunks.map((chunkText) =>
			embedSingleText(session, tokenizer, chunkText, maxLength),
		),
	);
	return { texts: chunks, vectors };
}

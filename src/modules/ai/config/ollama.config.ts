import { Ollama } from "ollama";

export type AIEnv = {
	ollamaHost: string;
	ollamaModel: string;
	botNames: string[];
};

function parseBotNames(input: string): string[] {
	return input
		.split(",")
		.map((name) => name.trim())
		.filter((name) => name.length > 0);
}

export async function setupAI() {
	const ollamaHost = process.env.OLLAMA_HOST as string;
	const ollamaModel = process.env.OLLAMA_MODEL as string;
	const botNames = parseBotNames(process.env.BOT_NAMES as string);
	const env: AIEnv = { ollamaHost, ollamaModel, botNames };
	const client = new Ollama({ host: env.ollamaHost });
	return { env, client };
}

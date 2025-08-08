import { config } from "dotenv";
import { resolvePath, validateEnv } from "../../../utils/env.utils.js";
import { setupAI } from "../../ai/config/ollama.config.js";
import { createBot } from "../../bot/config/bot.config.js";
import type { Custom } from "../../bot/types/telegram.js";
import { connectToDb } from "../../database/config/connection.js";
import type { Database } from "../../database/types/database.js";
import { setupEmbeddings } from "../../embeddings/config/chat.config.js";
import { initLocaleEngine } from "../../locale/config/locale.config.js";

export async function startApp() {
	config({ override: true });

	try {
		validateEnv([
			"TOKEN",
			"DB_CONNECTION_STRING",
			"BOT_NAMES",
			"OLLAMA_HOST",
			"OLLAMA_MODEL",
		]);
	} catch (error) {
		console.error("Error occurred while loading environment:", error);
		process.exit(1);
	}

	let database: Database;
	try {
		database = await connectToDb();
	} catch (error) {
		console.error("Error occurred while connecting to the database:", error);
		process.exit(2);
	}

	let embeddings: Custom["embeddings"];
	try {
		embeddings = await setupEmbeddings();
	} catch (error) {
		console.error("Error occurred while setting up embeddings:", error);
		process.exit(3);
	}

	const ai = await setupAI();

	try {
		const localesPath = resolvePath(import.meta.url, "../../../locales");
		const i18n = initLocaleEngine(localesPath);
		const bot = createBot(database, i18n, embeddings, ai);

		await new Promise((resolve) =>
			bot.start({
				onStart: () => resolve(undefined),
			}),
		);
	} catch (error) {
		console.error("Error occurred while starting the bot:", error);
		process.exit(4);
	}
}

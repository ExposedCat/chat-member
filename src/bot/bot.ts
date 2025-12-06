import type { I18n } from "@grammyjs/i18n";
import { type MiddlewareObj, session, Bot as TelegramBot } from "grammy";
import { aiComposer } from "../ai/composer.js";
import { upsertChat } from "../database/chat.js";
import type { Database } from "../database/connection.js";
import { createReplyWithTextFunc } from "./context.js";
import { messageEmbeddingsComposer } from "./message-composer.js";
import { statusComposer } from "./status-composer.js";
import type { Bot, Custom, CustomContext } from "./telegram.js";

function extendContext(
	bot: Bot,
	database: Database,
	embeddings: Custom["embeddings"],
	ai: Custom["ai"],
) {
	bot.use(async (ctx, next) => {
		if (!ctx.chat || !ctx.from) {
			return;
		}

		ctx.text = createReplyWithTextFunc(ctx);
		ctx.db = database;
		ctx.embeddings = embeddings;
		ctx.ai = ai;

		const chat = await upsertChat({
			db: database,
			chatId: ctx.chat.id,
			title:
				ctx.chat.type === "private"
					? (ctx.chat.title ?? "Group Chat")
					: `${ctx.from.first_name} Private Messages`,
		});

		ctx.dbEntities = { chat };

		await next();
	});
}

function setupPreControllers(_bot: Bot) {}

function setupMiddlewares(bot: Bot, i18n: I18n) {
	bot.use(session({ initial: () => ({}) }));
	bot.use(i18n as unknown as MiddlewareObj<CustomContext>);
}

function setupControllers(bot: Bot) {
	bot.use(statusComposer);
	bot.use(aiComposer);
	bot.use(messageEmbeddingsComposer);
}

export function createBot(
	database: Database,
	i18n: I18n,
	embeddings: Custom["embeddings"],
	ai: Custom["ai"],
): Bot {
	const TOKEN = process.env.TOKEN;
	if (!TOKEN) {
		throw new Error("TOKEN environment variable is missing");
	}

	const bot = new TelegramBot<CustomContext>(TOKEN);

	setupPreControllers(bot);
	extendContext(bot, database, embeddings, ai);
	setupMiddlewares(bot, i18n);
	setupControllers(bot);

	bot.catch(console.error);

	return bot;
}

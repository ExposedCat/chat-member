import type { I18nFlavor, TranslationVariables } from "@grammyjs/i18n";
import type { Message } from "@grammyjs/types";
import type { QdrantClient } from "@qdrant/js-client-rest";
import type {
	Api,
	Context,
	NextFunction,
	SessionFlavor,
	Bot as TelegramBot,
} from "grammy";
import type { Chat, Database } from "../../database/types/database.js";
import type { Embedder } from "../../embeddings/types/embedder.types.js";

type Extra = Parameters<Api["sendMessage"]>[2];

export type Custom = {
	text: (
		text: string,
		templateData?: TranslationVariables,
		extra?: Extra,
	) => Promise<Message.TextMessage>;

	dbEntities: {
		chat: Chat;
	};

	embeddings: {
		client: QdrantClient;
		embedder: Embedder;
	};

	db: Database;
};

export type CustomContext = Context &
	Custom &
	I18nFlavor &
	SessionFlavor<Record<string, never>>;

export type Bot = TelegramBot<CustomContext>;

export type Handler = (ctx: CustomContext, next?: NextFunction) => void;

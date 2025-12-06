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
import type { Ollama } from "ollama";
import type { Embedder } from "../ai/embedder/embedder.js";
import type { AIEnv } from "../ai/ollama.js";
import type { Chat } from "../database/chat.js";
import type { Database } from "../database/connection.js";

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

	ai: {
		client: Ollama;
		env: AIEnv;
	};

	db: Database;
};

export type CustomContext = Context &
	Custom &
	I18nFlavor &
	SessionFlavor<Record<string, never>>;

export type Bot = TelegramBot<CustomContext>;

export type Handler = (ctx: CustomContext, next?: NextFunction) => void;

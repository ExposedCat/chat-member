import { Composer } from "grammy";
import type { CustomContext } from "../bot/telegram.js";
import {
	appendMessageToThread,
	createThread,
	findThreadByMessage,
	toConversationMessages,
} from "../database/thread.js";
import { runAgent } from "./agent.js";
import { makeUserMessage } from "./serialize.js";

export const aiComposer = new Composer<CustomContext>();

aiComposer.on("message:text", async (context, next) => {
	if (!context.chat || !context.from) return;

	const text = context.message.text;
	const isMentioned = context.ai.env.botNames.some((name) =>
		text.toLowerCase().includes(name.toLowerCase()),
	);
	const userMessage = makeUserMessage(text);

	const message = context.message;
	const replyTo = message.reply_to_message;

	let thread = replyTo
		? await findThreadByMessage({
				db: context.db,
				chatId: context.chat.id,
				messageId: replyTo.message_id,
			})
		: null;

	if (thread || isMentioned) {
		if (!thread) {
			const firstMessage = replyTo
				? makeUserMessage(
						replyTo.text ?? replyTo.caption ?? "<non-text message>",
					)
				: null;
			thread = await createThread({
				db: context.db,
				chatId: context.chat.id,
				userMessage:
					firstMessage && replyTo
						? {
								messageId: replyTo.message_id,
								message: firstMessage,
								userId: replyTo.from?.id ?? context.from.id,
							}
						: undefined,
			});
		}
		if (thread) {
			const finalThread = await appendMessageToThread({
				db: context.db,
				thread,
				messages: [
					{
						messageIds: [context.message.message_id],
						message: userMessage,
						userId: context.from.id,
					},
				],
			});

			if (finalThread) {
				const prior = toConversationMessages(finalThread.messages);
				const newMessages = await runAgent(context, {
					priorConversation: prior,
				});
				await appendMessageToThread({
					db: context.db,
					thread: finalThread,
					messages: newMessages,
				});
				return;
			}
		}
	}

	await next();
});

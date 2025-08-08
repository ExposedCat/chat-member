import { Composer } from "grammy";
import type { CustomContext } from "../../bot/types/telegram.js";
import { runAgent } from "../services/agent.service.js";

export const aiController = new Composer<CustomContext>();

aiController.on("message:text", async (context, next) => {
	const incomingText = context.message.text.toLowerCase();
	const isMentioned = context.ai.env.botNames.some((name) =>
		incomingText.includes(name.toLowerCase()),
	);
	if (isMentioned) {
		await runAgent(context, context.message.text);
	} else {
		await next();
	}
});

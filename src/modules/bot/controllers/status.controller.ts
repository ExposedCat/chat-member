import { Composer } from "grammy";

import type { CustomContext } from "../types/telegram.js";

export const statusController = new Composer<CustomContext>();

statusController.command("health", async (ctx) => {
	await ctx.text("health");
});

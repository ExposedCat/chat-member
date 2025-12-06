import { Composer } from "grammy";

import type { CustomContext } from "./telegram.js";

export const statusComposer = new Composer<CustomContext>();

statusComposer.command("health", async (ctx) => {
	await ctx.text("health");
});

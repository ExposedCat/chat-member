import { startApp } from "./modules/app/services/app.service.js";

console.debug("Starting app...");
await startApp();
console.debug("App started");

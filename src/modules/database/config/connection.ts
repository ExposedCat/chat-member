import { MongoClient } from "mongodb";

import type { Chat, Database, Thread } from "../types/database.js";

export async function connectToDb() {
	const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING;
	if (!DB_CONNECTION_STRING) {
		throw new Error("DB_CONNECTION_STRING environment variable is missing");
	}

	const client = new MongoClient(DB_CONNECTION_STRING);
	await client.connect();

	const mongoDb = client.db();
	const chat = mongoDb.collection<Chat>("chat");
	const thread = mongoDb.collection<Thread>("thread");
	const database: Database = { chat, thread };

	return database;
}

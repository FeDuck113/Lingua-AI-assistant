import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { ConversationMessage } from "../modules/gigachat-ai";
import { messagesTable } from "./schema";

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
	throw new Error("No databse url provided!");
}

const db = drizzle(DB_URL);

type Role = "user" | "ai";

type addMessageProps = {
	role: Role;
	username: string;
	sessionUUID: string;
	content: string;
};

export async function addMessage({
	role,
	username,
	sessionUUID,
	content,
}: addMessageProps) {
	const message: typeof messagesTable.$inferInsert = {
		role: role,
		username: username,
		sessionUUID: sessionUUID,
		content: content,
	};
	await db.insert(messagesTable).values(message);
}

export async function getContextBySessionUUID(sessionUUID: string) {
	const messages = await db
		.select()
		.from(messagesTable)
		.where(eq(messagesTable.sessionUUID, sessionUUID));
	return messages.map(
		(msg) => ({ type: msg.role, text: msg.content }) as ConversationMessage,
	);
}

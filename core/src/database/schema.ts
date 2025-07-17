import { relations } from "drizzle-orm";
import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

import { createId } from "@paralleldrive/cuid2";

export const messagesTable = pgTable("messages", {
	id: varchar("id")
		.$defaultFn(() => createId())
		.primaryKey(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	username: varchar("username").notNull(),
	sessionUUID: varchar("sessionUUID").notNull(),
	role: varchar("role").notNull(),
	content: varchar("content").notNull(),
});

export const table = {
	messages: messagesTable,
} as const;

export type Table = typeof table;

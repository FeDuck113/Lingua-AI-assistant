import { table } from "./schema";
import { spreads } from "./utils";

export const db = {
	insert: spreads(
		{
			users: table.messages,
		},
		"insert",
	),
	select: spreads(
		{
			users: table.messages,
		},
		"select",
	),
} as const;

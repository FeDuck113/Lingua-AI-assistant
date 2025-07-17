import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { Logestic } from "logestic";
import chat from "./routes/chat";

const app = new Elysia()
	.use(Logestic.preset("common"))
	.use(swagger())
	.group("/api/v1", (app) => app.use(chat))
	.listen(3000, ({ port }) => {
		console.log(`🦊 Elysia is running at http://localhost:${port}`);
	});

export type ElysiaApp = typeof app;

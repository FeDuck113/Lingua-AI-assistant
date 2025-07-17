import { Agent } from "node:https";
import { GigaChat } from "langchain-gigachat";
import "dotenv/config";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import analyzePrompt from "./prompts/analyze_prompt.js";

import dialogPrompt from "./prompts/dialog_prompt.js";

const httpsAgent = new Agent({
	rejectUnauthorized: false, // Отключение проверки сертификатов НУЦ Минцифры
});

// const key = process.env.GIGACHAT_API_KEY;
const key =
	"ZjU5MDIwN2QtMzY5NC00ZmVmLTg0MzktNDZlNjY4Y2MxOTc4OmU3ZGIwOTJlLWYxOTMtNGI5NS04YWM0LWE4ZGEzOGI1ZGIzNA==";
if (!key) {
	throw new Error(`No gigachat key provided! ${key}`);
}

const giga = new GigaChat({
	credentials: key,
	model: "GigaChat-2-Max",
	httpsAgent,
});

export async function analyze(text: string, language: string, level: string) {
	const promptTemplate = ChatPromptTemplate.fromMessages([
		["system", analyzePrompt],
		["human", "{input}"],
	]);
	const prompt = await promptTemplate.invoke({
		input: text,
		language: language,
		level: level,
	});
	const resp = String((await giga.invoke(prompt)).content);
	return resp;
}

export type ConversationMessage = {
	type: "user" | "ai";
	text: string;
};

export async function dialogResponse({
	text,
	language,
	level,
	history,
}: {
	text: string;
	language: string;
	level: string;
	history: ConversationMessage[];
}) {
	const mappedMessages = history.map((message) =>
		message.type === "user"
			? ["user", message.text]
			: ["assistant", message.text],
	);

	const promptTemplate = ChatPromptTemplate.fromMessages([
		["system", dialogPrompt],
		["human", "{input}"],
	]);

	const prompt = await promptTemplate.invoke({
		language: language,
		level: level,
		input: text,
	});
	const resp = await giga.invoke(prompt);
	return String(resp.content);
}

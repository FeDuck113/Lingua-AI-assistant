import Elysia, { t } from "elysia";
import { addMessage, getContextBySessionUUID } from "../database";
import * as giga from "../modules/gigachat-ai";
import { speechToText } from "../modules/speech-to-text";
import { textToSpeech } from "../modules/text-to-speech";
import { getCodeByLanguage } from "../modules/utils";

const chat = new Elysia()
	.post(
		"/audio",
		async ({ body: { file, language, level, sessionUUID, username } }) => {
			console.log("POST /audio");
			const code = getCodeByLanguage(language);

			const transcription = await speechToText(file, language);
			console.log("transcription done!");
			console.log(transcription);

			await addMessage({
				role: "user",
				sessionUUID: sessionUUID,
				username: username,
				content: transcription,
			});
			console.log("add user to bd done!");

			const explanation = await giga.analyze(transcription, language, level);
			console.log("analyze done!");

			const resp = await giga.dialogResponse({
				text: transcription,
				// 				history: await getContextBySessionUUID(sessionUUID),
				history: [],
				level: level,
				language: language,
			});
			console.log("response done!");
			await addMessage({
				role: "ai",
				sessionUUID: sessionUUID,
				username: username,
				content: JSON.stringify({ text: resp }),
			});

			const audio = await textToSpeech({
				language: code,
				text: resp,
			});
			console.log("audio done!");

			if (!(audio instanceof Blob)) {
				throw new Error("audio is not audio😭");
			}

			const arr = new Uint8Array(await audio.arrayBuffer());

			return {
				audio: arr.toBase64(),
				explanation: explanation,
			};
		},
		{
			body: t.Object({
				file: t.File({ format: "audio/*" }),
				language: t.String(),
				level: t.String(),
				sessionUUID: t.String(),
				username: t.String(),
			}),
		},
	)
	.onError((error) => {
		console.log(error.error);
		return new Response(error.error.toString());
	});

export default chat;

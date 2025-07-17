type TtsResponse = {
	text: string;
};

type TtsRequest = {
	text: string;
	language: string;
};

const ttsBaseUrl = process.env.TTS_URL;
if (!ttsBaseUrl) {
	throw new Error("No tts base url provided!");
}

export async function textToSpeech({ text, language }: TtsRequest) {
	const res = await fetch(`${ttsBaseUrl}/audio`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ text, language }),
	});
	return await res.blob();
}

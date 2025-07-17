type SttResponse = {
	text: string;
};

const sstBaseUrl = process.env.STT_URL;
if (!sstBaseUrl) {
	throw new Error("No tts base url provided!");
}

export async function speechToText(audio: File, language: string) {
	const data = new FormData();
	data.append("audio", audio);
	data.append("language", language);

	const res = await fetch(`${sstBaseUrl}/get_data`, {
		method: "POST",
		body: data,
	});

	if (res.status !== 200) {
		throw new Error(`STT failed: ${res.status}`);
	}

	return res.json();
}

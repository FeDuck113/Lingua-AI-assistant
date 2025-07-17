type LanguageCode = "a" | "b" | "e" | "f" | "h" | "i" | "j" | "p" | "z";

interface LanguageResult {
	tts: string; // text-to-speech
	stt: string; // speech-to-text
	response: string; // ответ от модели
}

export function getCodeByLanguage(language: string): LanguageCode {
	switch (language.toLowerCase()) {
		case "english":
			return "a";
		case "english_b":
			return "b";
		case "spanish":
			return "e";
		case "french":
			return "f";
		case "hindi":
			return "h";
		case "italian":
			return "i";
		case "japanese":
			return "j";
		case "portuguese":
			return "p";
		case "chinese":
			return "z";
		default:
			throw new Error(`Unsupported language: ${language}`);
	}
}

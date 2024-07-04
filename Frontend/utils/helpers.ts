import { BuildContextInput } from "@/types/chat-types";
import { Chat } from "@/types/chat-types";

export function convertChatToQA(chat: Chat): BuildContextInput[] {
	const BuildContextInputList: BuildContextInput[] = [];
	let currentQuestion: string | null = null;

	for (const message of chat.messages) {
		if (message.role === "user") {
			if (currentQuestion !== null) {
				currentQuestion = message.content;
			} else {
				currentQuestion = message.content;
			}
		} else if (message.role === "assistant") {
			if (currentQuestion !== null) {
				BuildContextInputList.push({
					question: currentQuestion,
					answer: message.content,
				});
				currentQuestion = null;
			}
		}
	}

	return BuildContextInputList;
}

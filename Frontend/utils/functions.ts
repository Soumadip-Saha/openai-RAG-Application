import {
	BuildContextOutput,
	Chat,
	EvaluateResponseOutput,
} from "@/types/chat-types";
import { convertChatToQA } from "@/utils/helpers";

export const buildContext = async (
	query: string,
	currentChat: Chat,
	tools: string[]
) => {
	let chats = convertChatToQA(currentChat);

	try {
		const response = await fetch(
			process.env.NEXT_PUBLIC_SERVER_URL + "/build_context",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ query, chats, userId: "test", tools }),
			}
		);

		if (!response.ok) {
			throw new Error("Failed to build context");
		}

		const data: BuildContextOutput = await response.json();
		return data;
	} catch (error) {
		console.error("Failed to build context", error);
		throw error;
	}
};

export const getRelevanceScore = async (
	stand_alone_query: string,
	answer: string
) => {
	try {
		const response = await fetch(
			process.env.NEXT_PUBLIC_SERVER_URL + "/evaluate_response",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					stand_alone_query,
					answer,
					userId: "test",
				}),
			}
		);

		if (!response.ok) {
			throw new Error("Failed to get relevance score");
		}

		const data: EvaluateResponseOutput = await response.json();
		return data;
	} catch (error) {
		console.error("Failed to get relevance score", error);
		throw error;
	}
};

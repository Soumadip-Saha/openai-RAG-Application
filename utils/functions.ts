import { BuildContextOutput, Chat } from "@/types/chat-types";
import { convertChatToQA } from "@/utils/helpers";

export const buildContext = async (query: string, currentChat: Chat) => {
	let chats = convertChatToQA(currentChat);

	try {
		const response = await fetch("http://localhost:8000/build_context", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query, chats, userId: "test" }),
		});

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

import React, { useState, useRef, useEffect } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Chat, Message } from "@/types/chat-types";
import { testContext } from "@/utils/data";
import Markdown from "markdown-to-jsx";

interface ChatAreaProps {
	currentChat: Chat | null;
	onSendMessage: (message: Message) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ currentChat, onSendMessage }) => {
	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingContent, setStreamingContent] = useState("");
	const messageRef = useRef<HTMLInputElement>(null);
	const chatWindowRef = useRef<HTMLDivElement>(null);

	const streamQueryResponse = async (userMessage: string) => {
		setIsStreaming(true);
		onSendMessage({ role: "user", content: userMessage });

		let fullResponse = "";

		try {
			await fetchEventSource("http://localhost:8000/stream", {
				method: "POST",
				headers: {
					Accept: "text/event-stream",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					query: userMessage,
					context: testContext,
				}),
				onmessage(event) {
					const chunk = event.data === "" ? " \n" : event.data;
					fullResponse += chunk;
					setStreamingContent(fullResponse);
				},
				onclose() {
					onSendMessage({ role: "assistant", content: fullResponse });
					setStreamingContent("");
					setIsStreaming(false);
				},
				onerror(err) {
					console.error("Error from server", err);
					setIsStreaming(false);
				},
			});
		} catch (error) {
			console.error("Failed to fetch from server", error);
			setIsStreaming(false);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (
			messageRef.current &&
			messageRef.current.value.trim() &&
			!isStreaming
		) {
			const userMessage = messageRef.current.value;
			messageRef.current.value = "";
			streamQueryResponse(userMessage);
		}
	};

	useEffect(() => {
		if (chatWindowRef.current) {
			chatWindowRef.current.scrollTop =
				chatWindowRef.current.scrollHeight;
		}
	}, [currentChat, streamingContent]);

	if (!currentChat) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<p className="text-gray-400">
					Select a chat or start a new one
				</p>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col">
			<div
				ref={chatWindowRef}
				className="flex-1 overflow-y-auto p-4 space-y-4"
			>
				{currentChat.messages.map((message, index) => (
					<div
						key={index}
						className={`flex ${
							message.role === "user"
								? "justify-end"
								: "justify-start"
						}`}
					>
						<Markdown
							className={`markdown-content max-w-[83%] px-4 py-2 rounded-lg ${
								message.role === "user"
									? "bg-blue-500"
									: "bg-gray-700 bg-opacity-50 backdrop-filter backdrop-blur-sm"
							}`}
						>
							{message.content}
						</Markdown>
					</div>
				))}
				{streamingContent && (
					<div className="flex justify-start">
						<Markdown className="markdown-content max-w-[83%] px-4 py-2 rounded-lg bg-gray-700 bg-opacity-50 backdrop-filter backdrop-blur-sm">
							{streamingContent}
						</Markdown>
					</div>
				)}
			</div>
			<form
				onSubmit={handleSubmit}
				className="p-4 bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg"
			>
				<div className="flex space-x-2">
					<input
						type="text"
						ref={messageRef}
						className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white disabled:opacity-50"
						placeholder="Type a message..."
						disabled={isStreaming}
						required
					/>
					<button
						type="submit"
						className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 disabled:pointer-events-none disabled:opacity-50"
						disabled={isStreaming}
					>
						Send
					</button>
				</div>
			</form>
		</div>
	);
};

export default ChatArea;

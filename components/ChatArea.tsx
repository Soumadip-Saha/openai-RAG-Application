import React, { useState, useRef, useEffect } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Chat, Message } from "@/types/chat-types";
import Markdown from "markdown-to-jsx";
import { buildContext } from "@/utils/functions";
import Modal from "./Modal";

interface ChatAreaProps {
	currentChat: Chat | null;
	onSendMessage: (message: Message) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ currentChat, onSendMessage }) => {
	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingContent, setStreamingContent] = useState("");
	const [modalContent, setModalContent] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadingText, setLoadingText] = useState("Loading...");

	const messageRef = useRef<HTMLInputElement>(null);
	const chatWindowRef = useRef<HTMLDivElement>(null);

	const openModal = (content: string) => {
		setModalContent(content);
	};

	const closeModal = () => {
		setModalContent(null);
	};

	const streamQueryResponse = async (userMessage: string) => {
		try {
			const context = await buildContext(userMessage, currentChat!);

			setIsStreaming(true);
			onSendMessage({ role: "user", content: userMessage });

			let fullResponse = "";

			await fetchEventSource("http://localhost:8000/stream", {
				method: "POST",
				headers: {
					Accept: "text/event-stream",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					query: context.stand_alone_query,
					context: context.context,
					userId: "test",
				}),
				onmessage(event) {
					const chunk = event.data === "" ? " \n" : event.data;
					fullResponse += chunk;
					setStreamingContent(fullResponse);
				},
				onclose() {
					onSendMessage({
						role: "assistant",
						content: fullResponse,
						references: context.references,
					});
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
									? "bg-blue-900"
									: "bg-[#131313] text-gray-300"
							}`}
						>
							{message.content}
						</Markdown>
						{message.role === "assistant" && message.references && (
							<div className="flex flex-wrap mt-2 gap-2">
								{Object.entries(message.references).map(
									([key, value], i) => (
										<button
											key={i}
											onClick={() => openModal(value)}
											className="px-2 py-1 bg-gray-700 text-white text-xs rounded-full hover:bg-gray-600 transition duration-200"
										>
											{key}
										</button>
									)
								)}
							</div>
						)}
					</div>
				))}
				{streamingContent && (
					<div className="flex justify-start">
						<Markdown className="markdown-content max-w-[83%] px-4 py-2 rounded-lg bg-[#131313] text-gray-300">
							{streamingContent}
						</Markdown>
					</div>
				)}
			</div>
			<form onSubmit={handleSubmit} className="p-4 bg-zinc-900">
				<div className="flex space-x-2">
					<input
						type="text"
						ref={messageRef}
						className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-700 text-white disabled:opacity-50"
						placeholder="Type a message..."
						disabled={isStreaming}
						required
					/>
					<button
						type="submit"
						className="px-4 py-2 bg-green-900 text-sm text-white rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-800 transition duration-200 disabled:pointer-events-none disabled:opacity-50"
						disabled={isStreaming}
					>
						Send
					</button>
				</div>
			</form>
			{modalContent && (
				<Modal content={modalContent} onClose={closeModal} />
			)}
		</div>
	);
};

export default ChatArea;

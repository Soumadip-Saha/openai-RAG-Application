import React, { useState, useRef, useEffect } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Chat, Message } from "@/types/chat-types";
import Markdown from "markdown-to-jsx";
import { buildContext, getRelevanceScore } from "@/utils/functions";
import Modal from "./Modal";
import DisplayMessage from "./DisplayMessage";
import Spinner from "./Spinner";
import Tools from "./Tools";

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

<<<<<<< HEAD
	const messageRef = useRef<HTMLInputElement>(null);
=======
	const [showTools, setShowTools] = useState(false);
	const [tools, setTools] = useState(["Document", "Query", "Code"]);

	const messageRef = useRef<HTMLTextAreaElement>(null);
>>>>>>> master
	const chatWindowRef = useRef<HTMLDivElement>(null);

	const openModal = (content: string) => {
		setModalContent(content);
	};

	const closeModal = () => {
		setModalContent(null);
	};

	const streamQueryResponse = async (userMessage: string) => {
		try {
			onSendMessage({ role: "user", content: userMessage });

			setLoading(true);
			setLoadingText("Building Context...");
			const context = await buildContext(userMessage, currentChat!);

			setIsStreaming(true);

			let fullResponse = "";

			await fetchEventSource(
				process.env.NEXT_PUBLIC_SERVER_URL + "/stream",
				{
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
						setLoading(false);
						const chunk = event.data === "" ? " \n" : event.data;
						fullResponse += chunk;
						setStreamingContent(fullResponse);
					},
					onclose() {
						console.log("Stream closed");

						// setStreamingContent("");
						// setIsStreaming(false);
					},
					onerror(err) {
						console.error("Error from server", err);
						// setIsStreaming(false);
					},
				}
			);

			setLoading(true);
			setLoadingText("Evaluating Response...");
			const relevance = await getRelevanceScore(
				context.stand_alone_query,
				fullResponse
			);

			setStreamingContent("");
			setIsStreaming(false);
			onSendMessage({
				role: "assistant",
				content: fullResponse,
				references: context.references,
				score: relevance.response_score,
			});

			setLoading(false);
		} catch (error) {
			console.error("Failed to fetch from server", error);
			setIsStreaming(false);
			setLoading(false);
			alert("Failed to fetch from server");
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

<<<<<<< HEAD
=======
	const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;

		if (value.startsWith("@") && value.length === 1) {
			setShowTools(true);
		} else {
			setShowTools(false);
		}

		e.target.style.height = "auto";
		e.target.style.height = `${Math.min(e.target.scrollHeight, 7 * 24)}px`;
	};

	const handleToolSelect = (suggestion: string) => {
		if (messageRef.current) {
			messageRef.current.value = `@${suggestion} `;
			messageRef.current.focus();
			setShowTools(false);

			// Adjust textarea height after selection
			messageRef.current.style.height = "auto";
			messageRef.current.style.height = `${Math.min(
				messageRef.current.scrollHeight,
				7 * 24
			)}px`;
		}
	};

>>>>>>> master
	useEffect(() => {
		if (chatWindowRef.current) {
			chatWindowRef.current.scrollTop =
				chatWindowRef.current.scrollHeight;
		}
	}, [currentChat, streamingContent, loading]);

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
					<DisplayMessage
						key={index}
						message={message}
						openModal={openModal}
					/>
				))}
				{streamingContent && (
					<div className="flex justify-start">
						<Markdown className="markdown-content max-w-[83%] px-4 py-2 rounded-lg bg-[#131313] text-gray-300">
							{streamingContent}
						</Markdown>
					</div>
				)}
				{loading && (
					<p className="flex w-fit mx-auto pt-8">
						<Spinner className="mr-4 w-8 h-8 self-center" />
						{loadingText}
					</p>
				)}
			</div>
<<<<<<< HEAD
			<form onSubmit={handleSubmit} className="p-4 bg-zinc-900">
				<div className="flex space-x-2">
					<input
						type="text"
=======
			<form
				onSubmit={handleSubmit}
				className="p-4 bg-zinc-900 absolute bottom-0 w-[calc(100vw-256px)]"
			>
				<div className="flex space-x-2 items-center">
					<textarea
						contentEditable={!isStreaming}
>>>>>>> master
						ref={messageRef}
						className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-700 text-white disabled:opacity-50"
						placeholder="Type a message..."
						disabled={isStreaming}
<<<<<<< HEAD
						required
					/>
=======
						onChange={handleTextChange}
						style={{ minHeight: "24px", maxHeight: "168px" }}
						rows={1}
						required
					/>
					{showTools && (
						<Tools tools={tools} onSelect={handleToolSelect} />
					)}
>>>>>>> master
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

import React, { useState, useRef, useEffect, useCallback } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Chat, Message } from "@/types/chat-types";
import Markdown from "markdown-to-jsx";
import { buildContext, getRelevanceScore } from "@/utils/functions";
import Modal from "./Modal";
import DisplayMessage from "./DisplayMessage";
import Spinner from "./Spinner";
import TextBox, { ToolType } from "./TextBox";
import SkeletonLoader from "./SkeletonLoader";

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

	const chatWindowRef = useRef<HTMLDivElement>(null);

	const openModal = (content: string) => {
		setModalContent(content);
	};

	const closeModal = () => {
		setModalContent(null);
	};

	const stripToolText = (message: string, selectedTools: ToolType[]) => {
		if (selectedTools) {
			const toolNames = selectedTools.map((tool) => tool.name);
			const toolPattern = new RegExp(`@${toolNames.join("|")}\\s*`, "g");
			return message.replace(toolPattern, "").trim();
		}
		return message;
	};

	const streamQueryResponse = useCallback(
		async (userMessage: string, selectedTools: ToolType[]) => {
			try {
				const strippedMessage = stripToolText(
					userMessage,
					selectedTools
				);
				onSendMessage({ role: "user", content: strippedMessage });

				setLoading(true);
				setLoadingText("Building Context...");

				const tools = selectedTools.map((tool) => tool.id);
				const context = await buildContext(
					strippedMessage,
					currentChat!,
					tools
				);

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
							const chunk =
								event.data === "" ? " \n" : event.data;
							fullResponse += chunk;
							setStreamingContent(fullResponse);
						},
						onclose() {
							console.log("Stream closed");
						},
						onerror(err) {
							console.error("Error from server", err);
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
		},
		[currentChat, onSendMessage]
	);

	useEffect(() => {
		if (chatWindowRef.current) {
			chatWindowRef.current.scrollTo({
				top: chatWindowRef.current.scrollHeight,
				behavior: "smooth",
			});
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
				className="flex-1 overflow-y-auto p-4 space-y-4 pb-32"
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
				{loading && <SkeletonLoader />}
			</div>
			<TextBox
				chat={currentChat}
				streamQueryResponse={streamQueryResponse}
				isStreaming={isStreaming}
			/>
			{modalContent && (
				<Modal content={modalContent} onClose={closeModal} />
			)}
		</div>
	);
};

export default ChatArea;

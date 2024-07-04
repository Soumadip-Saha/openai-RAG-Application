import React, {
	useState,
	useRef,
	useEffect,
	useCallback,
	useMemo,
} from "react";
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
	const [inputValue, setInputValue] = useState("");
	const [showTools, setShowTools] = useState(false);
	const [selectedTool, setSelectedTool] = useState("");

	const messageRef = useRef<HTMLInputElement>(null);
	const chatWindowRef = useRef<HTMLDivElement>(null);
	const debounceTimeoutRef = useRef<number | undefined>(undefined);

	const tools = useMemo(() => ["Elastic"], []);

	const openModal = useCallback((content: string) => {
		setModalContent(content);
	}, []);

	const closeModal = useCallback(() => {
		setModalContent(null);
	}, []);

	const stripToolText = useCallback(
		(message: string) => {
			if (selectedTool) {
				const toolPattern = new RegExp(`@${selectedTool}\\s*`, "g");
				return message.replace(toolPattern, "").trim();
			}
			return message;
		},
		[selectedTool]
	);

	const streamQueryResponse = useCallback(
		async (userMessage: string) => {
			try {
				const strippedMessage = stripToolText(userMessage);
				onSendMessage({ role: "user", content: strippedMessage });

				setLoading(true);
				setLoadingText("Building Context...");
				const context = await buildContext(
					strippedMessage,
					currentChat!,
					selectedTool ? [selectedTool + "Tool"] : []
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
		[currentChat, onSendMessage, selectedTool, stripToolText]
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (inputValue.trim() && !isStreaming) {
				streamQueryResponse(inputValue);
				setInputValue("");
				setSelectedTool("");
			}
		},
		[inputValue, isStreaming, streamQueryResponse]
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setInputValue(value);

			if (value.startsWith("@") && !value.trim().includes(" ")) {
				setShowTools(true);
			} else {
				setShowTools(false);
			}
		},
		[]
	);

	const debouncedHandleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			clearTimeout(debounceTimeoutRef.current);
			const value = e.target.value;

			debounceTimeoutRef.current = window.setTimeout(() => {
				handleInputChange(e);
			}, 500);

			setInputValue(value);
		},
		[handleInputChange]
	);

	const handleToolSelect = useCallback((tool: string) => {
		const toolName = `@${tool} `;
		setSelectedTool(tool);
		setShowTools(false);
		setInputValue(
			(prevValue) => toolName + prevValue.replace(/^@\w*\s*/, "")
		);
		messageRef.current?.focus();
	}, []);

	useEffect(() => {
		if (chatWindowRef.current) {
			chatWindowRef.current.scrollTop =
				chatWindowRef.current.scrollHeight;
		}
	}, [currentChat, streamingContent, loading]);

	const renderInputWithHighlight = useMemo(() => {
		if (selectedTool) {
			const toolPattern = new RegExp(`^(@${selectedTool}\\s)`);
			const match = inputValue.match(toolPattern);
			if (match) {
				return (
					<>
						<span className="text-green-600">{match[0]}</span>
					</>
				);
			} else {
				setSelectedTool("");
			}
		}
		return "";
	}, [inputValue, selectedTool]);

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
			{modalContent && (
				<Modal content={modalContent} onClose={closeModal} />
			)}
			<form
				onSubmit={handleSubmit}
				className="p-4 bg-zinc-900 absolute bottom-0 w-[calc(100vw-256px)]"
			>
				<div className="flex space-x-2 items-center relative">
					<div className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-800 rounded-lg focus-within:ring-2 focus-within:ring-zinc-700 text-white">
						<div className="relative">
							<div className="absolute inset-0 pointer-events-none">
								{renderInputWithHighlight}
							</div>
							<input
								ref={messageRef}
								type="text"
								className="w-full bg-transparent focus:outline-none"
								value={inputValue}
								onChange={debouncedHandleInputChange}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSubmit(e);
									}
								}}
								disabled={isStreaming}
							/>
							{showTools && (
								<Tools
									tools={tools}
									onSelect={handleToolSelect}
								/>
							)}
						</div>
					</div>
					<button
						type="submit"
						className="px-4 py-2 bg-green-900 text-sm text-white rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-800 transition duration-200 disabled:pointer-events-none disabled:opacity-50"
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

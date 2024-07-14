"use client";

import { Chat } from "@/types/chat-types";
import React, { useState, useRef, useEffect } from "react";

const tools = [
	{ id: "ElasticTool", name: "Elastic Search", icon: "🔎" },
	{ id: "PythonTool", name: "Python", icon: "🐍" },
];

export type ToolType = (typeof tools)[0];

type IProps = {
	chat: Chat;
	streamQueryResponse: (
		userMessage: string,
		selectedTools: ToolType[]
	) => Promise<void>;
	isStreaming: boolean;
};

const TextBox: React.FC<IProps> = ({
	chat,
	streamQueryResponse,
	isStreaming,
}) => {
	const [inputValue, setInputValue] = useState("");
	const [selectedTools, setSelectedTools] = useState<ToolType[]>([]);
	const [showPopup, setShowPopup] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				popupRef.current &&
				!popupRef.current.contains(event.target as Node)
			) {
				setShowPopup(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		inputRef.current?.focus();
	}, [chat]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue(value);
		if (value.endsWith("@")) {
			setShowPopup(true);
			setHighlightedIndex(0);
		} else {
			setShowPopup(false);
		}
	};

	const handleItemClick = (item: (typeof tools)[0]) => {
		const newSelectedTools = [...selectedTools, item];
		setSelectedTools(newSelectedTools);
		const mentionText = `@${item.name}`;
		setInputValue(inputValue.slice(0, -1) + mentionText + " ");
		setShowPopup(false);
		inputRef.current?.focus();
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (showPopup) {
			switch (e.key) {
				case "ArrowUp":
					e.preventDefault();
					setHighlightedIndex((prev) =>
						prev > 0 ? prev - 1 : tools.length - 1
					);
					break;
				case "ArrowDown":
					e.preventDefault();
					setHighlightedIndex((prev) =>
						prev < tools.length - 1 ? prev + 1 : 0
					);
					break;
				case "Enter":
					e.preventDefault();
					handleItemClick(tools[highlightedIndex]);
					break;
				case "Escape":
					setShowPopup(false);
					break;
			}
		} else {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				streamQueryResponse(inputValue, selectedTools);
				setInputValue("");
				setSelectedTools([]);
				setShowPopup(false);
			}
		}
	};

	const renderFormattedInput = () => {
		let formattedText = inputValue;
		selectedTools.forEach((item) => {
			const mentionText = `@${item.name}`;
			formattedText = formattedText.replace(
				mentionText,
				`<span class="font-bold text-blue-600">${mentionText}</span>`
			);
		});
		return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
	};

	const sendMessage = () => {
		streamQueryResponse(inputValue, selectedTools);
		setInputValue("");
		setSelectedTools([]);
		setShowPopup(false);
	};

	return (
		<div className="text-box z-10 p-4 bg-zinc-950 absolute bottom-0 w-[calc(100vw-256px)] flex gap-4">
			{showPopup && (
				<div
					ref={popupRef}
					className="tools-popup w-fit mb-2 bg-gray-[#18181b] border border-gray-950 rounded-md shadow-lg overflow-hidden"
				>
					{tools.map((item, index) => (
						<div
							key={item.id}
							className={`flex tools-center px-4 py-2 cursor-pointer ${
								index === highlightedIndex
									? "bg-zinc-800"
									: "hover:bg-zinc-800"
							}`}
							onClick={() => handleItemClick(item)}
						>
							<span className="mr-2">{item.icon}</span>
							<span>{item.name}</span>
						</div>
					))}
				</div>
			)}
			<input
				ref={inputRef}
				type="text"
				value={inputValue}
				onChange={handleInputChange}
				onKeyDown={handleKeyDown}
				className="text-input w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-zinc-900 outline-none"
				placeholder="Enter your query..."
			/>
			<div className="formatted-input">{renderFormattedInput()}</div>
			<button
				type="submit"
				className="px-4 py-2 bg-green-900 text-sm text-white rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-800 transition duration-200 disabled:pointer-events-none disabled:opacity-50"
				disabled={isStreaming}
				onClick={sendMessage}
			>
				Send
			</button>
		</div>
	);
};

export default TextBox;

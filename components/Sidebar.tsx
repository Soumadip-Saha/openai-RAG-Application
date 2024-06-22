import { Chat } from "@/types/chat-types";
import React, { useState, useRef } from "react";

interface SidebarProps {
	chats: Chat[];
	currentChatId: string | null;
	onCreateNewChat: () => void;
	onDeleteChat: (chatId: string) => void;
	onSelectChat: (id: string) => void;
	onUpdateChat: (chat: Chat) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
	chats,
	currentChatId,
	onCreateNewChat,
	onDeleteChat,
	onSelectChat,
	onUpdateChat,
}) => {
	const [editingChatId, setEditingChatId] = useState<string | null>(null);
	const editTitleRef = useRef<HTMLInputElement>(null);

	const startEditingChat = (chatId: string) => {
		setEditingChatId(chatId);
	};

	const finishEditingChat = () => {
		if (editingChatId && editTitleRef.current) {
			const updatedChat = chats.find((chat) => chat.id === editingChatId);
			if (updatedChat) {
				onUpdateChat({
					...updatedChat,
					title: editTitleRef.current.value,
				});
			}
			setEditingChatId(null);
		}
	};

	return (
		<div className="w-64 p-4 overflow-y-auto glassmorphism">
			<button
				onClick={onCreateNewChat}
				className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 rounded-lg mb-4 transition duration-200"
			>
				New Chat
			</button>
			{chats.map((chat) => (
				<div key={chat.id} className="mb-2">
					{editingChatId === chat.id ? (
						<input
							ref={editTitleRef}
							defaultValue={chat.title}
							onBlur={finishEditingChat}
							className="w-full bg-gray-700 bg-opacity-60 px-2 py-1 rounded"
							autoFocus
						/>
					) : (
						<div className="flex items-center">
							<div
								onClick={() => onSelectChat(chat.id)}
								className={`flex-grow p-2 rounded-lg cursor-pointer ${
									currentChatId === chat.id
										? "bg-gray-700 bg-opacity-60"
										: "hover:bg-gray-700 hover:bg-opacity-60"
								}`}
							>
								{chat.title}
							</div>
							<button
								onClick={() => startEditingChat(chat.id)}
								className="ml-2 text-gray-400 hover:text-white"
							>
								✏️
							</button>
							<button
								onClick={() => onDeleteChat(chat.id)}
								className="ml-2 text-gray-400 hover:text-white"
							>
								🗑️
							</button>
						</div>
					)}
				</div>
			))}
		</div>
	);
};

export default Sidebar;

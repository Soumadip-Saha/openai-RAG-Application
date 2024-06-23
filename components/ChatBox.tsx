"use client";
import { Chat, Message } from "@/types/chat-types";
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";

const ChatBox: React.FC = () => {
	const [chats, setChats] = useState<Chat[]>([]);
	const [currentChatId, setCurrentChatId] = useState<string | null>(null);

	const createNewChat = () => {
		const newChat: Chat = {
			id: Date.now().toString(),
			title: "New Chat",
			messages: [],
		};
		setChats((prev) => [...prev, newChat]);
		setCurrentChatId(newChat.id);
	};

	const deleteChat = (chatId: string) => {
		setChats((prev) => prev.filter((chat) => chat.id !== chatId));
		if (currentChatId === chatId) {
			setCurrentChatId(null);
		}
	};

	const updateChat = (updatedChat: Chat) => {
		setChats((prev) =>
			prev.map((chat) =>
				chat.id === updatedChat.id ? updatedChat : chat
			)
		);
	};

	const addMessageToCurrentChat = (message: Message) => {
		setChats((prev) =>
			prev.map((chat) =>
				chat.id === currentChatId
					? { ...chat, messages: [...chat.messages, message] }
					: chat
			)
		);
	};

	const currentChat = chats.find((chat) => chat.id === currentChatId) || null;

	return (
		<div className="flex h-screen bg-[#1c1c1c] text-white">
			<Sidebar
				chats={chats}
				currentChatId={currentChatId}
				onCreateNewChat={createNewChat}
				onDeleteChat={deleteChat}
				onSelectChat={setCurrentChatId}
				onUpdateChat={updateChat}
			/>
			<ChatArea
				currentChat={currentChat}
				onSendMessage={addMessageToCurrentChat}
			/>
		</div>
	);
};

export default ChatBox;

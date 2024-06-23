import { Message } from "@/types/chat-types";
import Markdown from "markdown-to-jsx";

interface IDisplayMessageProps {
	message: Message;
	openModal: (content: string) => void;
}

const DisplayMessage: React.FC<IDisplayMessageProps> = ({
	message,
	openModal,
}) => {
	return (
		<div
			className={`flex flex-col ${
				message.role === "user" ? "items-end" : "items-start"
			}`}
		>
			<Markdown
				className={`markdown-content max-w-[83%] px-4 py-2 rounded-lg ${
					message.role === "user"
						? "bg-blue-900 text-white"
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
								className="px-2 py-1 bg-gray-500 opacity-35 text-white text-[0.6rem] rounded-full hover:bg-gray-600 hover:opacity-100 transition duration-200"
							>
								{key}
							</button>
						)
					)}
					{message.score && (
						<p className="grid place-items-center font-medium rounded-full px-2 py-1 text-xs bg-green-600 text-slate-200">
							{(message.score * 100).toFixed(2)}%
						</p>
					)}
				</div>
			)}
		</div>
	);
};

export default DisplayMessage;

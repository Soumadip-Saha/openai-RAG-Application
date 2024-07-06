import React from "react";
import Markdown from "markdown-to-jsx";

interface ModalProps {
	content: string;
	onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ content, onClose }) => {
	const handleBackdropClick = (
		e: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<div
			onClick={handleBackdropClick}
			className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
		>
			<div className="relative bg-zinc-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
				<Markdown className="text-gray-300 text-sm mt-2">
					{content}
				</Markdown>
			</div>
		</div>
	);
};

export default Modal;

const Tools: React.FC<{
	tools: string[];
	onSelect: (tool: string) => void;
}> = ({ tools, onSelect }) => (
	<div className="absolute left-0 bottom-full mb-2 bg-zinc-800 rounded-lg shadow-lg z-10 tools-popup">
		{tools.map((tool, index) => (
			<div
				key={index}
				className="px-4 py-2 hover:bg-zinc-700 cursor-pointer"
				onClick={() => onSelect(tool)}
			>
				{tool}
			</div>
		))}
	</div>
);

export default Tools;

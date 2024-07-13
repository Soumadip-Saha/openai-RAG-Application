const SkeletonLoader = () => {
	return (
		<div className="animate-pulse space-y-4 w-3/5">
			<div className="h-1 bg-gray-400 rounded-md animate-bounce"></div>
			<div className="h-1 bg-gray-400 rounded-md animate-bounce"></div>
			<div className="h-1 bg-gray-400 rounded-md animate-bounce"></div>
			<div className="h-1 bg-gray-400 rounded-md animate-bounce"></div>
		</div>
	);
};

export default SkeletonLoader;

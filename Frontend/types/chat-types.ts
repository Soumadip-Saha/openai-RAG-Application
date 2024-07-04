export interface Message {
	role: "user" | "assistant";
	content: string;
	references?: { [key: string]: string };
	score?: number;
}

export interface Chat {
	id: string;
	title: string;
	messages: Message[];
}

export interface BuildContextInput {
	question: string;
	answer: string;
}

export interface BuildContextOutput {
	query: string;
	stand_alone_query: string;
	docs: Array<{ [key: string]: string | number }>;
	references: { [key: string]: string };
	context: string;
	userId: string;
}

export interface EvaluateResponseOutput {
	similar_queries: string[];
	response_score: number;
	userId: string;
}

from code.embedding import EmbeddingModel
from code.llm import LLMClient
from code.retriever import VectorDB
from code.prompt import PromptTemplate
from typing import List, Dict, Any
from code.tools import ElasticTool

DEFAULT_CHAT_TEMPLATE = PromptTemplate(
    "Given a chat history and the latest user question "
    "which might reference context in the chat history, "
    "formulate a standalone question which can be understood "
    "without the chat history. Do NOT answer the question, just "
    "reformulate it if needed and otherwise return it as is. Chat history:\n"
    "{chat_history}\n"
    "Stand-alone query: {query}",
    input_variables=["chat_history", "query"]
)

DEFAULT_SYSTEM_TEMPLATE = PromptTemplate(
    "You are an AI assistant. You are given a context and your knowledge is only limited to that context. Whenever you are asked a question, you should answer that question based on the context. If you are not able to generate the answer based on the context, you must always response this exact phrase: 'Sorry could not generate an answer. Please rephrase the question and ask again.'"
    "\n----------------\n"
    "Context: {context}",
    input_variables=["context"]
)


class ChatBot():
    def __init__(
        self,
        openai_api_key: str,
        embedding_model: str,
        llm_model: str,
        vector_database_config: Dict[str, Any],
        chat_history_template: PromptTemplate = DEFAULT_CHAT_TEMPLATE,
        system_template: PromptTemplate = DEFAULT_SYSTEM_TEMPLATE
    ):
        self.embedding_model = EmbeddingModel(openai_api_key, embedding_model)
        self.llm = LLMClient(llm_model, openai_api_key)
        self.vector_db = VectorDB(**vector_database_config)
        self.chat_template = chat_history_template
        self.system_template = system_template
        self.tool_list = {
            "ElasticTool": ElasticTool(self.llm)
        }

    @staticmethod
    def format_chat_history(messages: List[Dict[str, str]]):
        chat_history = ""
        for message in messages:
            chat_history += f"User: {message['question']}\nAssistant: {message['answer']}\n"
        return chat_history

    async def get_standalone_query(self, query: str, chats: List[Dict[str, str]], temperature=0.0):
        chat_history = ChatBot.format_chat_history(chats)
        stand_alone_query = await self.llm.generate(
            self.chat_template.format_template(
                chat_history=chat_history, query=query),
            temperature=temperature
        )
        return stand_alone_query.choices[0].message.content

    @staticmethod
    def create_context(docs: List[Dict[str, Any]], params: List[str] = ["source"]):
        context = ""
        for doc in docs:
            context += f"Document name: {doc[params[0]]}: {doc['content']}\n\n\n"
        return context.strip('\n\n\n')

    async def __call__(self, query: str, chats: List[Dict[str, str]] = [], **kwds):
        if len(chats) > 0:
            new_query = await self.get_standalone_query(query=query, chats=chats)
        else:
            new_query = query
        docs = await self.vector_db.get_docs(
            query=new_query, embedding_model=self.embedding_model, top_docs=kwds.get(
                'top_docs', 5)
        )
        context = ChatBot.create_context(docs)
        response = await self.llm.generate(
            new_query,
            system_template=self.system_template.format_template(
                context=context
            ),
            temperature=kwds.get('temperature', 0.0),
            seed=kwds.get('seed', 1),
            logprobs=kwds.get('logprobs', True)
        )
        if kwds.pop("developer_details", False):
            confidence_score = self.llm.calculate_confidence(response)
        else:
            confidence_score = None
        return {
            "response": response,
            "stand_alone_query": new_query,
            "token_usage": response.usage.total_tokens,
            "docs": docs,
            "confidence_score": confidence_score
        }

    async def stream(self, query: str, context: str, **kwds):
        response = await self.llm.generate(
            query,
            system_template=self.system_template.format_template(
                context=context
            ),
            temperature=kwds.get('temperature', 0.0),
            seed=kwds.get('seed', 1),
            logprobs=kwds.get('logprobs', True),
            stream=True
        )

        async for chunk in response:
            if chunk.choices[0].delta.content:
                yield "data: " + chunk.choices[0].delta.content + "\n\n"
            else:
                yield "data: \n\n"

    async def build_context(self, query: str, chats: List[Dict[str, str]] = [], **kwds):
        if len(chats) > 0:
            new_query = await self.get_standalone_query(query, chats)
        else:
            new_query = query

        tools = kwds.get("tools", None)
        if tools:
            # TODO: Add support for multiple tools
            tool_to_use = self.tool_list.get(tools[0])
            search_query = await tool_to_use(new_query)
            print("Search_query: ", search_query)
            docs = await self.vector_db.get_docs(
                new_query, self.embedding_model, top_docs=kwds.get("top_docs", 5), search_query=search_query
            )
        else:
            docs = await self.vector_db.get_docs(
                new_query, self.embedding_model, top_docs=kwds.get(
                    "top_docs", 5)
            )

        return {
            "query": query,
            "stand_alone_query": new_query,
            "docs": docs
        }

from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
import os
from typing import List, Dict, Any, Union
from code.chat import ChatBot
import numpy as np
from contextlib import asynccontextmanager


class ChatRequest(BaseModel):
    query: str
    chats: List[Dict[str, str]]
    userId: str
    developer_details: bool = False


class ChatResponse(BaseModel):
    answer: str
    query: str
    references: List[str]
    userId: str


class DevChatResponse(BaseModel):
    answer: str
    query: str
    stand_alone_query: str
    docs: List[Dict[str, Any]]
    confidence_score: float
    response_score: float
    token_usage: int


def load_config() -> Dict:
    return {
        "OPENAI_API_KEY": os.getenv('OPENAI_API_KEY'),
        "embedding_model_name": os.getenv('embedding_model_name'),
        "llm_model_name": os.getenv('llm_model_name'),
        "VectorDB_HOST": os.getenv('VectorDB_HOST'),
        "VectorDB_INDEX": os.getenv('VectorDB_INDEX'),
        "VectorDB_USER_NAME": os.getenv('VectorDB_USER_NAME'),
        "VectorDB_password": os.getenv('VectorDB_password')
    }


chatbot = None


@asynccontextmanager
async def get_chatbot(app: FastAPI):
    global chatbot
    config = load_config()
    chatbot = ChatBot(
        openai_api_key=config['OPENAI_API_KEY'],
        embedding_model=config['embedding_model_name'],
        llm_model=config['llm_model_name'],
        vector_database_config={
            'host': config['VectorDB_HOST'],
            'index': config['VectorDB_INDEX'],
            'user_name': config['VectorDB_USER_NAME'],
            'password': config['VectorDB_password']
        }
    )
    yield
    chatbot = None


app = FastAPI(lifespan=get_chatbot)


async def evaluate_response(
    query: str, response: str, chatbot: ChatBot
):
    similar_queries = []
    for _ in range(3):
        output = await chatbot.llm.generate(
            input_prompt=f"Response: {response}",
            system_template="Based on a given response, generate the original "
            "question that could have led to the response.\n",
        )
        similar_queries.append(output.choices[0].message.content)

    query_vector = await chatbot.embedding_model.get_embeddings(query)
    similar_query_vector = await chatbot.embedding_model.get_embeddings(similar_queries)
    score = 0
    for gen_query_vec in similar_query_vector:
        score += (
            np.dot(query_vector, gen_query_vec) /
            (np.linalg.norm(query_vector)*np.linalg.norm(gen_query_vec))
        )
    return score/3


def process_output(output: Dict[str, Any]) -> Dict[str, Any]:
    answer = output["response"].choices[0].message.content
    answer = answer.strip()
    references = []
    for doc in output["docs"]:
        file_name = os.path.basename(
            doc['source'].replace('\\', os.sep))
        if file_name not in references:
            references.append(file_name)
    return {
        "answer": answer,
        "references": references
    }


@app.post("/generate_ans", response_model=Union[ChatResponse, DevChatResponse])
async def chat_endpoint(
    request: ChatRequest
):
    try:
        if request.developer_details:
            output = await chatbot(
                query=request.query, chats=request.chats,
                developer_details=request.developer_details
            )
            answer = output["response"].choices[0].message.content
            query = request.query
            response_score = await evaluate_response(query, answer, chatbot)
            return DevChatResponse(
                answer=answer,
                query=query,
                stand_alone_query=output["stand_alone_query"],
                docs=output["docs"],
                confidence_score=output["confidence_score"],
                response_score=response_score,
                token_usage=output["token_usage"]
            )
        else:
            output = await chatbot(query=request.query, chats=request.chats)
            response = process_output(output=output)
            return ChatResponse(
                answer=response["answer"],
                query=request.query,
                references=response["references"],
                userId=request.userId
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

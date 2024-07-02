from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
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
    response: str
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


class StreamInput(BaseModel):
    userId: str
    context: str
    query: str


class BuildContextInput(BaseModel):
    query: str
    chats: List[Dict[str, str]]
    userId: str


class BuildContextOutput(BaseModel):
    query: str
    stand_alone_query: str
    docs: List[Dict[str, str | float]]
    references: Dict[str, str]
    context: str
    userId: str


class EvaluateResponseInput(BaseModel):
    stand_alone_query: str
    answer: str
    userId: str


class EvaluateResponseOutput(BaseModel):
    similar_queries: List[str]
    response_score: float
    userId: str


def load_config() -> Dict:
    return {
        "OPENAI_API_KEY": os.getenv('OPENAI_API_KEY'),
        "embedding_model_name": os.getenv('EMBEDDING_MODEL_NAME'),
        "llm_model_name": os.getenv('LLM_MODEL_NAME'),
        "VectorDB_HOST": os.getenv('VECTORDB_HOST'),
        "VectorDB_INDEX": os.getenv('VECTORDB_INDEX').split(','),
        "VectorDB_USER_NAME": os.getenv('VECTORDB_USER_NAME'),
        "VectorDB_password": os.getenv('VECTORDB_PASSWORD')
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
    await chatbot.vector_db.client.close()
    chatbot = None


app = FastAPI(lifespan=get_chatbot)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def evaluate_response(
    query: str, response: str, chatbot: ChatBot
):
    similar_queries = []
    for _ in range(3):
        output = await chatbot.llm.generate(
            input_prompt=f"Response: {response}",
            system_template="Based on a given response, generate the original "
            "question that could have led to the response.\n",
            temperature=0.8,
            seed=None
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
    return score/3, similar_queries


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


@app.post("/build_context", response_model=BuildContextOutput)
async def build_context(request: BuildContextInput):
    try:
        response = await chatbot.build_context(
            query=request.query, chats=request.chats
        )
        response["context"] = chatbot.create_context(response["docs"])
        references = {}
        for doc in response["docs"]:
            doc_name = os.path.basename(
                doc['source'].replace('\\', os.sep)
            )
            references[doc_name] = references.get(
                doc_name, "") + f"{doc['content']}\n\n"
        return BuildContextOutput(
            query=response["query"],
            stand_alone_query=response["stand_alone_query"],
            docs=response["docs"],
            context=response["context"],
            references=references,
            userId=request.userId
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stream", response_model=str)
async def stream(request: StreamInput):
    return StreamingResponse(chatbot.stream(query=request.query, context=request.context), media_type="text/event-stream")


@app.post("/evaluate_response", response_model=EvaluateResponseOutput)
async def evaluate_response_endpoint(
    request: EvaluateResponseInput
):
    try:
        score, similar_queries = await evaluate_response(
            query=request.stand_alone_query, response=request.answer, chatbot=chatbot
        )
        return EvaluateResponseOutput(
            similar_queries=similar_queries,
            response_score=score,
            userId=request.userId
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
                response_score=response_score[0],
                token_usage=output["token_usage"]
            )
        else:
            output = await chatbot(query=request.query, chats=request.chats)
            response = process_output(output=output)
            return ChatResponse(
                response=response["answer"],
                query=request.query,
                references=response["references"],
                userId=request.userId
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

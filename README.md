# openai-RAG-Backend

## Overview
In this repository, we have made a pipelien to build a RAG backend using `docker-compose.yml` file to question answer from documents. This repository has the following features and shows a detailed way how developers can easily have a backend with fully transparent RAG system.

- Uses `Elasticsearch` to connect with the vector database.
- Built in simple yet powerfull, custom wrappers on top of [OpenAI](https://openai.com/) and `Elasticsearch` to eleminate the requirement of ever changing and badly documented LangChain. 
- Provides FastAPI application endpoint which is ready to be used in production.

## How to Use
The prebuild image is already available for this repository in [DockerHub](https://hub.docker.com/repository/docker/sahasoumadip/openai-rag). User can simply pull this image and build the container using the [docker-compose.yml](./docker-compose.yml) file. To set the enviorunment variables just set them in the docker-compose file and run this command `docker-compose up`. Here is an example of how to set the enviorunment variables:

```docker-compose.yml
version: '3.8'
services:
  tcg-rag:
    # build:
    #   context: .
    #   dockerfile: Dockerfile
    ports:
      - "5400:5400"
    image: sahasoumadip/openai-rag:1.2
    container_name: RAG_Backend
    environment:
      - OPENAI_API_KEY="OPENAI-KEY"
      - llm_model_name="gpt-4-0125-preview"
      - embedding_model_name="text-embedding-3-small"
      - VectorDB_HOST="http://elastic-search-url"
      - VectorDB_INDEX="YOUR_INDEX"
      - VectorDB_USER_NAME="ELASTIC_USERNAME"
      - VectorDB_password="ELASTIC_PASSWORD"
    command: "--workers 4"
```

## Scaling the application and load tolerance
The application is written in FastAPI and supports asynchronous process to run concurrent requests. We have tested the backend upto 100 concurrent users with average 14 seconds latency for complete answer generation. The [DockerFile](./Dockerfile) uses `uvicorn` to run the application in the container. The number of workers are also configurable in the container using the `docker-compose.yml` file for different system hardwares, enabling more scalability and reducing latency.

## Code transperancy
Simple RAG system consists of multiple steps:

1. Creating a stand-alone query, by calling LLM, from the chat-history, which we will recieve from the user's request.
2. Create embeddings of the stand-alone query to retrieve the `top_k` (DEFAULT=5) document from the vector database, in our case Elasticsearch, using cosine-similarity.
3. After retrieving the relevant documents, we will pass the user's standalone question with the text of the documents as context to generate the answer.
4. Using the retrieved documents we can also provide the documents as reference for the user from which the answer is generated.
5. There is one more additional parameter `developer_details` which we can pass as `true` from the API request body, to get the details of all the intermediate steps, with addition of a scoring method to evaluate the generated answer.

    - The function [evaluate_response](./app.py#71) uses the generated answer to reverse-engineer three different versions of original the query using LLM. Then we create embedding of these generated queries along side the original query and calculate the cosine-similarity of these generated queries with the original query. After taking average of the similarity scores we get the final score. Idealy if the generated_answer is well versed and complete, LLM should be able to reverse-engineer the query accurately. Hence the similarity-score will be very close to 1. You can read more about it in [here](https://docs.ragas.io/en/latest/concepts/metrics/answer_relevance.html).
    - This returns the number of tokens used to generate the response.
    - The stand-alone query to retrieve the documents.
    - The `top_k` documents along with their similarity score.
    - The [`confidence_score`](./code/llm.py#16) which is the summation of log probability (in percentage) of all the tokens. You can find more about it [here](https://ai.plainenglish.io/mastering-gpt-3-the-mathematics-of-logprobs-for-ruby-devs-1eb55fc1326)

## Future Features
This version of the openai-RAG-Backend is going to add streaming and more features for the developers (i.e. Logger handling, rate-limit handling in API calls etc.) in it's next versions.
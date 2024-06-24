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
  openai-rag:
    # build:
    #   context: .
    #   dockerfile: Dockerfile
    ports:
      - 5400:5400
    image: sahasoumadip/openai-rag:1.2
    container_name: RAG_Backend
    environment:
      - OPENAI_API_KEY=OPENAI-KEY
      - llm_model_name=gpt-4-0125-preview
      - embedding_model_name=text-embedding-3-small
      - VectorDB_HOST=http://elastic-search-url
      - VectorDB_INDEX=YOUR_INDEX
      - VectorDB_USER_NAME=ELASTIC_USERNAME
      - VectorDB_password=ELASTIC_PASSWORD
    command: "--workers 4"
```

There are total of 4 api-endpoints present in the entire application.
- `/build_context:` This endpoint request must contain:
  - `query` The query asked by the user. This is a string. 
  - `userId` The unique id for each user. This is also string.
  - `chats` This is a list of dictionaries, containing the previous question and answers in that chat interface.

  Here is a sample format of such request body
  ```json
  {
      "userId": "admin",
      "query": "Which genes are related to gallstones?",
      "chats": [
        {
          "question": "Which miRNAs are involved in pancreatitis?",
          "answer": "The miRNAs involved in pancreatitis include hsa-miR-15a, hsa-miR-16, hsa-miR-155, hsa-miR-375, and hsa-miR-429."
        },
        {
          "question": "Which genes are associated with breast cancer?",
          "answer": "The genes associated with breast cancer include FGFR2, TNRC9, MAP3K1, LSP1, PTHLH, NRIP1, BRCA1, BRCA2, PALB2, HMMR, NOTCH2, FCGR1B, RAD51L1, SETBP1, RNF115, and PDZK1."          
        }
      ]
  }
  ``` 
  
  The response consists of five parameters
    - `query` The original query asked by the user. This is a string.
    - `stand_alone_query` The stand alone query formulated based on the chat history. This is a string.
    - `docs` These are the documents which is mostly relevant to the user's query. This is a list of dictionaries.
    - `context` This is the entire context build from the documents that will be used to generate the answer to the user's query. This is a string.
    - `userId` The unique id for each user. This is also string.
    - `references` The name and the content of documents that will be used to generate the answer. This is a dictionary.
  
  Here is a sample format of such response body
  ```json
  {
    "query": "Which genes are related to gallstones?",
    "stand_alone_query": "Which genes are related to gallstones?",
    "docs": [
      {
        "content": "A genome-wide association scan identifies the hepatic cholesterol transporter ABCG8 as a susceptibility factor for human gallstone disease.",
        "source": "17632509.txt",
        "score": 1.6543186
      },
      {
        "content": "Alternatively, defects in other regions of the gene or in other genes may also be involved, and some evidence from animal studies has pointed to Abcb 11 (previously called the bile salt export pump, BSEP ), Abcc 2 (previously referred to as multidrug resistance related protein 2, or MRP2 ) or Abcg5 / Abcg8 as other possible candidate genes underlying susceptibility to cholelithiasis [ 15 - 19 ] or phospholipid secretion disruption [ 20 ].    ",
        "source": "PMC1910597.txt",
        "score": 1.6352329
      },
      {
        "content": "Many studies indicate that gallstone susceptibility has genetic components. MDR3 is the phosphatidylcholine translocator across the hepatocyte canalicular membrane.",
        "source": "11313316.txt",
        "score": 1.6261426
      },
      {
        "content": "We recently put forward arguments in favor of ABCB4 gene (adenosine triphosphate-binding cassette, subfamily B, member 4) defects as a risk factor for symptomatic cholelithiasis in adults.",
        "source": "12891548.txt",
        "score": 1.5904465
      },
      {
        "content": "Low phospholipid associated cholelithiasis: association with mutation in the MDR3/ABCB4 gene",
        "source": "PMC1910597.txt",
        "score": 1.5867833
      }
    ],
    "context": "Document name: 17632509.txt: A genome-wide association scan identifies the hepatic cholesterol transporter ABCG8 as a susceptibility factor for human gallstone disease.\n\n\nDocument name: PMC1910597.txt: Alternatively, defects in other regions of the gene or in other genes may also be involved, and some evidence from animal studies has pointed to Abcb 11 (previously called the bile salt export pump, BSEP ), Abcc 2 (previously referred to as multidrug resistance related protein 2, or MRP2 ) or Abcg5 / Abcg8 as other possible candidate genes underlying susceptibility to cholelithiasis [ 15 - 19 ] or phospholipid secretion disruption [ 20 ].\n\n\nDocument name: 11313316.txt: Many studies indicate that gallstone susceptibility has genetic components. MDR3 is the phosphatidylcholine translocator across the hepatocyte canalicular membrane. Because phospholipids are a carrier and a solvent of cholesterol in hepatic bile, we hypothesized that a defect in the MDR3 gene could be the genetic basis for peculiar forms of cholesterol gallstone disease, in particular those associated with symptoms and cholestasis without evident common bile duct stone.\n\n\nDocument name: 12891548.txt: We recently put forward arguments in favor of ABCB4 gene (adenosine triphosphate-binding cassette, subfamily B, member 4) defects as a risk factor for symptomatic cholelithiasis in adults.\n\n\nDocument name: PMC1910597.txt: Low phospholipid associated cholelithiasis: association with mutation in the MDR3/ABCB4 gene"
  }
  ```

- `/stream:` This endpoint request must contain:
  - `userId` The query asked by the user. This is a string.
  - `context` The context that will be used to genereate the answer. This is a string.
  - `query` The query which will be answered referening the context. This is a string.

  Here is a sample json of the request:
  ```json
  {
    "query": "What is the reason of cancer.",
    "context": "Gene mutations can cause cancer."
  }
  ```
  The output of this api end point will be a SSE (server side events) stream (Text).

- `/evaluate_response:` This endpoint request must contain:
  -  `stand_alone_query` The query that is used to generate the answer. This is a string.
  - `answer` The answer that will be evaluated and given a score in between 0 to 1. This is a string.
  - `userId` The unique id for each user. This is also string.

  Here is a sample format of the request body
  ```json
  {
    "userId": "admin",
    "answer": "The capital of India is New Delhi.",
    "stand_alone_query": "What is the capital of India?"
  }
  ```

  The response consists of three parameters
    - `similar_queries` LLM genereated queries which will be used to evaluate the response. This is a list of strings.
    - `response_score` The score of the answer in range of 0 to 1.
    - `userId` The unique id for each user. This is also string.

- `/generate_ans` This endpoint does all the steps but doesn't provide streaming response. This endpoint request must contain:
  - `query` The query asked by the user. This is a string.
  - `chats` This is a list of dictionaries, containing the previous question and answers in that chat interface.
  - `userId` The unique id for each user. This is also string.
  - `developer_details` Whether to return details for developer or not. This is a boolean.

  Here is a sample format for the request body
  ```json
  {
      "userId": "admin",
      "query": "Which genes are related to gallstones?",
      "chats": [],
      "developer_details": false
  }
  ```
  The response consists of seven parameters
    - `answer` The answer to the query. This is a string.
    - `query` The query that user asked. This is a string.
    - `references` The list of documents which were used to generate the answer. This is a list of string of the file names.
    - `userId` The unique id for each user. This is also string.
    - `stand_alone_query` This is the LLM generated stand alone question from the chat history to retrieve the documents. This is returned only when the `developer_details` is set to `true`. This is a string.
    - `docs` These are the documents which is mostly relevant to the user's query. This is returned only when the `developer_details` is set to `true`. This is a list of dictionaries.
    - `confidence_score` You can read more about it [here](#code-transperancy). This is returned only when the `developer_details` is set to `true`. This is a floating point number
    - `response_score` The score of the answer in range of 0 to 1. This is returned only when the `developer_details` is set to `true`. This is a floating point number.
    - `token_usage` The number of tokens used to generate the final answer. This is returned only when the `developer_details` is set to `true`. This is an integer.

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
This version of the openai-RAG-Backend is going to add Logger handling and more features for the developers (i.e. rate-limit handling in API calls etc.) in it's next versions.
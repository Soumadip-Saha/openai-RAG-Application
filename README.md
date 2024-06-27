# OpenAI RAG Application

This repository provides a full-stack application for document-based question answering using a Retrieval-Augmented Generation (RAG) system. The application consists of a frontend built with Next.js and a backend built with FastAPI, leveraging OpenAI's language models and Elasticsearch for document retrieval.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Setup](#setup)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [Future Features](#future-features)
- [Contributing](#contributing)
- [License](#license)

## Features

### Frontend

- **Multiple Chats**: Users can start and manage multiple chats, each with its own context and history.
- **Real-time Communication**: Communicates with the RAG backend in real-time to provide prompt responses.

### Backend

- **Document Retrieval**: Uses Elasticsearch to connect with the vector database.
- **Custom Wrappers**: Simplifies interactions with OpenAI and Elasticsearch.
- **FastAPI**: Provides a production-ready API for document-based question answering.

## Architecture

The application is composed of two main services:

1. **Backend Service**: Handles document retrieval and interaction with OpenAI's models.
2. **Frontend Service**: Provides a user interface for interacting with the backend.

Both services are orchestrated using Docker Compose.

## Setup

To set up the application, ensure that you have Docker and Docker Compose installed. The following steps will guide you through the process:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/Soumadip-Saha/openai-RAG-Application
   cd openai-RAG-Application
   ```
2. **Configure Environment Variables**:

   Modify the `docker-compose.yml` file to set the environment variables needed for your setup.
3. **Start the Application**:

   ```bash
   docker-compose up -d
   ```

## Usage

### Frontend

To view the frontend application, open your browser and navigate to [http://localhost:3000](http://localhost:3000).

### Backend

The backend service is available at [http://localhost:5400](http://localhost:5400).

## Endpoints

The backend provides the following endpoints:

### `/build_context`

- **Request**:
  - `userId`: The unique ID for each user.
  - `query`: The query asked by the user.
  - `chats`: A list of dictionaries containing the previous question and answers.
- **Response**:
  - `query`, `stand_alone_query`, `docs`, `context`, `userId`, `references`

### `/stream`

- **Request**:
  - `userId`: The unique ID for each user.
  - `context`: The context to generate the answer.
  - `query`: The query to be answered.
- **Response**: SSE (Server-Sent Events) stream.

### `/evaluate_response`

- **Request**:
  - `userId`: The unique ID for each user.
  - `answer`: The answer to be evaluated.
  - `stand_alone_query`: The query used to generate the answer.
- **Response**:
  - `similar_queries`, `response_score`, `userId`

### `/generate_ans`

- **Request**:
  - `userId`: The unique ID for each user.
  - `query`: The query asked by the user.
  - `chats`: A list of dictionaries containing the previous question and answers.
  - `developer_details`: Boolean indicating whether to return developer details.
- **Response**:
  - `answer`, `query`, `references`, `userId`, `stand_alone_query`, `docs`, `confidence_score`, `response_score`, `token_usage`

## Future Features

### Frontend

- **Authentication**: Secure user authentication to manage access and user-specific data.
- **Database Integration**: Persistent storage of chat history and user data for a seamless experience across sessions.
- **Enhanced UI/UX**: Improvements to the user interface and experience based on user feedback.

### Backend

- **Logger Handling**: Improved logging for better traceability and debugging.
- **Rate-Limit Handling**: Managing API call rates to ensure service stability.

## Contributing

We welcome contributions to enhance the functionality and usability of the application. To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

By providing a user-friendly interface and a robust backend, the OpenAI RAG Application aims to facilitate efficient document-based question answering, with a focus on scalability and future enhancements for a better user experience.

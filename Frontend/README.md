# openai-RAG-frontend

## Overview

This repository provides a frontend interface for interacting with the RAG backend. Built with Next.js, this application allows users to start multiple chats, each with its own context, and leverage the capabilities of the RAG backend for document-based question answering.

## Features

-   **Multiple Chats**: Users can start and manage multiple chats, each with its own context and history.
-   **Real-time Communication**: Communicates with the RAG backend in real-time to provide prompt responses.

## How to Use

To set up the frontend, ensure that you have Docker and Docker Compose installed. The frontend is configured to communicate with the backend through environment variables set in the `docker-compose.yml` file.

1. **Clone the Repository**:

    ```bash
    git clone https://github.com/Soumadip-Saha/openai-RAG-Application
    cd Frontend
    ```

2. **Set Up Environment Variables**:

    Modify the `docker-compose.yml` file to set the environment variables needed for your setup:

    ```yaml
    services:
        web:
            # build: .
            ports:
                - 3000:3000
            image: "shadow783/rag-frontend:1.1"
            container_name: "openai-RAG-frontend"
            environment:
                - BACKEND_URL=http://localhost:8000
    ```

The image is already available at [DockerHub](https://hub.docker.com/repository/docker/shadow783/rag-frontend)

3. **Start the Application in background**:

    ```bash
    docker-compose up -d
    ```

4. **Test the Application**:
   View the frontend in your browser: http://localhost:3000

## Chat Interface

The frontend interface provides a simple and intuitive way to start new chats and interact with the backend. Each chat retains its own context, allowing for complex, multi-turn conversations.

### Starting a New Chat

1. Click on the "New Chat" button.
2. Enter your query in the chat input box.
3. View responses from the backend in real-time.

### Managing Chats

-   **Switching Between Chats**: Click on the chat tabs in the side bar to switch between different conversations.
-   **Deleting Chats**: Click on the "Delete" icon next to a chat tab to remove a conversation.
-   **Naming Chats**: Click on the "Edit" icon next to a chat tab to rename a conversation.

## Future Features

The upcoming versions of the rag-frontend will include:

-   **Authentication**: Secure user authentication to manage access and user-specific data.
-   **Database Integration**: Persistent storage of chat history and user data for a seamless experience across sessions.
-   **Enhanced UI/UX**: Improvements to the user interface and experience based on user feedback.

_Note: The current version of the frontend does not include data persistence._

## Contributing

We welcome contributions to enhance the functionality and usability of the rag-frontend. To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

By providing a user-friendly interface for the RAG backend, the openai-RAG-frontend aims to facilitate efficient document-based question answering, with a focus on scalability and future enhancements for a better user experience.

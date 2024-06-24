# Use node image for base image.
FROM node:20-alpine3.19

# Set working directory.
WORKDIR /app

# Copy package files.
COPY package*.json /app/

# Install dependencies.
RUN npm ci

# Copy application files.
COPY . .

# 
COPY .env /app/.env

# Build the application.
RUN npm run build

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
ENTRYPOINT npm start

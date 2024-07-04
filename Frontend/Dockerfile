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

# Give permissions to execute.
RUN chmod +x /app/init.sh

# Build the application.
RUN npm run build

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
ENTRYPOINT ["/bin/sh", "-c", "/app/init.sh /app/.next && npm start"]

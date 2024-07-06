FROM python:3.10.14-alpine3.20

WORKDIR /app
# Install necessary pacakges
RUN apk update && apk add --no-cache build-base

COPY requirements.txt /app/requirements.txt
RUN pip3 install -r /app/requirements.txt

# Copy the application code and configuration files
COPY code /app/code
COPY app.py /app/app.py

# Entrypoint for the docker container
ENTRYPOINT ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5400"]
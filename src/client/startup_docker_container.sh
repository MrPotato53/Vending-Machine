#!/bin/bash

# Build the Docker image
docker build -t vending-machine-frontend .

echo "Docker build complete, now running docker container..."
echo ""

# Run the Docker container, ensuring it starts with the main function
docker run --rm vending-machine-frontend

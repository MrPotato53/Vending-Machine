#!/bin/bash

# Define container name and volume name
CONTAINER_NAME="vending_machine-db1-1"
VOLUME_NAME="vending_machine_vendingmachinedat"
COMPOSE_FILE="docker_compose.yml"
PROJECT_NAME="vending_machine"

# Function to shut down the database
shutdown() {
    echo "Shutting down database..."

    # Stop and remove the running container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "Stopping and removing container: ${CONTAINER_NAME}"
        docker stop "${CONTAINER_NAME}" && docker rm "${CONTAINER_NAME}"
    else
        echo "Container ${CONTAINER_NAME} not found. Skipping removal."
    fi

    # Stop and remove the backend container if it exists
    BACKEND_CONTAINER_NAME="vending_machine-backend-1"
    if docker ps -a --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER_NAME}$"; then
        echo "Stopping container: ${BACKEND_CONTAINER_NAME}"
        docker stop "${BACKEND_CONTAINER_NAME}"
    else
        echo "Container ${BACKEND_CONTAINER_NAME} not found. Skipping removal."
    fi

    # Bring down the docker-compose services and remove associated volumes
    echo "Running docker compose down..."
    docker compose -f "$COMPOSE_FILE" down -v

    # Remove the named volume manually
    if docker volume ls --format '{{.Name}}' | grep -q "^${VOLUME_NAME}$"; then
        echo "Removing volume: ${VOLUME_NAME}"
        docker volume rm "${VOLUME_NAME}"
    else
        echo "Volume ${VOLUME_NAME} not found. Skipping removal."
    fi

    echo "Shutdown complete."
}

# Function to start up the database
startup() {
    echo "Starting up database..."

    # Start docker-compose services
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --build

    echo "Startup complete."
}

# Check script arguments
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 {shutdown|startup}"
    exit 1
fi

# Execute the appropriate function based on the argument
case "$1" in
    shutdown)
        shutdown
        ;;
    startup)
        startup
        ;;
    *)
        echo "Invalid command. Usage: $0 {shutdown|startup}"
        exit 1
        ;;
esac
#!/bin/bash

print_usage() {
    echo ""
    echo "--------------------------------------------------------"
    echo ""
    echo "This script is used for running the frontend CLIs inside"
    echo "of a Docker container. This way, it is not necessary"
    echo "to install many packages (e.g., stripe, requests) onto"
    echo "your development machine."
    echo ""
    echo "To run this script, please use git bash."
    echo "  1. Navigate to this directory (repo/src/client)"
    echo "  2. Enter the following command:"
    echo "       Usage: ./startup_docker_container.sh [vendor|vm]"
    echo ""
    echo "--------------------------------------------------------"
    echo ""
}

# Check if an argument is provided or if the user requests help
if [ -z "$1" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    print_usage
    exit 1
fi

# Determine which script to run
if [ "$1" == "vendor" ]; then
    SCRIPT="vendor_cli.py"
elif [ "$1" == "vm" ]; then
    SCRIPT="vm_cli.py"
else
    echo "Error: Invalid argument '$1'."
    print_usage
    exit 1
fi

# Build the Docker image
docker build -t vending-machine-frontend .

# Provide some output to the user
echo "SCRIPT OUTPUT: Docker container build successfully."
echo "SCRIPT OUTPUT: Now running $SCRIPT inside the container..."
echo ""

# Run the Docker container with the selected script
# docker run --rm -it vending-machine-frontend python "$SCRIPT"
# To work correctly in git bash, we have to use this command

# Detect OS
OS="$(uname -s)"

if [[ "$OS" == "MINGW"* || "$OS" == "MSYS"* || "$OS" == "CYGWIN"* ]]; then
    # Windows (Git Bash)
    winpty docker run --network=host --rm -it vending-machine-frontend python "$SCRIPT"
else
    # macOS / Linux
    docker run --network=host --rm -it vending-machine-frontend python "$SCRIPT"
fi

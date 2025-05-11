#!/usr/bin/env bash

print_usage() {
    echo ""
    echo "--------------------------------------------------------"
    echo ""
    echo "This script is used for running the frontend CLIs inside"
    echo "of a Docker container. This way, it is not necessary"
    echo "to install many packages (e.g., stripe, requests) onto"
    echo "your development machine."
    echo ""
    echo "Usage: ./startup_docker_container.sh [vendor|vm]"
    echo ""
    echo "--------------------------------------------------------"
    echo ""
}

# Check if an argument is provided or if the user requests help
if [ -z "$1" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    print_usage
    exit 1
fi

# Determine which script to run
if [ "$1" = "vendor" ]; then
    SCRIPT="vendor_cli.py"
elif [ "$1" = "vm" ]; then
    SCRIPT="vm_cli.py"
else
    echo "Error: Invalid argument '$1'."
    print_usage
    exit 1
fi

# Build the Docker image
echo "Building Docker image 'vending-machine-frontend'..."
docker build -t vending-machine-frontend .

if [ $? -ne 0 ]; then
    echo "Docker build failed. Exiting."
    exit 1
fi

echo ""
echo "SCRIPT OUTPUT: Docker container built successfully."
echo "SCRIPT OUTPUT: Now running $SCRIPT inside the container..."
echo ""

# Detect OS
OS="$(uname -s)"

if [ "$OS" = "Linux" ] || [ "$OS" = "Darwin" ]; then
    # Linux (including Raspberry Pi OS) and macOS
    docker run \
      --network host \
      --cap-add NET_ADMIN \
      --cap-add SYS_MODULE \
      --device /dev/net/tun \
      --rm -it vending-machine-frontend \
      python "$SCRIPT"

elif [[ "$OS" == MINGW* || "$OS" == MSYS* || "$OS" == CYGWIN* ]]; then
    # Windows (Git Bash)
    echo "Generating Wi-Fi AP list for Windows via Python…"
    python ./generate_wifi_aps.py

    # Ensure the JSON file exists
    if [ ! -f customer/wifi_aps.json ]; then
        echo "ERROR: customer/wifi_aps.json not found after generation!"
        exit 1
    fi

    # Convert to Windows-style path for Docker
    HOST_WIFI_JSON="$(pwd -W | sed 's|/|\\\\|g')\\customer\\wifi_aps.json"
    echo "Mounting host file (Windows path): $HOST_WIFI_JSON"

    # Pause before launching
    echo "Pausing for 3 seconds..."
    sleep 3

    # Run container, mounting the JSON
    if command -v winpty >/dev/null 2>&1; then
        winpty docker run --rm -it \
          -v "$HOST_WIFI_JSON:/app/wifi_aps.json:ro" \
          vending-machine-frontend \
          python "$SCRIPT"
    else
        echo "Warning: winpty not found. Running without it..."
        docker run --rm -it \
          -v "$HOST_WIFI_JSON:/app/wifi_aps.json:ro" \
          vending-machine-frontend \
          python "$SCRIPT"
    fi

else
    echo "Unsupported OS: $OS"
    exit 1
fi

# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory to /app (or whatever your project directory is)
WORKDIR /app

# Copy the current directory contents into the container at /app
# This copies everything from the current directory (client) to /app inside the container
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Set the entry point for the container to start the main.py file
ENTRYPOINT ["python", "main.py"]

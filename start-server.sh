#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")"

# Start the Python HTTP server in the foreground
python3 -m http.server 8000

#!/bin/bash

# Find and kill the Python server process
pkill -f "http.server" || true

# Wait a moment to ensure the process is fully terminated
sleep 1

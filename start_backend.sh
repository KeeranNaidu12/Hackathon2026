#!/bin/bash
# Start the backend server
cd "$(dirname "$0")/backend"
exec uvicorn main:app --reload --port 8000

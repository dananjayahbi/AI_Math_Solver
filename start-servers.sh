#!/bin/bash
# Start the frontend and backend servers

# Set up error handling
set -e

# Start the backend server
echo "Starting backend server..."
cd "e:\My_GitHub_Repos\AI_Math_Solver\backend"
python main.py &
BACKEND_PID=$!

# Wait a moment for the backend to initialize
sleep 2

# Start the frontend server
echo "Starting frontend server..."
cd "e:\My_GitHub_Repos\AI_Math_Solver\frontend"
npm run dev &
FRONTEND_PID=$!

# Function to handle cleanup when script is interrupted
cleanup() {
  echo "Stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID
  exit
}

# Set trap to catch interrupts
trap cleanup INT TERM

echo "Both servers are running. Press Ctrl+C to stop."
wait

#!/bin/bash

# Script to run tests with server running
# This starts the server in the background, runs tests, then shuts down

echo "🚀 Starting backend server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to be ready..."
sleep 3

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Server failed to start"
    exit 1
fi

echo "✅ Server is running (PID: $SERVER_PID)"
echo "🧪 Running tests..."
echo ""

# Run tests
npm test

# Capture test exit code
TEST_EXIT_CODE=$?

# Shut down server
echo ""
echo "🛑 Shutting down server..."
kill $SERVER_PID 2>/dev/null

# Wait for server to stop
wait $SERVER_PID 2>/dev/null

echo "✅ Server stopped"

# Exit with test exit code
exit $TEST_EXIT_CODE

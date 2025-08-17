#!/bin/bash

echo "🚀 Starting Video Player Project..."
echo "=================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Try to start the project without authentication
echo "🌐 Starting Expo development server..."
echo "Press 'w' to open in web browser"
echo "Press 'a' to open in Android"
echo "Press 'i' to open in iOS simulator"
echo "Press 'q' to quit"
echo ""

# Start with offline mode to avoid authentication
EXPO_NO_AUTH=1 npx expo start --offline 
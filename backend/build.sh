#!/bin/bash

# Build script for Render
# This script builds the backend TypeScript to JavaScript

echo "🔨 Building Backend..."
cd backend
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Backend build successful!"
else
    echo "❌ Backend build failed!"
    exit 1
fi

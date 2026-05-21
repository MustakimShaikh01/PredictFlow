#!/bin/bash

# Build script for Render Frontend
# Builds React app with Vite

echo "🔨 Building Frontend..."
cd frontend
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

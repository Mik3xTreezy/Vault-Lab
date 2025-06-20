#!/bin/bash

# Production startup script for Link-Locker
echo "🚀 Starting Link-Locker in production mode..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "❌ Error: .env.local file not found!"
  echo "Please copy env.example to .env.local and fill in your values."
  exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  echo "🌟 Starting production server..."
  npm run start
else
  echo "❌ Build failed!"
  exit 1
fi 
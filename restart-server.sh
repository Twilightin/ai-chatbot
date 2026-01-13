#!/bin/bash

# PDF Upload Fix - Server Restart Script
# This script stops and restarts the dev server to apply the PDF parsing fix

echo "🔄 Restarting dev server to apply PDF upload fix..."
echo ""

# Find and kill the Next.js dev server process
echo "Stopping current dev server..."
pkill -f "next dev" 2>/dev/null

# Wait a moment for the process to stop
sleep 2

# Check if port 3000 is free
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "⚠️  Port 3000 still in use, forcing kill..."
    kill -9 $(lsof -ti:3000) 2>/dev/null
    sleep 1
fi

echo "✅ Old server stopped"
echo ""
echo "Starting new dev server with PDF fix..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the dev server
pnpm dev

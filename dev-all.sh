#!/bin/bash

# Development script for all Umaxica domains

echo "🚀 Starting all Umaxica domains in development mode..."
echo ""

# Function to start a domain in background
start_domain() {
    local domain=$1
    local port=$2
    echo "🌐 Starting $domain domain on port $port..."
    cd $domain
    bun run dev > "../logs/${domain}.log" 2>&1 &
    local pid=$!
    echo "$pid" > "../pids/${domain}.pid"
    echo "   → PID: $pid, URL: http://localhost:$port"
    cd ..
}

# Create directories for logs and PIDs
mkdir -p logs pids

# Start all domains
start_domain "com" "4001"
start_domain "app" "4002"
start_domain "org" "4003"

echo ""
echo "✅ All domains started successfully!"
echo ""
echo "📊 Access your applications:"
echo "   🏢 Com:  http://localhost:4001"
echo "   📱 App:  http://localhost:4002"
echo "   🏛️  Org:  http://localhost:4003"
echo ""
echo "📝 Logs are saved in the 'logs/' directory"
echo "🔧 To stop all servers, run: ./stop-all.sh"
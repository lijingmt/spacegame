#!/bin/bash

echo "🚀 Deploying Space Game..."

# 停止并删除旧容器
docker stop spacegame 2>/dev/null
docker rm spacegame 2>/dev/null

# 构建新镜像
echo "📦 Building Docker image..."
docker build -t spacegame .

# 启动新容器
echo "🚀 Starting container..."
docker run -d --name spacegame -p 23456:80 spacegame

echo "✅ Done! Access at http://192.168.1.203:23456/"

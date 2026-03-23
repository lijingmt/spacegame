#!/bin/bash

# 切换到脚本所在目录
cd "$(dirname "$0")"

echo "🚀 Deploying Space Game Collection..."

# 创建数据目录
mkdir -p ./data/leaderboard

# 停止并删除旧容器
docker stop spacegame 2>/dev/null
docker rm spacegame 2>/dev/null

# 构建新镜像
echo "📦 Building Docker image..."
docker build -t spacegame .

# 启动新容器（挂载数据目录）
echo "🚀 Starting container..."
docker run -d --name spacegame \
    -p 23456:80 \
    -v "$(pwd)/data/leaderboard:/data/leaderboard" \
    spacegame

echo "✅ Done! Access at http://192.168.1.203:23456/"
echo "📁 Game data stored in: $(pwd)/data/leaderboard/"
echo ""
echo "📮 Available games:"
for dir in games/*/; do
    if [ -d "$dir" ]; then
        game_name=$(basename "$dir")
        echo "   - /games/$game_name"
    fi
done

FROM node:18-alpine

# 安装 express
WORKDIR /app
COPY package.json .
RUN npm install --production

# 复制服务器代码
COPY server.js .

# 复制主页
COPY index.html .

# 复制游戏目录
COPY games/ ./games/

# 创建数据目录
RUN mkdir -p /data

EXPOSE 80

CMD ["node", "server.js"]

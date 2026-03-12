FROM node:18-alpine

# 安装 express
WORKDIR /app
COPY package.json .
RUN npm install --production

# 复制服务器代码
COPY server.js .

# 创建 public 目录并复制游戏文件
RUN mkdir -p public
COPY index.html public/

# 创建数据目录
RUN mkdir -p /data

EXPOSE 80

CMD ["node", "server.js"]

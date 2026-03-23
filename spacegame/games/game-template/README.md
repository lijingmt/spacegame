# 新游戏模板

## 如何添加新游戏

1. 复制整个 `game-template` 文件夹到 `games/` 目录下，重命名为你的游戏 ID（使用小写字母和连字符，例如 `space-shooter`）

2. 修改 `index.html` 中的 `GAME_ID` 变量：
   ```javascript
   const GAME_ID = 'your-game-id';  // 改成你的游戏 ID
   ```

3. 开发你的游戏！你可以：
   - 使用原生 JavaScript（像 Gravity Runner）
   - 使用 React、Vue、Angular 等框架
   - 使用 Phaser、Three.js 等游戏引擎
   - 任何你想要的技术栈！

4. 每个游戏都有独立的：
   - `index.html` - 游戏入口
   - 排行榜数据文件（自动创建：`/data/leaderboard/{game-id}.json`）
   - 静态资源（可选）

## API 接口

所有游戏都可以使用以下 API：

### 获取排行榜
```
GET /api/leaderboard/{gameId}
```

### 更新排行榜
```
POST /api/leaderboard/{gameId}
Body: { "name": "PlayerName", "score": 1234 }
```

### 获取玩家最高分
```
GET /api/leaderboard/{gameId}/{playerName}
```

## 在主菜单添加你的游戏

编辑根目录的 `index.html`，在 `games` 数组中添加你的游戏信息：

```javascript
{
    id: 'your-game-id',
    title: 'Your Game Title',
    titleZh: '你的游戏标题',
    description: 'Game description...',
    descriptionZh: '游戏描述...',
    genre: 'Genre',
    genreZh: '类型',
    icon: '🎮',
    color: '#00ffff'
}
```

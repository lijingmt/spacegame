const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 80;
const DATA_DIR = '/data/leaderboard';

// 静态文件服务
app.use(express.static('public'));
app.use(express.json());

// 确保数据目录存在
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

// 获取游戏的数据文件路径
function getGameDataFile(gameId) {
    return path.join(DATA_DIR, `${gameId}.json`);
}

// 确保游戏数据文件存在
function ensureGameDataFile(gameId) {
    ensureDataDir();
    const dataFile = getGameDataFile(gameId);
    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, JSON.stringify([]));
    }
    return dataFile;
}

// 获取特定游戏的排行榜
app.get('/api/leaderboard/:gameId', (req, res) => {
    try {
        const gameId = req.params.gameId;
        // 验证游戏ID，只允许字母数字和连字符
        if (!/^[a-z0-9-]+$/.test(gameId)) {
            return res.status(400).json({ error: 'Invalid game ID' });
        }

        const dataFile = ensureGameDataFile(gameId);
        const data = fs.readFileSync(dataFile, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading leaderboard:', error);
        res.json([]);
    }
});

// 更新特定游戏的排行榜
app.post('/api/leaderboard/:gameId', (req, res) => {
    try {
        const gameId = req.params.gameId;
        // 验证游戏ID
        if (!/^[a-z0-9-]+$/.test(gameId)) {
            return res.status(400).json({ error: 'Invalid game ID' });
        }

        const dataFile = ensureGameDataFile(gameId);
        let leaderboard = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

        const { name, score } = req.body;

        // 查找是否已存在该玩家
        const existingIndex = leaderboard.findIndex(entry => entry.name === name);

        if (existingIndex !== -1) {
            // 更新现有玩家的最高分
            if (score > leaderboard[existingIndex].score) {
                leaderboard[existingIndex].score = score;
                leaderboard[existingIndex].date = new Date().toISOString();
            }
        } else {
            // 添加新玩家
            leaderboard.push({
                name: name,
                score: score,
                date: new Date().toISOString()
            });
        }

        // 按分数排序
        leaderboard.sort((a, b) => b.score - a.score);

        // 只保留前50名
        leaderboard = leaderboard.slice(0, 50);

        // 保存到文件
        fs.writeFileSync(dataFile, JSON.stringify(leaderboard, null, 2));

        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('Error updating leaderboard:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 获取特定游戏的玩家最高分
app.get('/api/highscore/:gameId/:name', (req, res) => {
    try {
        const gameId = req.params.gameId;
        // 验证游戏ID
        if (!/^[a-z0-9-]+$/.test(gameId)) {
            return res.status(400).json({ error: 'Invalid game ID' });
        }

        const dataFile = ensureGameDataFile(gameId);
        const leaderboard = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        const player = leaderboard.find(entry => entry.name === req.params.name);
        res.json({ score: player ? player.score : 0 });
    } catch (error) {
        console.error('Error getting high score:', error);
        res.json({ score: 0 });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 获取所有游戏的合并排行榜（总榜）
app.get('/api/leaderboard/global', (req, res) => {
    try {
        const gameIds = ['gravity-runner', 'bubble-trouble'];
        const globalLeaderboard = [];

        // 读取所有游戏的排行榜数据
        for (const gameId of gameIds) {
            const dataFile = getGameDataFile(gameId);
            if (fs.existsSync(dataFile)) {
                const gameLeaderboard = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

                // 将每个游戏的分数添加到总榜
                for (const entry of gameLeaderboard) {
                    const existingEntry = globalLeaderboard.find(e => e.name === entry.name);

                    if (existingEntry) {
                        // 如果玩家已存在，累加分数
                        existingEntry.score += entry.score;
                    } else {
                        // 新玩家，添加到总榜
                        globalLeaderboard.push({
                            name: entry.name,
                            score: entry.score,
                            date: entry.date
                        });
                    }
                }
            }
        }

        // 按总分排序
        globalLeaderboard.sort((a, b) => b.score - a.score);

        // 只保留前50名
        res.json(globalLeaderboard.slice(0, 50));
    } catch (error) {
        console.error('Error reading global leaderboard:', error);
        res.json([]);
    }
});

// Serve static files from games directory
app.use('/games', express.static('games'));

// 主页重定向到游戏合集
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Space Game Collection server running on port ${PORT}`);
    console.log(`Data directory: ${DATA_DIR}`);
});

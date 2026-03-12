const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 80;
const DATA_FILE = '/data/leaderboard.json';

// 静态文件服务
app.use(express.static('public'));
app.use(express.json());

// 确保数据文件存在
function ensureDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
}

// 获取排行榜
app.get('/api/leaderboard', (req, res) => {
    try {
        ensureDataFile();
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading leaderboard:', error);
        res.json([]);
    }
});

// 更新排行榜
app.post('/api/leaderboard', (req, res) => {
    try {
        ensureDataFile();
        let leaderboard = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

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
        fs.writeFileSync(DATA_FILE, JSON.stringify(leaderboard, null, 2));

        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('Error updating leaderboard:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 获取玩家最高分
app.get('/api/highscore/:name', (req, res) => {
    try {
        ensureDataFile();
        const leaderboard = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
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

app.listen(PORT, () => {
    console.log(`Space Game server running on port ${PORT}`);
    console.log(`Data file: ${DATA_FILE}`);
});

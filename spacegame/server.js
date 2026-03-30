const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 80;
const DATA_DIR = '/data/leaderboard';
const STATS_DIR = '/data/stats';

// 机器人 User-Agent 检测
const BOT_PATTERNS = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
    /baiduspider/i, /yandexbot/i, /facebookexternalhit/i,
    /twitterbot/i, /linkedinbot/i, /whatsapp/i,
    /applebot/i, /semrushbot/i, /ahrefsbot/i,
    /mj12bot/i, /dotbot/i, /crawler/i,
    /python-requests/i, /curl/i, /wget/i,
    /go-http-client/i, /java/i, /node-fetch/i,
    /axios/i, /http-client/i, /httpie/i,
    /postman/i, /insomnia/i, /zap/i,
    /metasploit/i, /nikto/i, /nmap/i,
    /gobuster/i, /dirb/i, /wfuzz/i,
    /^$/, /undefined/i
];

// 检查是否为机器人或本地访问
function isBotOrLocal(req) {
    const ua = req.headers['user-agent'] || '';

    // 检查 User-Agent
    for (const pattern of BOT_PATTERNS) {
        if (pattern.test(ua)) {
            return true;
        }
    }

    // 检查本地访问
    const ip = req.ip || req.connection.remoteAddress || '';
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
        return true;
    }

    // 检查 X-Forwarded-For
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const forwardedIps = forwarded.split(',').map(ip => ip.trim());
        for (const forwardedIp of forwardedIps) {
            if (forwardedIp === '::1' || forwardedIp === '127.0.0.1' || forwardedIp.startsWith('192.168.') || forwardedIp.startsWith('10.') || forwardedIp.startsWith('172.16.')) {
                return true;
            }
        }
    }

    return false;
}

// 获取客户端 IP
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.ip ||
           req.connection.remoteAddress ||
           'unknown';
}

// 从 User-Agent 解析浏览器和操作系统
function parseUserAgent(ua) {
    ua = ua || '';

    let browser = 'Other';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    else if (ua.includes('SamsungBrowser')) browser = 'Samsung';

    let os = 'Other';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    let device = 'Desktop';
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
        device = 'Mobile';
    } else if (ua.includes('Tablet') || ua.includes('iPad')) {
        device = 'Tablet';
    }

    return { browser, os, device };
}

// IP 地理位置查询（简化版）
function getGeoFromIp(ip) {
    // 这里可以集成 geoip 库，暂时返回默认值
    return { country: 'Unknown', city: 'Unknown' };
}

// 静态文件服务
app.use(express.json());
app.use(express.static('public'));

// 中间件: 自动记录页面访问 (在静态文件之后，路由之前)
app.use((req, res, next) => {
    // 只记录 HTML 页面访问，排除 API 请求和静态资源
    if (req.path.endsWith('.html') || req.path === '/') {
        // 异步记录，不阻塞请求
        setImmediate(() => {
            recordVisit(req, req.path);
        });
    }
    next();
});

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

// 获取所有游戏的合并排行榜（总榜）- 必须放在 :gameId 路由之前
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

// 获取特定游戏的排行榜
app.get('/api/leaderboard/:gameId', (req, res) => {
    try {
        const gameId = req.params.gameId;
        // 排除 global 路由
        if (gameId === 'global') {
            return res.redirect('/api/leaderboard/global');
        }
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

// Serve static files from games directory
app.use('/games', express.static('games'));

// 主页重定向到游戏合集
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============ 访客统计功能 ============

// 确保统计目录存在
function ensureStatsDir() {
    if (!fs.existsSync(STATS_DIR)) {
        fs.mkdirSync(STATS_DIR, { recursive: true });
    }
    return STATS_DIR;
}

// 获取统计文件路径
function getStatsFile() {
    ensureStatsDir();
    return path.join(STATS_DIR, 'visits.json');
}

// 读取统计数据
function readStats() {
    const statsFile = getStatsFile();
    if (!fs.existsSync(statsFile)) {
        const defaultStats = {
            total_visits: 0,
            unique_visitors: {},
            page_views: {},
            daily_stats: {},
            hourly_stats: {},
            browser_stats: {},
            os_stats: {},
            device_stats: {},
            country_stats: {},
            city_stats: {},
            recent_visits: []
        };
        fs.writeFileSync(statsFile, JSON.stringify(defaultStats, null, 2));
        return defaultStats;
    }
    return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
}

// 保存统计数据
function saveStats(stats) {
    const statsFile = getStatsFile();
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
}

// 获取今天的日期字符串
function getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// 获取当前小时
function getCurrentHour() {
    return new Date().getHours();
}

// 记录访问 (内部使用，排除机器人)
function recordVisit(req, page) {
    if (isBotOrLocal(req)) {
        return;
    }

    const stats = readStats();
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] || '';
    const { browser, os, device } = parseUserAgent(ua);
    const geo = getGeoFromIp(ip);
    const today = getTodayString();
    const hour = getCurrentHour();

    // 总访问量
    stats.total_visits++;

    // 独立访客
    if (!stats.unique_visitors[ip]) {
        stats.unique_visitors[ip] = {
            first_visit: new Date().toISOString(),
            last_visit: new Date().toISOString(),
            visits_count: 0
        };
    }
    stats.unique_visitors[ip].last_visit = new Date().toISOString();
    stats.unique_visitors[ip].visits_count++;

    // 页面访问
    if (!stats.page_views[page]) {
        stats.page_views[page] = 0;
    }
    stats.page_views[page]++;

    // 每日统计
    if (!stats.daily_stats[today]) {
        stats.daily_stats[today] = 0;
    }
    stats.daily_stats[today]++;

    // 每小时统计
    if (!stats.hourly_stats[hour]) {
        stats.hourly_stats[hour] = 0;
    }
    stats.hourly_stats[hour]++;

    // 浏览器统计
    if (!stats.browser_stats[browser]) {
        stats.browser_stats[browser] = 0;
    }
    stats.browser_stats[browser]++;

    // 操作系统统计
    if (!stats.os_stats[os]) {
        stats.os_stats[os] = 0;
    }
    stats.os_stats[os]++;

    // 设备统计
    if (!stats.device_stats[device]) {
        stats.device_stats[device] = 0;
    }
    stats.device_stats[device]++;

    // 国家统计
    if (!stats.country_stats[geo.country]) {
        stats.country_stats[geo.country] = 0;
    }
    stats.country_stats[geo.country]++;

    // 城市统计
    if (!stats.city_stats[geo.city]) {
        stats.city_stats[geo.city] = 0;
    }
    stats.city_stats[geo.city]++;

    // 最近访问 (保留最近100条)
    stats.recent_visits.push({
        ip: ip.substring(0, 20) + '...',
        country: geo.country,
        city: geo.city,
        browser,
        os,
        device,
        page,
        timestamp: new Date().toISOString()
    });
    if (stats.recent_visits.length > 100) {
        stats.recent_visits.shift();
    }

    saveStats(stats);
}

// 访问记录 API - 供前端调用
app.post('/api/stats/visit', (req, res) => {
    try {
        const { page = '/' } = req.body;
        recordVisit(req, page);
        res.json({ success: true });
    } catch (error) {
        console.error('Error recording visit:', error);
        res.json({ success: true }); // 静默失败
    }
});

// 统计数据 API - 获取统计信息 (需要密码)
const STATS_PASSWORD = process.env.STATS_PASSWORD || 'stats2024';

app.get('/api/admin/stats', (req, res) => {
    try {
        const password = req.query.password;

        if (password !== STATS_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const stats = readStats();
        const today = getTodayString();

        // 计算今日访问量
        const todayVisits = stats.daily_stats[today] || 0;

        // 计算独立访客数
        const uniqueVisitors = Object.keys(stats.unique_visitors).length;

        res.json({
            total_visits: stats.total_visits,
            unique_visitors: uniqueVisitors,
            today_visits: todayVisits,
            page_views: stats.page_views,
            daily_stats: Object.entries(stats.daily_stats).map(([date, count]) => ({ date, count })).slice(-30),
            hourly_stats: stats.hourly_stats,
            browser_stats: stats.browser_stats,
            os_stats: stats.os_stats,
            device_stats: stats.device_stats,
            country_stats: stats.country_stats,
            city_stats: stats.city_stats,
            recent_visits: stats.recent_visits.slice(-20)
        });
    } catch (error) {
        console.error('Error reading stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Space Game Collection server running on port ${PORT}`);
    console.log(`Data directory: ${DATA_DIR}`);
    console.log(`Stats directory: ${STATS_DIR}`);
});

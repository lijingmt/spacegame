# Space Game Collection

A collection of space-themed games, each showcasing different technologies and frameworks.

## Project Structure

```
spacegame/
├── index.html              # Main game collection menu
├── server.js               # Express backend with multi-game API
├── deploy.sh               # Docker deployment script
├── Dockerfile              # Docker configuration
├── package.json            # Node.js dependencies
├── games/                  # Individual games
│   ├── gravity-runner/     # Game 1: Pixel art runner
│   └── game-template/      # Template for new games
├── public/                 # Optional shared assets
│   ├── css/
│   ├── js/
│   └── assets/
└── data/                   # Persistent data (Docker volume)
    └── leaderboard/        # Per-game leaderboard files
        ├── gravity-runner.json
        └── ...
```

## Adding a New Game

1. **Copy the template:**
   ```bash
   cp -r games/game-template games/your-new-game
   ```

2. **Update GAME_ID in the new game's `index.html`:**
   ```javascript
   const GAME_ID = 'your-new-game';
   ```

3. **Add your game to the main menu** (`index.html`):
   ```javascript
   const games = [
       {
           id: 'your-new-game',
           title: 'Your Game',
           titleZh: '你的游戏',
           description: '...',
           descriptionZh: '...',
           genre: 'Action',
           genreZh: '动作',
           icon: '🎮',
           color: '#ff00ff'
       }
   ];
   ```

4. **Develop your game!**
   - Use any tech stack: vanilla JS, React, Vue, Phaser, etc.
   - Each game is completely self-contained
   - Shared API for leaderboards

## API Endpoints

Each game gets its own leaderboard:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leaderboard/:gameId` | GET | Get top 50 scores |
| `/api/leaderboard/:gameId` | POST | Submit score |
| `/api/highscore/:gameId/:name` | GET | Get player's best score |

## Deployment

```bash
./deploy.sh
```

Access at: `http://192.168.1.203:23456/`

## Games

| Game | Technology | Status |
|------|------------|--------|
| Gravity Runner | Vanilla JS + Canvas | ✅ Complete |
| *Your Game Here* | *Your Choice* | 🚧 WIP |

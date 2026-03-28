/** Leaderboard API configuration */
const API_BASE = window.location.origin;
const GAME_ID = 'bubble-trouble';

export interface LeaderboardEntry {
    name: string;
    score: number;
    date?: string;
}

export interface LeaderboardResponse {
    success: boolean;
    leaderboard?: LeaderboardEntry[];
    error?: string;
}

/**
 * Leaderboard API service for submitting and retrieving scores
 */
export const leaderboard = {
    /**
     * Submit a score to the leaderboard
     */
    async submitScore(name: string, score: number): Promise<LeaderboardResponse> {
        try {
            const response = await fetch(`${API_BASE}/api/leaderboard/${GAME_ID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, score }),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error submitting score:', error);
            return { success: false, error: 'Failed to submit score' };
        }
    },

    /**
     * Get the leaderboard
     */
    async getLeaderboard(): Promise<LeaderboardEntry[]> {
        try {
            const response = await fetch(`${API_BASE}/api/leaderboard/${GAME_ID}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    },

    /**
     * Get the global leaderboard (all games combined)
     */
    async getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
        try {
            const response = await fetch(`${API_BASE}/api/leaderboard/global`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching global leaderboard:', error);
            return [];
        }
    },

    /**
     * Get high score for a specific player
     */
    async getHighScore(name: string): Promise<number> {
        try {
            const response = await fetch(`${API_BASE}/api/highscore/${GAME_ID}/${encodeURIComponent(name)}`);
            const data = await response.json();
            return data.score || 0;
        } catch (error) {
            console.error('Error fetching high score:', error);
            return 0;
        }
    },
};

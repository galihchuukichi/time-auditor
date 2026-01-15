export interface Activity {
    id: string;
    name: string;
    type: 'reward' | 'punishment';
    points: number;
    isVisible: boolean;
}

export interface ShopItem {
    id: string;
    name: string;
    image: string;
    price: number;
}

export interface TimelineEntry {
    id: string;
    type: 'planning' | 'auditing';
    timeSlot: string; // e.g., "00:00-03:00"
    description: string;
    date: string; // ISO date string (YYYY-MM-DD)
}

export interface LogEntry {
    id: string;
    message: string;
    timestamp: string; // ISO string
    type: 'activity' | 'purchase' | 'timeline_add' | 'timeline_remove' | 'casino' | 'other';
    pointsChange?: number;
}

export interface CasinoReward {
    id: string;
    name: string;
    image: string;
    minRoll: number; // Minimum dice roll to win this reward (2-12 for two dice)
    cost: number; // Points cost to roll for this reward
    description?: string;
}

export interface CasinoGameHistory {
    id: string;
    game: 'dice';
    dice1: number;
    dice2: number;
    total: number;
    cost: number;
    won: boolean;
    rewardId?: string;
    rewardName?: string;
    timestamp: string;
}

// Point values for timeline entries
export const PLANNING_POINTS = 0.15;
export const AUDITING_POINTS = 0.4;

export interface AppData {
    activities: Activity[];
    shopItems: ShopItem[];
    currentPoints: number;
    purchaseHistory: { itemId: string; itemName: string; price: number; date: string }[];
    timelineEntries: TimelineEntry[];
    logs: LogEntry[];
    casinoRewards: CasinoReward[];
    casinoHistory: CasinoGameHistory[];
}

const STORAGE_KEY = 'time-auditor-data';

const defaultData: AppData = {
    activities: [
        { id: '1', name: 'Completed 1 hour of deep work', type: 'reward', points: 10, isVisible: true },
        { id: '2', name: 'Exercised for 30 minutes', type: 'reward', points: 15, isVisible: true },
        { id: '3', name: 'Skipped a workout', type: 'punishment', points: -10, isVisible: true },
        { id: '4', name: 'Wasted time on social media', type: 'punishment', points: -5, isVisible: true },
    ],
    shopItems: [
        { id: '1', name: 'Roasted Peanut', image: '🥜', price: 0.05 },
        { id: '2', name: 'Sausage', image: '🌭', price: 1 },
        { id: '3', name: 'Yogurt', image: '🥛', price: 5 },
        { id: '4', name: 'Fishdumpling Cheese', image: '🧀', price: 3 },
    ],
    currentPoints: 0,
    purchaseHistory: [],
    timelineEntries: [],
    logs: [],
    casinoRewards: [
        { id: '1', name: 'Jackpot!', image: '💎', minRoll: 12, cost: 1, description: 'Roll double 6 to win!' },
        { id: '2', name: 'Lucky Prize', image: '🍀', minRoll: 10, cost: 0.5, description: 'Roll 10+ to win' },
        { id: '3', name: 'Small Treat', image: '🎁', minRoll: 8, cost: 0.25, description: 'Roll 8+ to win' },
    ],
    casinoHistory: [],
};

export function loadData(): AppData {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...defaultData, ...parsed };
        }
    } catch (e) {
        console.error('Failed to load data:', e);
    }
    return defaultData;
}

export function saveData(data: AppData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save data:', e);
    }
}

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

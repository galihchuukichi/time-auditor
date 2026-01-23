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
    type: 'activity' | 'purchase' | 'timeline_add' | 'timeline_remove' | 'casino' | 'trade_up' | 'other';
    pointsChange?: number;
}

export interface CasinoReward {
    id: string;
    name: string;
    image: string;
    tier: 1 | 2 | 3 | 4; // 1=Legendary, 2=Rare, 3=Uncommon, 4=Common
    minRoll: number; // Kept for backward compatibility or if we switch modes, but Gacha uses probabilities
    cost: number; // Kept but Gacha has fixed cost
    description?: string;
}

export interface CasinoGameHistory {
    id: string;
    game: 'dice' | 'gacha';
    dice1?: number; // Optional now
    dice2?: number; // Optional now
    total?: number; // Optional now
    cost: number;
    won: boolean;
    rewardId?: string;
    rewardName?: string;
    timestamp: string;
}

export interface InventoryItem {
    id: string; // Unique instance ID
    rewardId: string; // ID of the reward definition
    name: string;
    image: string;
    tier: number;
    acquiredAt: string;
}

// Point values for timeline entries
export const PLANNING_POINTS = 3;
export const AUDITING_POINTS = 8;
export const GACHA_COST = 1000;

export interface AppData {
    activities: Activity[];
    shopItems: ShopItem[];
    currentPoints: number;
    purchaseHistory: { itemId: string; itemName: string; price: number; date: string }[];
    timelineEntries: TimelineEntry[];
    logs: LogEntry[];
    casinoRewards: CasinoReward[];
    casinoHistory: CasinoGameHistory[];
    inventory: InventoryItem[];
    lastDailyRefresh?: string; // Optional for backward compatibility
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
        { id: '1', name: 'Jackpot!', image: '💎', tier: 1, minRoll: 12, cost: 1, description: 'Legendary Prize' },
        { id: '2', name: 'Lucky Prize', image: '🍀', tier: 2, minRoll: 10, cost: 0.5, description: 'Rare Prize' },
        { id: '3', name: 'Small Treat', image: '🎁', tier: 3, minRoll: 8, cost: 0.25, description: 'Uncommon Prize' },
        { id: '4', name: 'Consolation', image: '🍬', tier: 4, minRoll: 6, cost: 0.1, description: 'Common Prize' },
    ],
    casinoHistory: [],
    inventory: [],
    lastDailyRefresh: '',
};

export function loadData(): AppData {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Ensure inventory exists for old data
            const loadedData = { ...defaultData, ...parsed };
            if (!loadedData.inventory) {
                loadedData.inventory = [];
            }
            // Ensure currentPoints is a valid number
            if (typeof loadedData.currentPoints !== 'number' || isNaN(loadedData.currentPoints)) {
                loadedData.currentPoints = 0;
            }
            return loadedData;
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
    // Generate a valid UUID for Supabase compatibility
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers - generate UUID v4 format
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const TIER_1_AURAS: Record<string, string> = {
    "Lorenzo de' Medici": "bg-gradient-to-br from-purple-900 via-black to-purple-900",
    "Nathan Mayer Rothschild": "bg-gradient-to-br from-purple-900 via-black to-purple-900",
    "Jacob Fugger": "bg-gradient-to-br from-purple-900 via-black to-purple-900",
    "Deddy Corbuzier": "bg-gradient-to-br from-blue-900 via-blue-950 to-white",
    "Timothy Ronald": "bg-gradient-to-br from-purple-900 via-black to-purple-900",
    "Bennix": "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600",
    "Andrew Susanto": "bg-gradient-to-br from-white via-gray-100 to-gray-200",
    "Donald Trump": "bg-gradient-to-br from-red-600 via-white to-blue-600",
    "Putin": "bg-gradient-to-br from-red-900 via-red-950 to-black",
    "Lee Kuan Yew": "bg-gradient-to-br from-white via-gray-400 to-black",
    "习近平": "bg-gradient-to-br from-red-600 via-red-500 to-red-700",
    "L": "bg-gradient-to-br from-black via-gray-500 to-white",
    "Nezu Chuukichi": "bg-gradient-to-br from-cyan-500 via-blue-500 to-[#995e5d]",
    "Thick Face Black Heart": "bg-gradient-to-br from-black via-gray-900 to-gray-600",
    "Saitama": "bg-gradient-to-br from-black via-red-900 to-red-600",
    "Tatsumaki": "bg-gradient-to-br from-black via-green-900 to-green-500",
    "Kiyotaka Ayanokōji": "bg-gradient-to-br from-red-600 via-orange-500 to-orange-400",
    "Tommy Shelby": "bg-gradient-to-br from-black via-gray-800 to-gray-600",
    "Qin Feng": "bg-gradient-to-br from-white via-red-500 to-yellow-500",
    "Sherlock Holmes": "bg-gradient-to-br from-black via-gray-700 to-white",
};

export const getLegendaryAuraClass = (name: string): string | null => {
    for (const key in TIER_1_AURAS) {
        if (name.includes(key)) return TIER_1_AURAS[key];
    }
    return null;
};

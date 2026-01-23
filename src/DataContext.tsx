import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { loadData, saveData, generateId, PLANNING_POINTS, AUDITING_POINTS, GACHA_COST } from './store';
import type { AppData, Activity, ShopItem, TimelineEntry, LogEntry, CasinoReward, CasinoGameHistory, InventoryItem } from './store';
import {
    isSupabaseConfigured,
    fetchDataFromSupabase,
    saveActivity as saveActivityToSupabase,
    deleteActivityFromSupabase,
    saveShopItem as saveShopItemToSupabase,
    deleteShopItemFromSupabase,
    saveTimelineEntry as saveTimelineEntryToSupabase,
    deleteTimelineEntryFromSupabase,
    updateUserPoints,
    addLogEntry,
    addPurchaseHistory,
    saveCasinoReward as saveCasinoRewardToSupabase,
    deleteCasinoRewardFromSupabase,
    addCasinoGameHistory,
    syncDataToSupabase,
} from './supabase';

const TIER_IMAGES = {
    t4: Array.from({ length: 15 }, (_, i) => `/tier4/tier4 (${i + 1}).jpg`), // Common
    t3: Array.from({ length: 15 }, (_, i) => `/tier3/tier3 (${i + 1}).jpg`), // Uncommon
    t2: Array.from({ length: 15 }, (_, i) => `/tier2/tier2 (${i + 1}).jpg`), // Rare
    t1: Array.from({ length: 15 }, (_, i) => `/tier1/tier1 (${i + 1}).jpg`), // Legendary (Trade up)
};

function getRandomItems<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function generateDailyRewards(): CasinoReward[] {
    const rewards: CasinoReward[] = [];

    // Daily Pool Composition: 10 items total
    // 2 Rare (T2), 3 Uncommon (T3), 5 Common (T4)
    // This allows for variety while keeping the "Menu" consistent with rarity.

    // Tier 2 (Rare)
    const t2Images = getRandomItems(TIER_IMAGES.t2, 2);
    t2Images.forEach((img, idx) => {
        rewards.push({
            id: generateId(),
            name: `Rare Weapon ${idx + 1}`,
            image: img,
            tier: 2,
            minRoll: 0, cost: 0, // Legacy/Unused
            description: 'Rare Prize'
        });
    });

    // Tier 3 (Uncommon)
    const t3Images = getRandomItems(TIER_IMAGES.t3, 3);
    t3Images.forEach((img, idx) => {
        rewards.push({
            id: generateId(),
            name: `Uncommon Weapon ${idx + 1}`,
            image: img,
            tier: 3,
            minRoll: 0, cost: 0,
            description: 'Uncommon Prize'
        });
    });

    // Tier 4 (Common)
    const t4Images = getRandomItems(TIER_IMAGES.t4, 5);
    t4Images.forEach((img, idx) => {
        rewards.push({
            id: generateId(),
            name: `Common Weapon ${idx + 1}`,
            image: img,
            tier: 4,
            minRoll: 0, cost: 0,
            description: 'Common Prize'
        });
    });

    // Tier 1 (Legendary - Trade Up Only)
    // We add them to the pool so they exist for Trade Up, but they retain 0% drop rate in playGacha
    const t1Images = getRandomItems(TIER_IMAGES.t1, 1);
    t1Images.forEach((img, idx) => {
        rewards.push({
            id: generateId(),
            name: `Legendary Weapon ${idx + 1}`,
            image: img,
            tier: 1,
            minRoll: 0, cost: 0,
            description: 'Legendary Prize'
        });
    });

    return rewards;
}



interface DataContextType {
    data: AppData;
    isLoading: boolean;
    isCloudConnected: boolean;
    addPoints: (points: number) => void;
    // Activities
    addActivity: (activity: Omit<Activity, 'id'>) => void;
    updateActivity: (id: string, updates: Partial<Activity>) => void;
    deleteActivity: (id: string) => void;
    toggleActivityVisibility: (id: string) => void;
    logActivity: (id: string) => void;
    // Shop
    addShopItem: (item: Omit<ShopItem, 'id'>) => void;
    updateShopItem: (id: string, updates: Partial<ShopItem>) => void;
    deleteShopItem: (id: string) => void;
    purchaseItem: (id: string) => boolean;
    // Timeline
    addTimelineEntry: (entry: Omit<TimelineEntry, 'id'>) => void;
    removeTimelineEntry: (id: string) => void;
    // Casino
    addCasinoReward: (reward: Omit<CasinoReward, 'id'>) => void;
    updateCasinoReward: (id: string, updates: Partial<CasinoReward>) => void;
    deleteCasinoReward: (id: string) => void;
    playGacha: () => { reward: InventoryItem; won: boolean; tier: number } | null;
    tradeUp: (targetTier: number) => { success: boolean; message: string; newItem?: InventoryItem };
    // Backup
    exportData: () => void;
    importData: (jsonString: string) => boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<AppData>(() => loadData());
    const [isLoading, setIsLoading] = useState(true);
    const [isCloudConnected, setIsCloudConnected] = useState(false);
    // Track if initial data load is complete to prevent syncing default values back to cloud
    const hasInitializedRef = useRef(false);

    // Load data from Supabase on mount if configured
    useEffect(() => {
        async function initData() {
            let currentData: AppData = loadData(); // Start with local

            if (isSupabaseConfigured()) {
                setIsCloudConnected(true);
                try {
                    const cloudData = await fetchDataFromSupabase();
                    if (cloudData) {
                        currentData = { ...cloudData, inventory: cloudData.inventory || [] }; // Cloud takes priority
                    }
                } catch (error) {
                    console.error('Failed to load from Supabase:', error);
                }
            }

            // check daily refresh
            const today = new Date().toISOString().slice(0, 10);
            if (currentData.lastDailyRefresh !== today) {
                console.log("Refreshing Daily Rewards...");
                const newRewards = generateDailyRewards();
                currentData.casinoRewards = newRewards;
                currentData.lastDailyRefresh = today;

                // If cloud connected, we verify if the cloud already has TODAY'S rewards?
                // Actually, if we just generated new ones locally but cloud has old ones, we overwrite.
                // But if multiple devices? 
                // Simple version: Client updates it. Winner takes all.
            }

            // Backfill/Sanity check if something went wrong and we have NO rewards
            if (!currentData.casinoRewards || currentData.casinoRewards.length === 0) {
                currentData.casinoRewards = generateDailyRewards();
                currentData.lastDailyRefresh = today;
            }

            setData(currentData);
            saveData(currentData); // Save to local

            // Mark initialization as complete
            hasInitializedRef.current = true;
            setIsLoading(false);

            // If we updated daily rewards, sync to Supabase (if connected)
            if (isSupabaseConfigured() && currentData.lastDailyRefresh === today) {
                // We might want to sync the whole object or just rewards. 
                // syncDataToSupabase does the whole thing.
                syncDataToSupabase(currentData);
            }
        }
        initData();
    }, []);

    // Ensure state validity on mount for local data too
    useEffect(() => {
        setData(prev => {
            let updates: Partial<AppData> = {};

            // Backfill inventory
            if (!prev.inventory) {
                updates.inventory = [];
            }

            // Backfill casino rewards if completely empty (to help user get started with Gacha)
            // But only if we are absolutely sure this is what we want.
            // Actually, let's just make sure the ARRAY exists.
            if (!prev.casinoRewards) {
                updates.casinoRewards = [];
            } else if (prev.casinoRewards.length === 0) {
                // Optional: Restore defaults if empty? 
                // Maybe better to leave it empty but let the UI handle it (which we did).
                // However, "Backfilling defaults" helps the immediate "Why is it empty?" experience.
                // Let's inject defaults if it's empty to be helpful, as the user seems to want it "fixed".
                updates.casinoRewards = [
                    { id: '1', name: 'Jackpot!', image: '💎', tier: 1, minRoll: 12, cost: 1, description: 'Legendary Prize' },
                    { id: '2', name: 'Lucky Prize', image: '🍀', tier: 2, minRoll: 10, cost: 0.5, description: 'Rare Prize' },
                    { id: '3', name: 'Small Treat', image: '🎁', tier: 3, minRoll: 8, cost: 0.25, description: 'Uncommon Prize' },
                    { id: '4', name: 'Consolation', image: '🍬', tier: 4, minRoll: 6, cost: 0.1, description: 'Common Prize' },
                ];
            }

            if (Object.keys(updates).length > 0) {
                return { ...prev, ...updates };
            }
            return prev;
        });
    }, []);

    // Save to localStorage whenever data changes
    useEffect(() => {
        saveData(data);
    }, [data]);

    // Sync points to cloud whenever they change (but only after initial load is complete)
    useEffect(() => {
        // Skip syncing during initial load to prevent overwriting cloud data with default values
        if (!hasInitializedRef.current) {
            return;
        }
        if (isSupabaseConfigured()) {
            updateUserPoints(data.currentPoints);
        }
    }, [data.currentPoints]);

    const addPoints = useCallback((points: number) => {
        setData(prev => ({ ...prev, currentPoints: prev.currentPoints + points }));
    }, []);

    // Activity functions
    const addActivity = useCallback((activity: Omit<Activity, 'id'>) => {
        const newActivity = { ...activity, id: generateId() };
        setData(prev => ({
            ...prev,
            activities: [...prev.activities, newActivity],
        }));
        // Always try to sync to Supabase if configured
        if (isSupabaseConfigured()) {
            saveActivityToSupabase(newActivity);
        }
    }, []);

    const updateActivity = useCallback((id: string, updates: Partial<Activity>) => {
        setData(prev => {
            const updated = prev.activities.map(a => (a.id === id ? { ...a, ...updates } : a));
            return { ...prev, activities: updated };
        });

        // Side effect outside updater
        const activityToCheck = data.activities.find(a => a.id === id);
        if (activityToCheck && isSupabaseConfigured()) {
            // We need the updated version. 
            // Since state update is async, we manually construct the updated object for the side effect
            const updatedActivity = { ...activityToCheck, ...updates };
            saveActivityToSupabase(updatedActivity);
        }
    }, [data.activities]);

    const deleteActivity = useCallback((id: string) => {
        setData(prev => ({
            ...prev,
            activities: prev.activities.filter(a => a.id !== id),
        }));
        if (isSupabaseConfigured()) {
            deleteActivityFromSupabase(id);
        }
    }, []);

    const toggleActivityVisibility = useCallback((id: string) => {
        setData(prev => {
            const updated = prev.activities.map(a => (a.id === id ? { ...a, isVisible: !a.isVisible } : a));
            return { ...prev, activities: updated };
        });

        const activity = data.activities.find(a => a.id === id);
        if (activity && isSupabaseConfigured()) {
            // Construct updated state for DB
            saveActivityToSupabase({ ...activity, isVisible: !activity.isVisible });
        }
    }, [data.activities]);

    const logActivity = useCallback((id: string) => {
        const activity = data.activities.find(a => a.id === id);
        if (!activity) return;

        const newLog: LogEntry = {
            id: generateId(),
            message: `Completed: ${activity.name}`,
            timestamp: new Date().toISOString(),
            type: 'activity',
            pointsChange: activity.points,
        };

        if (isSupabaseConfigured()) {
            addLogEntry(newLog);
        }

        setData(prev => ({
            ...prev,
            currentPoints: prev.currentPoints + activity.points,
            logs: [...(prev.logs || []), newLog],
        }));
    }, [data.activities]);

    // Shop functions
    const addShopItem = useCallback((item: Omit<ShopItem, 'id'>) => {
        const newItem = { ...item, id: generateId() };
        setData(prev => ({
            ...prev,
            shopItems: [...prev.shopItems, newItem],
        }));
        if (isSupabaseConfigured()) {
            saveShopItemToSupabase(newItem);
        }
    }, []);

    const updateShopItem = useCallback((id: string, updates: Partial<ShopItem>) => {
        setData(prev => {
            const updated = prev.shopItems.map(i => (i.id === id ? { ...i, ...updates } : i));
            return { ...prev, shopItems: updated };
        });

        const item = data.shopItems.find(i => i.id === id);
        if (item && isSupabaseConfigured()) {
            saveShopItemToSupabase({ ...item, ...updates });
        }
    }, [data.shopItems]);

    const deleteShopItem = useCallback((id: string) => {
        setData(prev => ({
            ...prev,
            shopItems: prev.shopItems.filter(i => i.id !== id),
        }));
        if (isSupabaseConfigured()) {
            deleteShopItemFromSupabase(id);
        }
    }, []);

    const purchaseItem = useCallback((id: string): boolean => {
        const item = data.shopItems.find(i => i.id === id);
        if (!item || data.currentPoints < item.price) return false;

        const newLog: LogEntry = {
            id: generateId(),
            message: `Purchased: ${item.name}`,
            timestamp: new Date().toISOString(),
            type: 'purchase',
            pointsChange: -item.price,
        };
        const purchase = { itemId: id, itemName: item.name, price: item.price, date: new Date().toISOString() };

        if (isSupabaseConfigured()) {
            addLogEntry(newLog);
            addPurchaseHistory(purchase);
        }

        setData(prev => ({
            ...prev,
            currentPoints: prev.currentPoints - item.price,
            purchaseHistory: [...prev.purchaseHistory, purchase],
            logs: [...(prev.logs || []), newLog],
        }));

        return true;
    }, [data.shopItems, data.currentPoints]);

    // Timeline functions
    const addTimelineEntry = useCallback((entry: Omit<TimelineEntry, 'id'>) => {
        const points = entry.type === 'planning' ? PLANNING_POINTS : AUDITING_POINTS;
        const newEntry = { ...entry, id: generateId() };
        const newLog: LogEntry = {
            id: generateId(),
            message: `Added ${entry.type} entry: ${entry.description}`,
            timestamp: new Date().toISOString(),
            type: 'timeline_add',
            pointsChange: points,
        };

        if (isSupabaseConfigured()) {
            saveTimelineEntryToSupabase(newEntry);
            addLogEntry(newLog);
        }

        setData(prev => ({
            ...prev,
            timelineEntries: [...prev.timelineEntries, newEntry],
            currentPoints: prev.currentPoints + points,
            logs: [...(prev.logs || []), newLog],
        }));
    }, []);

    const removeTimelineEntry = useCallback((id: string) => {
        const entry = data.timelineEntries.find(e => e.id === id);
        if (!entry) return;

        const points = entry.type === 'planning' ? PLANNING_POINTS : AUDITING_POINTS;
        const newLog: LogEntry = {
            id: generateId(),
            message: `Removed ${entry.type} entry: ${entry.description}`,
            timestamp: new Date().toISOString(),
            type: 'timeline_remove',
            pointsChange: -points,
        };

        if (isSupabaseConfigured()) {
            deleteTimelineEntryFromSupabase(id);
            addLogEntry(newLog);
        }

        setData(prev => ({
            ...prev,
            timelineEntries: prev.timelineEntries.filter(e => e.id !== id),
            currentPoints: prev.currentPoints - points,
            logs: [...(prev.logs || []), newLog],
        }));
    }, [data.timelineEntries]);

    // Casino functions
    const addCasinoReward = useCallback((reward: Omit<CasinoReward, 'id'>) => {
        const newReward = { ...reward, id: generateId() };
        setData(prev => ({
            ...prev,
            casinoRewards: [...prev.casinoRewards, newReward],
        }));
        if (isSupabaseConfigured()) {
            saveCasinoRewardToSupabase(newReward);
        }
    }, []);

    const updateCasinoReward = useCallback((id: string, updates: Partial<CasinoReward>) => {
        setData(prev => {
            const updated = prev.casinoRewards.map(r => (r.id === id ? { ...r, ...updates } : r));
            return { ...prev, casinoRewards: updated };
        });

        const reward = data.casinoRewards.find(r => r.id === id);
        if (reward && isSupabaseConfigured()) {
            saveCasinoRewardToSupabase({ ...reward, ...updates });
        }
    }, [data.casinoRewards]);

    const deleteCasinoReward = useCallback((id: string) => {
        setData(prev => ({
            ...prev,
            casinoRewards: prev.casinoRewards.filter(r => r.id !== id),
        }));
        if (isSupabaseConfigured()) {
            deleteCasinoRewardFromSupabase(id);
        }
    }, []);

    const playGacha = useCallback((): { reward: InventoryItem; won: boolean; tier: number } | null => {
        if (data.currentPoints < GACHA_COST) return null;

        // Probabilities
        // Tier 2: 13%
        // Tier 3: 37%
        // Tier 4: 50%
        // range 0-100
        const roll = Math.random() * 100;
        let tier = 4;
        if (roll < 13) tier = 2; // 0-12.99
        else if (roll < 50) tier = 3; // 13-49.99 (37%)
        else tier = 4; // 50-99.99 (50%)

        // Find rewards of this tier
        // Note: For trade-up (Tier 1), we don't drop it here.
        const possibleRewards = data.casinoRewards.filter(r => r.tier === tier);

        let rewardDef: CasinoReward;
        if (possibleRewards.length === 0) {
            // Fallback if no rewards of this tier exist, try ANY lower tier (higher number)
            const lowerRewards = data.casinoRewards.filter(r => r.tier >= tier);
            if (lowerRewards.length > 0) {
                rewardDef = lowerRewards[Math.floor(Math.random() * lowerRewards.length)];
            } else {
                // Absolute fallback
                if (data.casinoRewards.length === 0) return null; // No rewards at all
                rewardDef = data.casinoRewards[Math.floor(Math.random() * data.casinoRewards.length)];
            }
        } else {
            rewardDef = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
        }

        const newInventoryItem: InventoryItem = {
            id: generateId(),
            rewardId: rewardDef.id,
            name: rewardDef.name,
            image: rewardDef.image,
            tier: rewardDef.tier,
            acquiredAt: new Date().toISOString()
        };

        const historyEntry: CasinoGameHistory = {
            id: generateId(),
            game: 'gacha',
            cost: GACHA_COST,
            won: true,
            rewardId: rewardDef.id,
            rewardName: rewardDef.name,
            timestamp: new Date().toISOString(),
        };

        const newLog: LogEntry = {
            id: generateId(),
            message: `🎰 Gacha: Won ${rewardDef.image} ${rewardDef.name} (Tier ${rewardDef.tier})`,
            timestamp: new Date().toISOString(),
            type: 'casino',
            pointsChange: -GACHA_COST,
        };

        if (isSupabaseConfigured()) {
            addCasinoGameHistory(historyEntry);
            addLogEntry(newLog);
            // We are NOT syncing inventory to supabase yet as per plan, only local
        }

        setData(prev => ({
            ...prev,
            currentPoints: prev.currentPoints - GACHA_COST,
            casinoHistory: [historyEntry, ...prev.casinoHistory],
            inventory: [newInventoryItem, ...prev.inventory],
            logs: [...(prev.logs || []), newLog],
        }));

        return { reward: newInventoryItem, won: true, tier: rewardDef.tier };
    }, [data.casinoRewards, data.currentPoints]);

    const tradeUp = useCallback((targetTier: number): { success: boolean; message: string; newItem?: InventoryItem } => {
        // Trade Logic:
        // 6 T4 -> 1 T3
        // 10 T3 -> 1 T2
        // 12 T2 -> 1 T1

        let requiredCount = 0;
        let sourceTier = targetTier + 1;

        if (targetTier === 3) requiredCount = 6; // uses T4
        else if (targetTier === 2) requiredCount = 10; // uses T3
        else if (targetTier === 1) requiredCount = 12; // uses T2
        else return { success: false, message: "Invalid target tier" };

        const sourceItems = data.inventory.filter(i => i.tier === sourceTier);
        if (sourceItems.length < requiredCount) {
            return { success: false, message: `Not enough Tier ${sourceTier} items. Need ${requiredCount}, have ${sourceItems.length}.` };
        }

        // Check if target tier rewards exist
        const possibleRewards = data.casinoRewards.filter(r => r.tier === targetTier);
        if (possibleRewards.length === 0) {
            return { success: false, message: `No rewards configured for Tier ${targetTier}.` };
        }

        // Consume items (randomly pick N items to remove)
        // We Shuffle then slice? Or just pick first N?
        // Let's just pick the first N for simplicity (FIFO-ish)
        const itemsToRemove = sourceItems.slice(0, requiredCount);
        const itemIdsToRemove = new Set(itemsToRemove.map(i => i.id));

        // Generate new item
        const rewardDef = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
        const newItem: InventoryItem = {
            id: generateId(),
            rewardId: rewardDef.id,
            name: rewardDef.name,
            image: rewardDef.image,
            tier: rewardDef.tier,
            acquiredAt: new Date().toISOString()
        };

        const newLog: LogEntry = {
            id: generateId(),
            message: `🔄 Trade-Up: Traded ${requiredCount} Tier ${sourceTier} for ${rewardDef.image} ${rewardDef.name} (Tier ${targetTier})`,
            timestamp: new Date().toISOString(),
            type: 'trade_up',
        };

        if (isSupabaseConfigured()) {
            addLogEntry(newLog);
        }

        setData(prev => ({
            ...prev,
            inventory: [...prev.inventory.filter(i => !itemIdsToRemove.has(i.id)), newItem],
            logs: [...(prev.logs || []), newLog],
        }));

        return { success: true, message: `Successfully traded up for ${newItem.name}!`, newItem };
    }, [data.inventory, data.casinoRewards]);

    // Backup functions
    const exportData = useCallback(() => {
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `time-auditor-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [data]);

    const importData = useCallback((jsonString: string): boolean => {
        try {
            const parsed = JSON.parse(jsonString);
            if (typeof parsed.currentPoints !== 'number') return false;
            if (!Array.isArray(parsed.activities)) return false;
            if (!Array.isArray(parsed.shopItems)) return false;

            const newData: AppData = {
                activities: parsed.activities || [],
                shopItems: parsed.shopItems || [],
                currentPoints: parsed.currentPoints || 0,
                purchaseHistory: parsed.purchaseHistory || [],
                timelineEntries: parsed.timelineEntries || [],
                logs: parsed.logs || [],
                casinoRewards: parsed.casinoRewards || [],
                casinoHistory: parsed.casinoHistory || [],
                inventory: parsed.inventory || [],
            };

            setData(newData);

            // Also sync to Supabase if configured
            if (isSupabaseConfigured()) {
                syncDataToSupabase(newData);
            }

            return true;
        } catch (e) {
            console.error('Failed to import data:', e);
            return false;
        }
    }, []);

    return (
        <DataContext.Provider
            value={{
                data,
                isLoading,
                isCloudConnected,
                addPoints,
                addActivity,
                updateActivity,
                deleteActivity,
                toggleActivityVisibility,
                logActivity,
                addShopItem,
                updateShopItem,
                deleteShopItem,
                purchaseItem,
                addTimelineEntry,
                removeTimelineEntry,
                addCasinoReward,
                updateCasinoReward,
                deleteCasinoReward,
                playGacha,
                tradeUp,
                exportData,
                importData,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used within DataProvider');
    return ctx;
}

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
            if (isSupabaseConfigured()) {
                setIsCloudConnected(true);
                try {
                    const cloudData = await fetchDataFromSupabase();
                    if (cloudData) {
                        // Use cloud data (cloud takes priority)
                        const safeCloudData = { ...cloudData, inventory: cloudData.inventory || [] }; // Safety backfill
                        setData(safeCloudData);
                        saveData(safeCloudData); // Also save to localStorage as backup
                    }
                } catch (error) {
                    console.error('Failed to load from Supabase:', error);
                }
            }
            // Mark initialization as complete AFTER setting cloud data
            hasInitializedRef.current = true;
            setIsLoading(false);
        }
        initData();
    }, []);

    // Ensure state validity on mount for local data too
    useEffect(() => {
        setData(prev => {
            if (!prev.inventory) {
                return { ...prev, inventory: [] };
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

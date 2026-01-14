import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { loadData, saveData, generateId, PLANNING_POINTS, AUDITING_POINTS } from './store';
import type { AppData, Activity, ShopItem, TimelineEntry, LogEntry } from './store';
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
    // Backup
    exportData: () => void;
    importData: (jsonString: string) => boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<AppData>(() => loadData());
    const [isLoading, setIsLoading] = useState(true);
    const [isCloudConnected, setIsCloudConnected] = useState(false);

    // Load data from Supabase on mount if configured
    useEffect(() => {
        async function initData() {
            if (isSupabaseConfigured()) {
                try {
                    const cloudData = await fetchDataFromSupabase();
                    if (cloudData) {
                        // Merge cloud data with local data (cloud takes priority for existing items)
                        setData(cloudData);
                        saveData(cloudData); // Also save to localStorage as backup
                        setIsCloudConnected(true);
                    }
                } catch (error) {
                    console.error('Failed to load from Supabase:', error);
                }
            }
            setIsLoading(false);
        }
        initData();
    }, []);

    // Save to localStorage whenever data changes
    useEffect(() => {
        saveData(data);
    }, [data]);

    // Sync points to cloud
    useEffect(() => {
        if (isCloudConnected) {
            updateUserPoints(data.currentPoints);
        }
    }, [data.currentPoints, isCloudConnected]);

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
        if (isCloudConnected) {
            saveActivityToSupabase(newActivity);
        }
    }, [isCloudConnected]);

    const updateActivity = useCallback((id: string, updates: Partial<Activity>) => {
        setData(prev => {
            const updated = prev.activities.map(a => (a.id === id ? { ...a, ...updates } : a));
            const activity = updated.find(a => a.id === id);
            if (activity && isCloudConnected) {
                saveActivityToSupabase(activity);
            }
            return { ...prev, activities: updated };
        });
    }, [isCloudConnected]);

    const deleteActivity = useCallback((id: string) => {
        setData(prev => ({
            ...prev,
            activities: prev.activities.filter(a => a.id !== id),
        }));
        if (isCloudConnected) {
            deleteActivityFromSupabase(id);
        }
    }, [isCloudConnected]);

    const toggleActivityVisibility = useCallback((id: string) => {
        setData(prev => {
            const updated = prev.activities.map(a => (a.id === id ? { ...a, isVisible: !a.isVisible } : a));
            const activity = updated.find(a => a.id === id);
            if (activity && isCloudConnected) {
                saveActivityToSupabase(activity);
            }
            return { ...prev, activities: updated };
        });
    }, [isCloudConnected]);

    const logActivity = useCallback((id: string) => {
        setData(prev => {
            const activity = prev.activities.find(a => a.id === id);
            if (!activity) return prev;
            const newLog: LogEntry = {
                id: generateId(),
                message: `Completed: ${activity.name}`,
                timestamp: new Date().toISOString(),
                type: 'activity',
                pointsChange: activity.points,
            };
            if (isCloudConnected) {
                addLogEntry(newLog);
            }
            return {
                ...prev,
                currentPoints: prev.currentPoints + activity.points,
                logs: [...(prev.logs || []), newLog],
            };
        });
    }, [isCloudConnected]);

    // Shop functions
    const addShopItem = useCallback((item: Omit<ShopItem, 'id'>) => {
        const newItem = { ...item, id: generateId() };
        setData(prev => ({
            ...prev,
            shopItems: [...prev.shopItems, newItem],
        }));
        if (isCloudConnected) {
            saveShopItemToSupabase(newItem);
        }
    }, [isCloudConnected]);

    const updateShopItem = useCallback((id: string, updates: Partial<ShopItem>) => {
        setData(prev => {
            const updated = prev.shopItems.map(i => (i.id === id ? { ...i, ...updates } : i));
            const item = updated.find(i => i.id === id);
            if (item && isCloudConnected) {
                saveShopItemToSupabase(item);
            }
            return { ...prev, shopItems: updated };
        });
    }, [isCloudConnected]);

    const deleteShopItem = useCallback((id: string) => {
        setData(prev => ({
            ...prev,
            shopItems: prev.shopItems.filter(i => i.id !== id),
        }));
        if (isCloudConnected) {
            deleteShopItemFromSupabase(id);
        }
    }, [isCloudConnected]);

    const purchaseItem = useCallback((id: string): boolean => {
        let success = false;
        setData(prev => {
            const item = prev.shopItems.find(i => i.id === id);
            if (!item || prev.currentPoints < item.price) return prev;
            success = true;
            const newLog: LogEntry = {
                id: generateId(),
                message: `Purchased: ${item.name}`,
                timestamp: new Date().toISOString(),
                type: 'purchase',
                pointsChange: -item.price,
            };
            const purchase = { itemId: id, itemName: item.name, price: item.price, date: new Date().toISOString() };
            if (isCloudConnected) {
                addLogEntry(newLog);
                addPurchaseHistory(purchase);
            }
            return {
                ...prev,
                currentPoints: prev.currentPoints - item.price,
                purchaseHistory: [...prev.purchaseHistory, purchase],
                logs: [...(prev.logs || []), newLog],
            };
        });
        return success;
    }, [isCloudConnected]);

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
        if (isCloudConnected) {
            saveTimelineEntryToSupabase(newEntry);
            addLogEntry(newLog);
        }
        setData(prev => ({
            ...prev,
            timelineEntries: [...prev.timelineEntries, newEntry],
            currentPoints: prev.currentPoints + points,
            logs: [...(prev.logs || []), newLog],
        }));
    }, [isCloudConnected]);

    const removeTimelineEntry = useCallback((id: string) => {
        setData(prev => {
            const entry = prev.timelineEntries.find(e => e.id === id);
            if (!entry) return prev;
            const points = entry.type === 'planning' ? PLANNING_POINTS : AUDITING_POINTS;
            const newLog: LogEntry = {
                id: generateId(),
                message: `Removed ${entry.type} entry: ${entry.description}`,
                timestamp: new Date().toISOString(),
                type: 'timeline_remove',
                pointsChange: -points,
            };
            if (isCloudConnected) {
                deleteTimelineEntryFromSupabase(id);
                addLogEntry(newLog);
            }
            return {
                ...prev,
                timelineEntries: prev.timelineEntries.filter(e => e.id !== id),
                currentPoints: prev.currentPoints - points,
                logs: [...(prev.logs || []), newLog],
            };
        });
    }, [isCloudConnected]);

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

            setData({
                activities: parsed.activities || [],
                shopItems: parsed.shopItems || [],
                currentPoints: parsed.currentPoints || 0,
                purchaseHistory: parsed.purchaseHistory || [],
                timelineEntries: parsed.timelineEntries || [],
                logs: parsed.logs || [],
            });
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

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { loadData, saveData, generateId, PLANNING_POINTS, AUDITING_POINTS } from './store';
import type { AppData, Activity, ShopItem, TimelineEntry, LogEntry } from './store';

interface DataContextType {
    data: AppData;
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
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<AppData>(() => loadData());

    useEffect(() => {
        saveData(data);
    }, [data]);

    const addPoints = useCallback((points: number) => {
        setData(prev => ({ ...prev, currentPoints: prev.currentPoints + points }));
    }, []);

    // Activity functions
    const addActivity = useCallback((activity: Omit<Activity, 'id'>) => {
        setData(prev => ({
            ...prev,
            activities: [...prev.activities, { ...activity, id: generateId() }],
        }));
    }, []);

    const updateActivity = useCallback((id: string, updates: Partial<Activity>) => {
        setData(prev => ({
            ...prev,
            activities: prev.activities.map(a => (a.id === id ? { ...a, ...updates } : a)),
        }));
    }, []);

    const deleteActivity = useCallback((id: string) => {
        setData(prev => ({
            ...prev,
            activities: prev.activities.filter(a => a.id !== id),
        }));
    }, []);

    const toggleActivityVisibility = useCallback((id: string) => {
        setData(prev => ({
            ...prev,
            activities: prev.activities.map(a => (a.id === id ? { ...a, isVisible: !a.isVisible } : a)),
        }));
    }, []);

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
            return {
                ...prev,
                currentPoints: prev.currentPoints + activity.points,
                logs: [...(prev.logs || []), newLog],
            };
        });
    }, []);

    // Shop functions
    const addShopItem = useCallback((item: Omit<ShopItem, 'id'>) => {
        setData(prev => ({
            ...prev,
            shopItems: [...prev.shopItems, { ...item, id: generateId() }],
        }));
    }, []);

    const updateShopItem = useCallback((id: string, updates: Partial<ShopItem>) => {
        setData(prev => ({
            ...prev,
            shopItems: prev.shopItems.map(i => (i.id === id ? { ...i, ...updates } : i)),
        }));
    }, []);

    const deleteShopItem = useCallback((id: string) => {
        setData(prev => ({
            ...prev,
            shopItems: prev.shopItems.filter(i => i.id !== id),
        }));
    }, []);

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
            return {
                ...prev,
                currentPoints: prev.currentPoints - item.price,
                purchaseHistory: [
                    ...prev.purchaseHistory,
                    { itemId: id, itemName: item.name, price: item.price, date: new Date().toISOString() },
                ],
                logs: [...(prev.logs || []), newLog],
            };
        });
        return success;
    }, []);

    // Timeline functions
    const addTimelineEntry = useCallback((entry: Omit<TimelineEntry, 'id'>) => {
        const points = entry.type === 'planning' ? PLANNING_POINTS : AUDITING_POINTS;
        const newLog: LogEntry = {
            id: generateId(),
            message: `Added ${entry.type} entry: ${entry.description}`,
            timestamp: new Date().toISOString(),
            type: 'timeline_add',
            pointsChange: points,
        };
        setData(prev => ({
            ...prev,
            timelineEntries: [...prev.timelineEntries, { ...entry, id: generateId() }],
            currentPoints: prev.currentPoints + points,
            logs: [...(prev.logs || []), newLog],
        }));
    }, []);

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
            return {
                ...prev,
                timelineEntries: prev.timelineEntries.filter(e => e.id !== id),
                currentPoints: prev.currentPoints - points,
                logs: [...(prev.logs || []), newLog],
            };
        });
    }, []);

    return (
        <DataContext.Provider
            value={{
                data,
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

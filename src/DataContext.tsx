import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { loadData, saveData, generateId, PLANNING_POINTS, AUDITING_POINTS, GACHA_COST } from './store';
import type { AppData, Activity, ShopItem, TimelineEntry, LogEntry, CasinoReward, CasinoGameHistory, InventoryItem, Quest } from './store';
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
    saveInventoryItem as saveInventoryItemToSupabase,
    deleteInventoryItemFromSupabase,
    saveQuest,
    deleteQuestFromSupabase,
    saveBonusClaims,
    updateUserData,
    clearAllCasinoRewards,
} from './supabase';

const TIER_IMAGES = {
    t4: [
        "/tier4/tier4 (1)_OPM NPC1.jpg",
        "/tier4/tier4 (2)_Mao Mao.jpg",
        "/tier4/tier4 (3)_Ranpo Edogawa.jpg",
        "/tier4/tier4 (4)_Taki Tachibana.jpg",
        "/tier4/tier4 (5)_Shikamaru.jpg",
        "/tier4/tier4 (6)_Mitsuha Miyamizu.jpg",
        "/tier4/tier4 (7)_Weak Saitama.jpg",
        "/tier4/tier4 (8)_Atomic Samurai.jpg",
        "/tier4/tier4 (9)_King.jpg",
        "/tier4/tier4 (10)_Zombieman.jpg",
        "/tier4/tier4 (11)_Pig God.jpg",
        "/tier4/tier4 (12)_Amai Mask.jpg",
        "/tier4/tier4 (13)_Fubuki.jpg",
        "/tier4/tier4 (14)_Mumen Rider.jpg",
        "/tier4/tier4 (15)_Captain Mizuki.jpg",
        "/tier4/tier4 (16)_Ukyo Saionji.jpg",
        "/tier4/tier4 (17)_Kohaku.jpg",
        "/tier4/tier4 (18)_Taiju Oki.jpg",
        "/tier4/tier4 (19)_Yuzuriha Ogawa.jpg",
        "/tier4/tier4 (20)_Suika.jpg",
    ],
    t3: [
        "/tier3/tier3 (1)_Emma.jpg",
        "/tier3/tier3 (2)_Eren Yeager.jpg",
        "/tier3/tier3 (3)_Eren Yeager.jpg",
        "/tier3/tier3 (4)_Armin.jpg",
        "/tier3/tier3 (5)_Mikasa.jpg",
        "/tier3/tier3 (6)_Ray.jpg",
        "/tier3/tier3 (7)_Yor Forger.jpg",
        "/tier3/tier3 (8)_Anya.jpg",
        "/tier3/tier3 (9)_Deku.jpg",
        "/tier3/tier3 (10)_Shoto Todoroki.jpg",
        "/tier3/tier3 (11)_Bakugo.jpg",
        "/tier3/tier3 (12)_All Might.jpg",
        "/tier3/tier3 (13)_Fang.jpg",
        "/tier3/tier3 (14)_Garou.jpg",
        "/tier3/tier3 (15)_Genos.jpg",
        "/tier3/tier3 (16)_Mickey.jpg",
        "/tier3/tier3 (17)_Conan.jpg",
    ],
    t2: [
        "/tier2/tier2 (1)_Guru Gembul.jpg",
        "/tier2/tier2 (2)_Leon Hartono.jpg",
        "/tier2/tier2 (3)_Light Yagami.jpg",
        "/tier2/tier2 (4)_Prabowo Subianto.jpg",
        "/tier2/tier2 (5)_Soekarno.jpg",
        "/tier2/tier2 (6)_Amran Sulaiman.jpg",
        "/tier2/tier2 (7)_Ahok.jpg",
        "/tier2/tier2 (8)_Anies Baswedan.jpg",
        "/tier2/tier2 (9)_Purbaya.jpg",
        "/tier2/tier2 (10)_Loid Forger.jpg",
        "/tier2/tier2 (11)_Saitama.jpg",
        "/tier2/tier2 (12)_Kogorou Akechi.jpg",
        "/tier2/tier2 (13)_Clannad Family.jpg",
        "/tier2/tier2 (14)_Norman.jpg",
        "/tier2/tier2 (15)_Senku Ishigami.jpg",
        "/tier2/tier2 (16)_Anthony Sudarsono.jpg",
    ],
    t1: [
        "/tier1/tier1 (1)_Lorenzo de' Medici.jpg",
        "/tier1/tier1 (2)_Nathan Mayer Rothschild.jpg",
        "/tier1/tier1 (3)_Jacob Fugger.jpg",
        "/tier1/tier1 (4)_Deddy Corbuzier.jpg",
        "/tier1/tier1 (5)_Timothy Ronald.jpg",
        "/tier1/tier1 (6)_Bennix.jpg",
        "/tier1/tier1 (7)_Andrew Susanto.jpg",
        "/tier1/tier1 (8)_Donald Trump.jpg",
        "/tier1/tier1 (9)_Putin.jpg",
        "/tier1/tier1 (10)_Lee Kuan Yew.jpg",
        "/tier1/tier1 (11)_习近平.jpg",
        "/tier1/tier1 (12)_L.jpg",
        "/tier1/tier1 (13)_Nezu Chuukichi.jpg",
        "/tier1/tier1 (14)_Thick Face Black Heart.jpg",
        "/tier1/tier1 (15)_Saitama.jpg",
        "/tier1/tier1 (16)_Tatsumaki.jpg",
        "/tier1/tier1 (17)_Kiyotaka Ayanokōji.jpg",
        "/tier1/tier1 (18)_Tommy Shelby.jpg",
        "/tier1/tier1 (19)_Qin Feng.jpg",
        "/tier1/tier1 (20)_Sherlock Holmes.jpg",
    ],
};

function extractNameFromPath(path: string): string {
    // Format: /tierX/tierX (Y)_Name.jpg
    const filename = path.split('/').pop() || '';
    const parts = filename.split('_');
    if (parts.length > 1) {
        // Remove .jpg extension
        return parts[1].replace('.jpg', '');
    }
    return filename;
}

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
    t2Images.forEach((img) => {
        rewards.push({
            id: generateId(),
            name: extractNameFromPath(img),
            image: img,
            tier: 2,
            minRoll: 0, cost: 0, // Legacy/Unused
            description: 'Rare Prize'
        });
    });

    // Tier 3 (Uncommon)
    const t3Images = getRandomItems(TIER_IMAGES.t3, 3);
    t3Images.forEach((img) => {
        rewards.push({
            id: generateId(),
            name: extractNameFromPath(img),
            image: img,
            tier: 3,
            minRoll: 0, cost: 0,
            description: 'Uncommon Prize'
        });
    });

    // Tier 4 (Common)
    const t4Images = getRandomItems(TIER_IMAGES.t4, 5);
    t4Images.forEach((img) => {
        rewards.push({
            id: generateId(),
            name: extractNameFromPath(img),
            image: img,
            tier: 4,
            minRoll: 0, cost: 0,
            description: 'Common Prize'
        });
    });

    // Tier 1 (Legendary - Trade Up Only)
    // We add them to the pool so they exist for Trade Up, but they retain 0% drop rate in playGacha
    const t1Images = getRandomItems(TIER_IMAGES.t1, 1);
    t1Images.forEach((img) => {
        rewards.push({
            id: generateId(),
            name: extractNameFromPath(img),
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
    addShopItem: (item: Omit<ShopItem, 'id'>) => Promise<boolean>;
    updateShopItem: (id: string, updates: Partial<ShopItem>) => Promise<boolean>;
    deleteShopItem: (id: string) => Promise<boolean>;
    purchaseItem: (id: string) => boolean;
    // Timeline
    addTimelineEntry: (entry: Omit<TimelineEntry, 'id'>) => void;
    removeTimelineEntry: (id: string) => void;
    // Casino
    addCasinoReward: (reward: Omit<CasinoReward, 'id'>) => void;
    updateCasinoReward: (id: string, updates: Partial<CasinoReward>) => void;
    deleteCasinoReward: (id: string) => void;
    playGacha: () => { reward: InventoryItem; won: boolean; tier: number } | null;
    playShopGacha: () => { reward: InventoryItem; won: boolean; tier: number } | null;
    tradeUp: (targetTier: number) => { success: boolean; message: string; newItem?: InventoryItem };
    // Quests
    addQuest: (quest: Omit<Quest, 'id' | 'isCompleted'>) => void;
    updateQuest: (id: string, updates: Partial<Quest>) => void;
    deleteQuest: (id: string) => void;
    updateQuestProgress: (id: string, value: number) => void;
    claimDailyBonus: () => void;
    claimWeeklyBonus: () => void;
    logQuestPenalty: (questId: string) => void;
    // Backup
    exportData: () => void;
    importData: (jsonString: string) => boolean;
    setData: React.Dispatch<React.SetStateAction<AppData>>;
}

// Time Utils for WIB (UTC+7)
export function getWIBDate(date: Date = new Date()): Date {
    // Return a Date object that effectively represents WIB time
    // But be careful: Date objects are always conceptually UTC or Local.
    // Here we are shifting the *value* so getters return WIB components if treated as UTC?
    // Actually, the previous implementation was: date.getTime() + 7h.
    // If we run .toISOString() on that, it gives the "time in WIB" as if it were UTC time.
    return new Date(date.getTime() + (3600000 * 7));
}

export function getWIBDateString(date: Date = new Date()): string {
    const wib = getWIBDate(date);
    return wib.toISOString().split('T')[0];
}

function getStartOfWeekWIB(date: Date = new Date()): Date {
    const wib = getWIBDate(date);
    const day = wib.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = wib.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    wib.setDate(diff);
    wib.setHours(0, 0, 0, 0);
    return wib;
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
            let cloudLoaded = false;

            if (isSupabaseConfigured()) {
                setIsCloudConnected(true);
                try {
                    const cloudData = await fetchDataFromSupabase();
                    if (cloudData) {
                        cloudLoaded = true;
                        // Merge inventories safely
                        const localInv = currentData.inventory || [];
                        const cloudInv = cloudData.inventory || [];
                        const mergedInvMap = new Map();
                        // Local first
                        localInv.forEach(i => mergedInvMap.set(i.id, i));
                        // Cloud second (priority)
                        cloudInv.forEach(i => mergedInvMap.set(i.id, i));

                        const mergedInv = Array.from(mergedInvMap.values()).sort((a: any, b: any) =>
                            new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()
                        );

                        // Filter out shop items from merged inventory (Cleanup)
                        // If an item's rewardId exists in shopItems, it shouldn't be in inventory (as per new rule)
                        // We use a Set for O(1) lookup
                        // Note: shopItems is also loaded from cloud or local
                        const shopItemIds = new Set((cloudData.shopItems || []).map(s => s.id));
                        const cleanedInv = mergedInv.filter(item => !shopItemIds.has(item.rewardId));

                        // Merge Quests
                        const localQuests = currentData.quests || [];
                        const cloudQuests = cloudData.quests || [];
                        const mergedQuestsMap = new Map();
                        localQuests.forEach(q => mergedQuestsMap.set(q.id, q));
                        cloudQuests.forEach(q => mergedQuestsMap.set(q.id, q));
                        const mergedQuests = Array.from(mergedQuestsMap.values());

                        // Smart merge for bonus claims (prefer later dates)
                        const mergedDaily = (currentData.lastDailyBonusClaimed || "") > (cloudData.lastDailyBonusClaimed || "")
                            ? currentData.lastDailyBonusClaimed
                            : cloudData.lastDailyBonusClaimed;

                        const mergedWeekly = (currentData.lastWeeklyBonusClaimed || "") > (cloudData.lastWeeklyBonusClaimed || "")
                            ? currentData.lastWeeklyBonusClaimed
                            : cloudData.lastWeeklyBonusClaimed;

                        currentData = {
                            ...cloudData,
                            inventory: cleanedInv,
                            quests: mergedQuests,
                            lastDailyBonusClaimed: mergedDaily,
                            lastWeeklyBonusClaimed: mergedWeekly
                        };
                    }
                } catch (error) {
                    console.error('Failed to load from Supabase:', error);
                    // Do NOT set cloudLoaded to true
                }
            }

            // check daily refresh
            const today = new Date().toISOString().slice(0, 10);
            if (currentData.lastDailyRefresh !== today) {
                console.log("Refreshing Daily Rewards...");

                // If connected to Supabase, clear old rewards before generating new ones
                // Only if we actually connected successfully
                if (isSupabaseConfigured() && cloudLoaded) {
                    await clearAllCasinoRewards();
                }

                const newRewards = generateDailyRewards();
                currentData.casinoRewards = newRewards;
                currentData.lastDailyRefresh = today;
            }

            // Backfill/Sanity check if something went wrong and we have NO rewards
            if (!currentData.casinoRewards || currentData.casinoRewards.length === 0) {
                currentData.casinoRewards = generateDailyRewards();
                currentData.lastDailyRefresh = today;
            }

            setData(currentData);
            saveData(currentData); // Save to local


            // Quest Resets Logic
            const now = new Date();
            const wibDateStr = getWIBDateString(now);
            const startOfWeekWIB = getStartOfWeekWIB(now).getTime();

            const updatedQuests = (currentData.quests || []).map(q => {
                // Determine if we need to reset based on logic
                let shouldReset = false;

                if (q.type === 'daily' && q.recurrence === 'repeat') {
                    // If last completion was NOT today (WIB), reset.
                    // Even if it was never completed, we might want to ensure it's fresh?
                    // Actually, if it was never completed, lastCompletedAt is undefined.
                    // But if it has partial progress (currentValue > 0) from yesterday, we should reset it too!
                    // So we need to track "lastUpdated" or similar?
                    // Simplest heuristic: If `isCompleted` is true AND date is different -> Reset.
                    // If `currentValue > 0` AND date is different -> Reset.

                    // Current logic only looked at `lastCompletedAt`.
                    // If I did 2/4 yesterday, it won't have `lastCompletedAt`.
                    // So we need to rely on a "lastInteracted" or just assume if it's a new day, we wipe it?
                    // But we don't want to wipe it if the user just did it *today*.

                    // Issue: We don't track "lastResetDate" or "lastUpdatedDate" for quests generally.
                    // We only have `lastCompletedAt`.

                    // Fix: We must rely on `lastCompletedAt` for completion reset.
                    // For partial progress reset, we lack data.
                    // However, the user complaint is "didn't reset to 0".
                    // Assuming they COMPLETED it yesterday, it says "Claimed" or similar?
                    // Or they had partial progress?
                    // "Manually set to 0" implies partial or full completion stuck.

                    if (q.lastCompletedAt) {
                        const lastCompleted = new Date(q.lastCompletedAt);
                        const lastCompletedWIBStr = getWIBDateString(lastCompleted);
                        if (lastCompletedWIBStr !== wibDateStr) {
                            shouldReset = true;
                        }
                    } else if (q.currentValue > 0) {
                        // If we have progress but no completion date, it's ambiguous.
                        // BUT, if it's a daily quest, progress from "yesterday" shouldn't count today.
                        // With no timestamp, safe to reset?
                        // Maybe we add `lastUpdated`. For now, let's aggressively reset daily quests on load
                        // if we can't prove they were done today.
                        // But that wipes progress if they refresh the page mid-day! 
                        // Wait, `loadData` is called on refresh.

                        // We need a stable "lastResetDate" in AppData to know if we already processed the daily reset logic for TODAY.
                        // We do have `lastDailyRefresh`!

                        if (currentData.lastDailyRefresh !== wibDateStr) {
                            shouldReset = true;
                        }
                    }
                }

                if (q.type === 'weekly' && q.recurrence === 'repeat') {
                    if (q.lastCompletedAt) {
                        const lastCompleted = new Date(q.lastCompletedAt);
                        const lastCompletedWIB = getWIBDate(lastCompleted);
                        if (lastCompletedWIB.getTime() < startOfWeekWIB) {
                            shouldReset = true;
                        }
                    }
                    if (currentData.lastDailyRefresh !== wibDateStr) {
                        // Check if this specific reset is a Weekly reset boundary?
                        // Too complex to rely on lastDailyRefresh for Weekly partials without more state.
                        // Let's stick to completing reset.
                    }
                }

                if (shouldReset) {
                    return { ...q, isCompleted: false, currentValue: 0 };
                }
                return q;
            });

            // Check Daily Bonus Reset
            // If we claimed it "Before Today", we reset the claim status?
            // Wait, we just store "lastDailyBonusClaimed" date string (ISO).
            // If it's not today's date (WIB wise), then we can claim again.
            // We don't need to "reset" a boolean, we just check the date against today.

            if (JSON.stringify(updatedQuests) !== JSON.stringify(currentData.quests)) {
                currentData.quests = updatedQuests;
            }

            setData(currentData);
            saveData(currentData); // Save to local

            // Mark initialization as complete
            hasInitializedRef.current = true;
            setIsLoading(false);

            // If we updated daily rewards or quests, sync to Supabase (if connected)
            if (isSupabaseConfigured() && cloudLoaded) {
                // simple sync
                syncDataToSupabase(currentData);
            } else if (isSupabaseConfigured() && !cloudLoaded) {
                console.warn("Skipping initial sync to Supabase because cloud data was not loaded successfully.");
            }
        }
        initData();
    }, []);

    // Periodic Check for Day Change (Midnight Reset while app is open)
    useEffect(() => {
        const checkDayChange = async () => {
            const todayWIB = getWIBDateString();
            // Use function updater to access latest state
            setData(prev => {
                if (prev.lastDailyRefresh !== todayWIB) {
                    console.log("Midnight detected! Running reset logic...");

                    // 1. Generate new rewards
                    // (Optional: we could do this async outside, but for state consistency we do it here or trigger a reload)
                    // Let's keep it simple: Just update the `lastDailyRefresh` marker and generic resets.
                    // The actual `generateDailyRewards` call happened in the INIT effect. 
                    // We need to duplicate that logic or extract it.

                    // Let's extract simple reset logic here for "live" updates.

                    const newRewards = generateDailyRewards();

                    // 2. Reset Quests
                    const updatedQuests = (prev.quests || []).map(q => {
                        let shouldReset = false;
                        if (q.type === 'daily' && q.recurrence === 'repeat') shouldReset = true;
                        if (q.type === 'weekly' && q.recurrence === 'repeat') {
                            const now = new Date();
                            const startOfWeekWIB = getStartOfWeekWIB(now).getTime();
                            // If we just crossed into a new week? 
                            // Simplify: Just check completion date vs new week start
                            if (q.lastCompletedAt) {
                                const lastCompleted = new Date(q.lastCompletedAt);
                                const lastCompletedWIB = getWIBDate(lastCompleted);
                                if (lastCompletedWIB.getTime() < startOfWeekWIB) shouldReset = true;
                            }
                        }

                        if (shouldReset) {
                            return { ...q, isCompleted: false, currentValue: 0 };
                        }
                        return q;
                    });

                    // Side effects (Supabase) need to happen. 
                    // But we are inside setState. 
                    // We'll trust the `useEffect[data]` saver and syncers.
                    // Ideally we should explicitly sync resets to Supabase?
                    // The existing `useEffect` syncs `currentPoints`, `selectedCharacter`, etc. 
                    // But `quests` are only synced on specific actions usually.
                    // Let's rely on the user refreshing eventually or add a specific sync effect if needed.
                    // For now, saving to local processing is priority.

                    return {
                        ...prev,
                        lastDailyRefresh: todayWIB,
                        casinoRewards: newRewards,
                        quests: updatedQuests
                    };
                }
                return prev;
            });
        };

        const interval = setInterval(checkDayChange, 60000); // Check every minute
        return () => clearInterval(interval);
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


            // Backfill Shop Items Tiers
            if (prev.shopItems) {
                const updatedShopItems = prev.shopItems.map(item => ({
                    ...item,
                    tier: item.tier || 4
                }));
                // Check if any changed
                const hasChanges = JSON.stringify(updatedShopItems) !== JSON.stringify(prev.shopItems);
                if (hasChanges) {
                    updates.shopItems = updatedShopItems;
                }
            }

            // Cleanup / Backfill Inventory Types
            if (prev.inventory) {
                // Remove items that are known to be shop items
                const shopItemIds = new Set((prev.shopItems || []).map(s => s.id));

                const updatedInventory = prev.inventory
                    .filter(item => !shopItemIds.has(item.rewardId)) // Remove Shop Items
                    .map(item => {
                        if (item.type) return item;
                        // Infer type (fallback)
                        const isCharacter = item.image.startsWith('/tier');
                        return {
                            ...item,
                            type: isCharacter ? 'character' : 'shop_item'
                        } as InventoryItem;
                    })
                    // Double check: if inference said shop_item, we might want to keep it if it wasn't caught by ID check?
                    // User said "locker should only contain characters".
                    // If we inferred it as shop_item, we should probably hide it too?
                    // But 'shop_item' inference is weak (based on Not /tier). 
                    // Let's stick to the ID check primarily for DELETION to be safe, 
                    // but we can trust the ID check because we loaded shop items.
                    ;

                if (JSON.stringify(updatedInventory) !== JSON.stringify(prev.inventory)) {
                    updates.inventory = updatedInventory;
                }
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

    // Sync selected character to cloud
    useEffect(() => {
        if (!hasInitializedRef.current) return;
        if (isSupabaseConfigured()) {
            updateUserData({ selected_character_id: data.selectedCharacterId });
        }
    }, [data.selectedCharacterId]);

    // Sync daily refresh date to cloud
    useEffect(() => {
        if (!hasInitializedRef.current) return;
        if (isSupabaseConfigured()) {
            updateUserData({ last_daily_refresh: data.lastDailyRefresh });
        }
    }, [data.lastDailyRefresh]);

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
    const addShopItem = useCallback(async (item: Omit<ShopItem, 'id'>) => {
        const newItem = { ...item, id: generateId() };
        setData(prev => ({
            ...prev,
            shopItems: [...prev.shopItems, newItem],
        }));
        if (isSupabaseConfigured()) {
            return await saveShopItemToSupabase(newItem);
        }
        return true;
    }, []);

    const updateShopItem = useCallback(async (id: string, updates: Partial<ShopItem>) => {
        setData(prev => {
            const updated = prev.shopItems.map(i => (i.id === id ? { ...i, ...updates } : i));
            return { ...prev, shopItems: updated };
        });

        const item = data.shopItems.find(i => i.id === id);
        if (item && isSupabaseConfigured()) {
            return await saveShopItemToSupabase({ ...item, ...updates });
        }
        return true;
    }, [data.shopItems]);

    const deleteShopItem = useCallback(async (id: string) => {
        setData(prev => ({
            ...prev,
            shopItems: prev.shopItems.filter(i => i.id !== id),
        }));
        if (isSupabaseConfigured()) {
            return await deleteShopItemFromSupabase(id);
        }
        return true;
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
            type: 'character',
            acquiredAt: new Date().toISOString(),
            auraColors: rewardDef.auraColors
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
            // Shop Items are ephemeral / consumable, do not save to inventory
            // saveInventoryItemToSupabase(newInventoryItem); 
        }

        setData(prev => ({
            ...prev,
            currentPoints: prev.currentPoints - GACHA_COST,
            casinoHistory: [historyEntry, ...prev.casinoHistory],
            // inventory: [newInventoryItem, ...prev.inventory], // Do not add to inventory
            logs: [...(prev.logs || []), newLog],
        }));

        return { reward: newInventoryItem, won: true, tier: rewardDef.tier };
    }, [data.casinoRewards, data.currentPoints]);

    const playShopGacha = useCallback((): { reward: InventoryItem; won: boolean; tier: number } | null => {
        const cost = 500; // Updated to 500 as per request
        if (data.currentPoints < cost) return null;

        // Probabilities (Same as Casino)
        // Tier 2: 13%
        // Tier 3: 37%
        // Tier 4: 50%
        const roll = Math.random() * 100;
        let tier = 4;
        if (roll < 13) tier = 2;
        else if (roll < 50) tier = 3;
        else tier = 4;

        // Find shop items of this tier
        const possibleRewards = data.shopItems.filter(r => (r.tier || 4) === tier);

        let rewardDef: ShopItem;
        if (possibleRewards.length === 0) {
            // Fallback
            const lowerRewards = data.shopItems.filter(r => (r.tier || 4) >= tier);
            if (lowerRewards.length > 0) {
                rewardDef = lowerRewards[Math.floor(Math.random() * lowerRewards.length)];
            } else {
                if (data.shopItems.length === 0) return null;
                rewardDef = data.shopItems[Math.floor(Math.random() * data.shopItems.length)];
            }
        } else {
            rewardDef = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
        }

        const newInventoryItem: InventoryItem = {
            id: generateId(),
            rewardId: rewardDef.id,
            name: rewardDef.name,
            image: rewardDef.image,
            tier: rewardDef.tier || 4,
            type: 'shop_item',
            acquiredAt: new Date().toISOString()
        };

        const historyEntry: CasinoGameHistory = { // Reusing CasinoGameHistory type or create a new ShopHistory? 
            // The type definitions might limit 'game' to 'dice' | 'gacha'. 
            // Let's reuse 'gacha' but maybe message indicates it's Shop.
            id: generateId(),
            game: 'gacha',
            cost: cost,
            won: true,
            rewardId: rewardDef.id,
            rewardName: rewardDef.name,
            timestamp: new Date().toISOString(),
        };

        const newLog: LogEntry = {
            id: generateId(),
            message: `🛍️ Shop Gacha: Won ${rewardDef.image} ${rewardDef.name} (Tier ${rewardDef.tier || 4})`,
            timestamp: new Date().toISOString(),
            type: 'purchase', // Or 'casino', but it's a shop spending
            pointsChange: -cost,
        };

        if (isSupabaseConfigured()) {
            addCasinoGameHistory(historyEntry); // Logging to casino history for now as "Gacha"
            addLogEntry(newLog);
            // Shop Items are ephemeral / consumable, do not save to inventory
            // saveInventoryItemToSupabase(newInventoryItem);
        }

        setData(prev => ({
            ...prev,
            currentPoints: prev.currentPoints - cost,
            casinoHistory: [historyEntry, ...prev.casinoHistory], // Unified history
            // inventory: [newInventoryItem, ...prev.inventory], // Do not add to inventory
            logs: [...(prev.logs || []), newLog],
        }));

        return { reward: newInventoryItem, won: true, tier: rewardDef.tier || 4 };
    }, [data.shopItems, data.currentPoints]);

    const tradeUp = useCallback((targetTier: number): { success: boolean; message: string; newItem?: InventoryItem } => {
        // Trade Logic:
        // 6 T4 -> 1 T3
        // 12 T3 -> 1 T2
        // 20 T2 -> 1 T1

        let requiredCount = 0;
        let sourceTier = targetTier + 1;

        if (targetTier === 3) requiredCount = 6; // uses T4
        else if (targetTier === 2) requiredCount = 12; // uses T3
        else if (targetTier === 1) requiredCount = 20; // uses T2
        else return { success: false, message: "Invalid target tier" };

        const sourceItems = data.inventory.filter(i => i.tier === sourceTier && i.type === 'character');
        if (sourceItems.length < requiredCount) {
            return { success: false, message: `Not enough Tier ${sourceTier} items. Need ${requiredCount}, have ${sourceItems.length}.` };
        }

        // Check if target tier image pool exists
        const tierKey = `t${targetTier}` as keyof typeof TIER_IMAGES;
        const systemPool = TIER_IMAGES[tierKey] || [];

        // Also get custom rewards for this tier
        const customPool = data.casinoRewards.filter(r => r.tier === targetTier);

        if (systemPool.length === 0 && customPool.length === 0) {
            return { success: false, message: `No items configured for Tier ${targetTier}.` };
        }

        // Consume items (randomly pick N items to remove)
        const itemsToRemove = sourceItems.slice(0, requiredCount);
        const itemIdsToRemove = new Set(itemsToRemove.map(i => i.id));

        // Generate new item from FULL POOL (System + Custom)
        const combinedPool = [
            ...systemPool.map(img => ({ type: 'system', data: img })),
            ...customPool.map(rew => ({ type: 'custom', data: rew }))
        ];

        const selection = combinedPool[Math.floor(Math.random() * combinedPool.length)];

        let newItem: InventoryItem;

        if (selection.type === 'custom') {
            const reward = selection.data as CasinoReward;
            newItem = {
                id: generateId(),
                rewardId: reward.id,
                name: reward.name,
                image: reward.image,
                tier: targetTier,
                type: 'character',
                acquiredAt: new Date().toISOString(),
                auraColors: reward.auraColors
            };
        } else {
            // System item
            const imagePath = selection.data as string;
            const randomName = extractNameFromPath(imagePath);
            const adHocRewardId = generateId();

            newItem = {
                id: generateId(),
                rewardId: adHocRewardId,
                name: randomName,
                image: imagePath,
                tier: targetTier,
                type: 'character',
                acquiredAt: new Date().toISOString()
            };
        }

        const newLog: LogEntry = {
            id: generateId(),
            message: `🔄 Trade-Up: Traded ${requiredCount} Tier ${sourceTier} for ${newItem.image} ${newItem.name} (Tier ${targetTier})`,
            timestamp: new Date().toISOString(),
            type: 'trade_up',
        };

        if (isSupabaseConfigured()) {
            addLogEntry(newLog);
            itemsToRemove.forEach(item => deleteInventoryItemFromSupabase(item.id));
            saveInventoryItemToSupabase(newItem);
        }

        setData(prev => ({
            ...prev,
            inventory: [...prev.inventory.filter(i => !itemIdsToRemove.has(i.id)), newItem],
            logs: [...(prev.logs || []), newLog],
        }));

        return { success: true, message: `Successfully traded up for ${newItem.name}!`, newItem };
    }, [data.inventory, data.casinoRewards]);


    // Quest Functions
    const addQuest = useCallback((quest: Omit<Quest, 'id' | 'isCompleted'>) => {
        const newQuest: Quest = {
            ...quest,
            id: generateId(),
            isCompleted: false,
            currentValue: 0,
            targetValue: quest.targetValue || 1, // Ensure defaults
            unit: quest.unit || 'times'
        };
        setData(prev => ({
            ...prev,
            quests: [...(prev.quests || []), newQuest]
        }));
        if (isSupabaseConfigured()) {
            saveQuest(newQuest);
        }
    }, []);

    const updateQuest = useCallback((id: string, updates: Partial<Quest>) => {
        setData(prev => ({
            ...prev,
            quests: (prev.quests || []).map(q => q.id === id ? { ...q, ...updates } : q)
        }));

        const quest = data.quests.find(q => q.id === id);
        if (quest && isSupabaseConfigured()) {
            saveQuest({ ...quest, ...updates });
        }
    }, [data.quests]);

    const deleteQuest = useCallback((id: string) => {
        setData(prev => ({
            ...prev,
            quests: (prev.quests || []).filter(q => q.id !== id)
        }));
        if (isSupabaseConfigured()) {
            deleteQuestFromSupabase(id);
        }
    }, []);

    const updateQuestProgress = useCallback((id: string, newValue: number) => {
        setData(prev => {
            const quest = prev.quests.find(q => q.id === id);
            if (!quest) return prev;

            const target = quest.targetValue || 1;

            // Check previous state
            const wasCompleted = quest.isCompleted;
            const isNowCompleted = newValue >= target;

            // Only update points if completion status CHANGES
            let pointsChange = 0;
            if (!wasCompleted && isNowCompleted) {
                pointsChange = quest.points;
            } else if (wasCompleted && !isNowCompleted) {
                pointsChange = -quest.points;
            }

            // Update quest
            const updatedQuests = prev.quests.map(q =>
                q.id === id
                    ? {
                        ...q,
                        currentValue: newValue,
                        isCompleted: isNowCompleted,
                        lastCompletedAt: isNowCompleted ? new Date().toISOString() : (wasCompleted ? undefined : q.lastCompletedAt)
                    }
                    : q
            );

            // Log if status changed
            let newLogs = [...(prev.logs || [])];
            if (pointsChange !== 0) {
                const newLog: LogEntry = {
                    id: generateId(),
                    message: `${pointsChange > 0 ? 'Completed' : 'Undo'}: Quest "${quest.title}"`,
                    timestamp: new Date().toISOString(),
                    type: 'activity',
                    pointsChange: pointsChange
                };
                newLogs.push(newLog);
            }

            return {
                ...prev,
                quests: updatedQuests,
                currentPoints: prev.currentPoints + pointsChange,
                logs: newLogs
            };
        });

        // Use a heuristic or separate effect? 
        // We can't easily access the "new state" here derived from "prev".
        // BUT, since we computed the new state logic deterministically above, we can replicate for Supabase sync.
        // OR simpler: wait for effect? No.

        // Actually, let's just fetch it from the calculation.
        // Re-calculate simply for the sync:
        const quest = data.quests.find(q => q.id === id);
        if (quest && isSupabaseConfigured()) {
            // Logic duplication is risky. Better:
            // Construct the "next" value as we did inside set state?
            // Since updateQuestProgress is closure, we can't see the *just* updated value easily if we rely on `prev`.

            // BUT, `newValue` is passed in!
            // So we know the new `currentValue`. 
            // We know the target.
            const target = quest.targetValue || 1;
            const isNowCompleted = newValue >= target;
            const lastCompletedAt = isNowCompleted ? new Date().toISOString() : (quest.isCompleted ? quest.lastCompletedAt : undefined);

            saveQuest({
                ...quest,
                currentValue: newValue,
                isCompleted: isNowCompleted,
                lastCompletedAt: lastCompletedAt
            });
        }
    }, [data.quests]);



    const claimDailyBonus = useCallback(() => {
        setData(prev => {
            const todayWIB = getWIBDateString(new Date());

            // Double check validation
            if (prev.lastDailyBonusClaimed === todayWIB) return prev;

            const bonusPoints = 500;

            const newLog: LogEntry = {
                id: generateId(),
                message: `🌟 Claimed Daily Quest Bonus!`,
                timestamp: new Date().toISOString(),
                type: 'activity',
                pointsChange: bonusPoints
            };

            if (isSupabaseConfigured()) {
                saveBonusClaims(todayWIB, prev.lastWeeklyBonusClaimed);
            }

            return {
                ...prev,
                lastDailyBonusClaimed: todayWIB,
                currentPoints: prev.currentPoints + bonusPoints,
                logs: [...(prev.logs || []), newLog]
            };
        });
    }, []);

    const claimWeeklyBonus = useCallback(() => {
        setData(prev => {
            const now = new Date();
            const startOfWeekWIB = getStartOfWeekWIB(now); // This returns Date
            const weekId = startOfWeekWIB.toISOString().split('T')[0]; // Use start of week date as ID

            if (prev.lastWeeklyBonusClaimed === weekId) return prev;

            const bonusPoints = 1000;

            const newLog: LogEntry = {
                id: generateId(),
                message: `🔥 Claimed Weekly Quest Bonus!`,
                timestamp: new Date().toISOString(),
                type: 'activity',
                pointsChange: bonusPoints
            };

            if (isSupabaseConfigured()) {
                saveBonusClaims(prev.lastDailyBonusClaimed, weekId);
            }

            return {
                ...prev,
                lastWeeklyBonusClaimed: weekId,
                currentPoints: prev.currentPoints + bonusPoints,
                logs: [...(prev.logs || []), newLog]
            };
        });
    }, []);

    const logQuestPenalty = useCallback((questId: string) => {
        setData(prev => {
            const quest = prev.quests.find(q => q.id === questId);
            if (!quest) return prev;

            const penalty = -50;

            const newLog: LogEntry = {
                id: generateId(),
                message: `⚠️ Quest Forgot/Penalty: "${quest.title}"`,
                timestamp: new Date().toISOString(),
                type: 'activity',
                pointsChange: penalty
            };

            return {
                ...prev,
                currentPoints: prev.currentPoints + penalty,
                logs: [...(prev.logs || []), newLog]
            };
        });
    }, []);

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
                selectedCharacterId: parsed.selectedCharacterId || null,
                quests: parsed.quests || [],
                lastDailyBonusClaimed: parsed.lastDailyBonusClaimed || null,
                lastWeeklyBonusClaimed: parsed.lastWeeklyBonusClaimed || null,
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
                playShopGacha,
                tradeUp,
                addQuest,
                updateQuest,
                deleteQuest,
                updateQuestProgress,
                claimDailyBonus,
                claimWeeklyBonus,
                logQuestPenalty,
                exportData,
                importData,
                setData,
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

import { createClient } from '@supabase/supabase-js';
import type { AppData, Activity, ShopItem, TimelineEntry, LogEntry, CasinoReward, CasinoGameHistory, Quest } from './store';

// Supabase configuration
// Replace these with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client (only if credentials are provided)
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
    return supabase !== null;
};

// Default user ID for non-authenticated usage
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

// Fetch all data from Supabase
export async function fetchDataFromSupabase(): Promise<AppData | null> {
    if (!supabase) return null;

    try {
        const [activitiesRes, shopItemsRes, timelineRes, userDataRes, purchaseRes, logsRes, casinoRewardsRes, casinoHistoryRes, inventoryRes, questsRes] = await Promise.all([
            supabase.from('activities').select('*'),
            supabase.from('shop_items').select('*'),
            supabase.from('timeline_entries').select('*'),
            supabase.from('user_data').select('*').eq('user_id', DEFAULT_USER_ID).single(),
            supabase.from('purchase_history').select('*'),
            supabase.from('logs').select('*').order('created_at', { ascending: true }),
            supabase.from('casino_rewards').select('*'),
            supabase.from('casino_history').select('*').order('created_at', { ascending: false }),
            supabase.from('inventory').select('*').order('acquired_at', { ascending: false }),
            supabase.from('quests').select('*'),
        ]);

        const activities: Activity[] = (activitiesRes.data || []).map(a => ({
            id: a.id,
            name: a.name,
            type: a.type as 'reward' | 'punishment',
            points: a.points,
            isVisible: a.is_visible,
        }));

        const shopItems: ShopItem[] = (shopItemsRes.data || []).map(s => ({
            id: s.id,
            name: s.name,
            image: s.image,
            price: s.price,
        }));

        const timelineEntries: TimelineEntry[] = (timelineRes.data || []).map(t => ({
            id: t.id,
            type: t.type as 'planning' | 'auditing',
            timeSlot: t.time_slot,
            description: t.description,
            date: t.date,
        }));

        const logs: LogEntry[] = (logsRes.data || []).map(l => ({
            id: l.id,
            message: l.message,
            timestamp: l.created_at,
            type: l.type as LogEntry['type'],
            pointsChange: l.points_change,
        }));

        const purchaseHistory = (purchaseRes.data || []).map(p => ({
            itemId: p.item_id,
            itemName: p.item_name,
            price: p.price,
            date: p.purchased_at,
        }));

        const casinoRewards: CasinoReward[] = (casinoRewardsRes.data || []).map(c => ({
            id: c.id,
            name: c.name,
            image: c.image,
            tier: c.tier || 4, // Default to 4 (Common) if missing
            minRoll: c.min_roll,
            cost: c.cost || 1,
            description: c.description,
        }));

        const casinoHistory: CasinoGameHistory[] = (casinoHistoryRes.data || []).map(h => ({
            id: h.id,
            game: h.game as 'dice',
            dice1: h.dice1 || h.roll || 1,
            dice2: h.dice2 || 1,
            total: h.total || h.roll || 2,
            cost: h.cost,
            won: h.won,
            rewardId: h.reward_id,
            rewardName: h.reward_name,
            timestamp: h.created_at,
        }));

        const inventory: any[] = (inventoryRes.data || []).map(i => ({
            id: i.id,
            rewardId: i.reward_id,
            name: i.name,
            image: i.image,
            tier: i.tier,
            acquiredAt: i.acquired_at,
        }));

        const quests: any[] = (questsRes.data || []).map(q => ({
            id: q.id,
            title: q.title,
            description: q.description,
            points: q.points,
            type: q.type,
            recurrence: q.recurrence,
            isCompleted: q.is_completed,
            lastCompletedAt: q.last_completed_at,
            targetValue: q.target_value,
            currentValue: q.current_value,
            unit: q.unit,
            daysOfWeek: q.days_of_week
        }));

        return {
            activities,
            shopItems,
            timelineEntries,
            currentPoints: userDataRes.data?.current_points || 0,
            purchaseHistory,
            logs,
            casinoRewards,
            casinoHistory,
            inventory,
            quests,
            selectedCharacterId: userDataRes.data?.selected_character_id || null,
            lastDailyBonusClaimed: userDataRes.data?.last_daily_bonus_claimed || null,
            lastWeeklyBonusClaimed: userDataRes.data?.last_weekly_bonus_claimed || null,
        };
    } catch (error) {
        console.error('Error fetching data from Supabase:', error);
        return null;
    }
}


// Save activity to Supabase
export async function saveActivity(activity: Activity): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('activities').upsert({
        id: activity.id,
        user_id: DEFAULT_USER_ID,
        name: activity.name,
        type: activity.type,
        points: activity.points,
        is_visible: activity.isVisible,
    });

    return !error;
}

// Delete activity from Supabase
export async function deleteActivityFromSupabase(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('activities').delete().eq('id', id);
    return !error;
}

// Save shop item to Supabase
export async function saveShopItem(item: ShopItem): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('shop_items').upsert({
        id: item.id,
        user_id: DEFAULT_USER_ID,
        name: item.name,
        image: item.image,
        price: item.price,
    });

    return !error;
}

// Delete shop item from Supabase
export async function deleteShopItemFromSupabase(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('shop_items').delete().eq('id', id);
    return !error;
}

// Save timeline entry to Supabase
export async function saveTimelineEntry(entry: TimelineEntry): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('timeline_entries').upsert({
        id: entry.id,
        user_id: DEFAULT_USER_ID,
        type: entry.type,
        time_slot: entry.timeSlot,
        description: entry.description,
        date: entry.date,
    });

    return !error;
}

// Delete timeline entry from Supabase
export async function deleteTimelineEntryFromSupabase(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('timeline_entries').delete().eq('id', id);
    return !error;
}

// Update user points in Supabase
export async function updateUserPoints(points: number): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('user_data').upsert({
        user_id: DEFAULT_USER_ID,
        current_points: points,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return !error;
}

// Update user bonus claims in Supabase
export async function saveBonusClaims(daily: string | null, weekly: string | null): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('user_data').update({
        last_daily_bonus_claimed: daily,
        last_weekly_bonus_claimed: weekly,
        updated_at: new Date().toISOString(),
    }).eq('user_id', DEFAULT_USER_ID);

    return !error;
}

// Add log entry to Supabase
export async function addLogEntry(log: LogEntry): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('logs').insert({
        id: log.id,
        user_id: DEFAULT_USER_ID,
        message: log.message,
        type: log.type,
        points_change: log.pointsChange,
    });

    return !error;
}

// Add purchase history entry to Supabase
export async function addPurchaseHistory(purchase: { itemId: string; itemName: string; price: number; date: string }): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('purchase_history').insert({
        user_id: DEFAULT_USER_ID,
        item_id: purchase.itemId,
        item_name: purchase.itemName,
        price: purchase.price,
        purchased_at: purchase.date,
    });

    return !error;
}

// Sync all local data to Supabase
export async function syncDataToSupabase(data: AppData): Promise<boolean> {
    if (!supabase) return false;

    try {
        // Sync activities
        for (const activity of data.activities) {
            await saveActivity(activity);
        }

        // Sync shop items
        for (const item of data.shopItems) {
            await saveShopItem(item);
        }

        // Sync timeline entries
        for (const entry of data.timelineEntries) {
            await saveTimelineEntry(entry);
        }

        // Sync casino rewards
        for (const reward of data.casinoRewards) {
            await saveCasinoReward(reward);
        }

        // Sync inventory (using saveInventoryItem)
        if (data.inventory) {
            for (const item of data.inventory) {
                await saveInventoryItem(item);
            }
        }

        // Sync quests
        if (data.quests) {
            for (const quest of data.quests) {
                await saveQuest(quest);
            }
        }

        // Update points
        await updateUserPoints(data.currentPoints);

        return true;
    } catch (error) {
        console.error('Error syncing to Supabase:', error);
        return false;
    }
}

// Save casino reward to Supabase
export async function saveCasinoReward(reward: CasinoReward): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('casino_rewards').upsert({
        id: reward.id,
        user_id: DEFAULT_USER_ID,
        name: reward.name,
        image: reward.image,
        min_roll: reward.minRoll,
        cost: reward.cost,
        description: reward.description,
    });

    return !error;
}

// Delete casino reward from Supabase
export async function deleteCasinoRewardFromSupabase(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('casino_rewards').delete().eq('id', id);
    return !error;
}

// Add casino game history entry to Supabase
export async function addCasinoGameHistory(history: CasinoGameHistory): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('casino_history').insert({
        id: history.id,
        user_id: DEFAULT_USER_ID,
        game: history.game,
        dice1: history.dice1,
        dice2: history.dice2,
        total: history.total,
        cost: history.cost,
        won: history.won,
        reward_id: history.rewardId,
        reward_name: history.rewardName,
    });

    return !error;
}

// Save inventory item to Supabase
export async function saveInventoryItem(item: any): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('inventory').upsert({
        id: item.id,
        user_id: DEFAULT_USER_ID,
        reward_id: item.rewardId,
        name: item.name,
        image: item.image,
        tier: item.tier,
        acquired_at: item.acquiredAt,
    });

    return !error;
}

// Delete inventory item from Supabase
export async function deleteInventoryItemFromSupabase(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('inventory').delete().eq('id', id);
    return !error;
}

// Save quest to Supabase
export async function saveQuest(quest: Quest): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('quests').upsert({
        id: quest.id,
        user_id: DEFAULT_USER_ID,
        title: quest.title,
        description: quest.description,
        points: quest.points,
        type: quest.type,
        recurrence: quest.recurrence,
        is_completed: quest.isCompleted,
        last_completed_at: quest.lastCompletedAt,
        target_value: quest.targetValue,
        current_value: quest.currentValue,
        unit: quest.unit,
        days_of_week: quest.daysOfWeek
    });

    return !error;
}

// Delete quest from Supabase
export async function deleteQuestFromSupabase(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase.from('quests').delete().eq('id', id);
    return !error;
}


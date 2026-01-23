import { useState, useEffect } from 'react';
import { CheckCircle2, Gift, Plus, Minus, Clock } from 'lucide-react';
import { useData } from './DataContext';
import type { Quest } from './store';

export function Quests() {
    const { data, updateQuestProgress, claimDailyBonus } = useData();
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

    // Group quests
    const todayWIB = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 7));
    const todayIndex = todayWIB.getDay(); // 0-6

    const dailyQuests = (data.quests || []).filter(q => {
        if (q.type !== 'daily') return false;
        // Check days filter
        if (q.daysOfWeek && q.daysOfWeek.length > 0 && !q.daysOfWeek.includes(todayIndex)) {
            return false;
        }
        return true;
    });

    const weeklyQuests = (data.quests || []).filter(q => q.type === 'weekly');

    const questsToShow = activeTab === 'daily' ? dailyQuests : weeklyQuests;

    // Daily Bonus Logic
    const dailyQuestsForBonus = dailyQuests.filter(q => q.recurrence === 'repeat');
    const completedDailyCount = dailyQuestsForBonus.filter(q => q.isCompleted).length;
    const totalDailyCount = dailyQuestsForBonus.length;

    // Check if bonus is available
    const todayWIBString = todayWIB.toISOString().split('T')[0];
    const isBonusClaimed = data.lastDailyBonusClaimed === todayWIBString;
    const canClaimBonus = totalDailyCount > 0 && completedDailyCount === totalDailyCount && !isBonusClaimed;

    // Reset Countdown
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const wibOffset = 7 * 60 * 60 * 1000;
            const nowUTC = now.getTime() + (now.getTimezoneOffset() * 60000);
            const nowWIB = new Date(nowUTC + wibOffset);

            let target = new Date(nowWIB);
            target.setHours(24, 0, 0, 0); // Next midnight WIB

            if (activeTab === 'weekly') {
                // Find next Monday
                const day = nowWIB.getDay(); // 0 (Sun) - 6 (Sat)
                const daysUntilMonday = day === 0 ? 1 : 8 - day;
                target.setDate(target.getDate() + daysUntilMonday - 1); // -1 because we already set to "tomorrow" midnight effectively?
                // Logic: 
                // If Monday (1), next reset is NEXT Monday. (7 days)
                // If Sunday (0), next reset is Tomorrow (Monday).

                // Let's reset target to *current day* midnight first
                target = new Date(nowWIB);
                target.setHours(24, 0, 0, 0);

                const daysToAdd = (1 + 7 - nowWIB.getDay()) % 7;
                // If today is Monday (1), daysToAdd = 7.
                // If today is Sunday (0), daysToAdd = 1.
                target.setDate(target.getDate() + daysToAdd - 1); // target is already "tomorrow 00:00", so -1?

                // Simpler:
                // Target is Monday 00:00.
                // If now is Mon 00:01, Target is Next Mon 00:00.
            }

            const diff = target.getTime() - nowWIB.getTime();

            // Format HH:MM:SS (or Dd HH:mm)
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (activeTab === 'weekly') {
                setTimeLeft(`${days}d ${hours}h ${minutes}m`);
            } else {
                setTimeLeft(`${hours}h ${minutes}m`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [activeTab]);


    const handleProgress = (quest: Quest, delta: number) => {
        const target = quest.targetValue || 1;
        const current = quest.currentValue || 0;
        let next = current + delta;
        // Clamp 0 to Target? Or allow overflow? 
        // User reference shows "28300 / 58000", so exact values.
        // Let's clamp 0 as min.
        if (next < 0) next = 0;

        // If checkbox style (target=1), strict toggle
        if (target === 1) {
            next = delta > 0 ? 1 : 0;
        }

        updateQuestProgress(quest.id, next);
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-black/20 rounded-lg w-fit mx-auto">
                <button
                    onClick={() => setActiveTab('daily')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'daily'
                        ? 'bg-[var(--color-primary)] text-white shadow-lg'
                        : 'text-[var(--color-text-muted)] hover:text-white'
                        }`}
                >
                    Daily
                </button>
                <button
                    onClick={() => setActiveTab('weekly')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'weekly'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-[var(--color-text-muted)] hover:text-white'
                        }`}
                >
                    Weekly
                </button>
            </div>

            {/* Daily Bonus Hero (Only on Daily Tab) */}
            {activeTab === 'daily' && (
                <div className="card bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-indigo-500/30">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Gift className="w-5 h-5 text-yellow-400" />
                            <span className="font-bold text-indigo-100">Daily Bonus</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isBonusClaimed ? 'bg-green-900/50 text-green-400' : 'bg-black/30 text-yellow-400'}`}>
                            {isBonusClaimed ? 'CLAIMED' : '+500 PTS'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 bg-black/40 h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-yellow-400 transition-all duration-500"
                                style={{ width: `${totalDailyCount > 0 ? (completedDailyCount / totalDailyCount) * 100 : 0}%` }}
                            />
                        </div>
                        <button
                            onClick={claimDailyBonus}
                            disabled={!canClaimBonus}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${canClaimBonus
                                ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20'
                                : 'bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed'
                                }`}
                        >
                            CLAIM
                        </button>
                    </div>
                    <p className="text-xs text-indigo-300 mt-2 text-center">
                        Complete all {totalDailyCount} daily quests to claim.
                    </p>
                </div>
            )}

            {/* Quest List */}
            <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-6 min-h-[400px]">
                <div className="flex justify-between items-end mb-6 border-b border-[#333] pb-4">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                        {activeTab === 'daily' ? 'Daily ' : 'Weekly '} Challenges
                    </h3>
                    <div className="text-xs font-mono text-gray-500 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Refreshes in: <span className="text-gray-300">{timeLeft}</span>
                    </div>
                </div>

                <div className="space-y-6">
                    {questsToShow.length === 0 ? (
                        <div className="text-center py-12 text-gray-600">
                            <p>No active challenges.</p>
                        </div>
                    ) : (
                        questsToShow.map(quest => {
                            const percent = Math.min(100, (quest.currentValue / quest.targetValue) * 100);
                            return (
                                <div key={quest.id} className="group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-bold text-sm ${quest.isCompleted ? 'text-green-400' : 'text-gray-200'}`}>
                                            {quest.title}
                                            {quest.description && <span className="text-xs font-normal text-gray-500 ml-2">- {quest.description}</span>}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {quest.isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                            <span className="text-yellow-400 font-bold text-xs">+{quest.points} 🪙</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="bg-black/50 h-2.5 rounded-full overflow-hidden mb-1 relative">
                                                <div
                                                    className={`h-full transition-all duration-300 ${quest.isCompleted ? 'bg-green-500' : 'bg-white'}`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] text-gray-500 font-mono uppercase">
                                                <span>Progress</span>
                                                <span className={quest.isCompleted ? 'text-green-500' : 'text-white'}>
                                                    {quest.currentValue} / {quest.targetValue} {quest.unit}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleProgress(quest, -1)}
                                                className="w-6 h-6 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-400"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleProgress(quest, 1)}
                                                className="w-6 h-6 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-white"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

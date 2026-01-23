import { useState, useMemo } from 'react';
import { BellOff, Clock, Power, PowerOff, X, ClipboardList, Search, ChevronLeft, ChevronRight, Plus, Minus, Gift, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTimer } from './TimerContext';
import { useData } from './DataContext';
import { PLANNING_POINTS, AUDITING_POINTS } from './store';

// Time slots for the timeline (every 3 hours)
const TIME_SLOTS = [
    { id: '00:00-03:00', label: '00:00', end: '03:00' },
    { id: '03:00-06:00', label: '03:00', end: '06:00' },
    { id: '06:00-09:00', label: '06:00', end: '09:00' },
    { id: '09:00-12:00', label: '09:00', end: '12:00' },
    { id: '12:00-15:00', label: '12:00', end: '15:00' },
    { id: '15:00-18:00', label: '15:00', end: '18:00' },
    { id: '18:00-21:00', label: '18:00', end: '21:00' },
    { id: '21:00-24:00', label: '21:00', end: '24:00' },
];

function getCurrentTimeSlot(): string {
    const now = new Date();
    const hour = now.getHours();
    const slotIndex = Math.floor(hour / 3);
    return TIME_SLOTS[slotIndex].id;
}

function getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTodayDateString(): string {
    return getLocalDateString(new Date());
}

function formatDateDisplay(dateStr: string): string {
    // Parse the date string as local date
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

function addDays(dateStr: string, daysToAdd: number): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + daysToAdd);
    return getLocalDateString(date);
}

interface ModalState {
    isOpen: boolean;
    type: 'planning' | 'auditing';
    timeSlot: string;
}

export function Dashboard() {
    const timer = useTimer();
    const { data, logActivity, addTimelineEntry, removeTimelineEntry, updateQuestProgress, claimDailyBonus, claimWeeklyBonus, logQuestPenalty } = useData();
    const [justLogged, setJustLogged] = useState<string | null>(null);
    const [modal, setModal] = useState<ModalState | null>(null);
    const [entryDescription, setEntryDescription] = useState('');

    // Separate selected dates for planning and auditing
    const [planningDate, setPlanningDate] = useState(getTodayDateString());
    const [auditingDate, setAuditingDate] = useState(getTodayDateString());
    const [expandedLogs, setExpandedLogs] = useState(false);
    const [questTab, setQuestTab] = useState<'daily' | 'weekly'>('daily');

    const visibleActivities = data.activities.filter(a => a.isVisible);
    // const rewards = visibleActivities.filter(a => a.type === 'reward'); // Replaced by Quests
    const punishments = visibleActivities.filter(a => a.type === 'punishment');

    const currentTimeSlot = getCurrentTimeSlot();
    const today = getTodayDateString();

    // Filter entries for selected dates
    const planningEntries = useMemo(() => {
        return data.timelineEntries.filter(e => e.date === planningDate && e.type === 'planning');
    }, [data.timelineEntries, planningDate]);

    const auditingEntries = useMemo(() => {
        return data.timelineEntries.filter(e => e.date === auditingDate && e.type === 'auditing');
    }, [data.timelineEntries, auditingDate]);

    const handleLogActivity = (id: string) => {
        logActivity(id);
        setJustLogged(id);
        setTimeout(() => setJustLogged(null), 1000);
    };

    const handleSlotClick = (type: 'planning' | 'auditing', timeSlot: string) => {
        setModal({ isOpen: true, type, timeSlot });
        setEntryDescription('');
    };

    const handleAddEntry = () => {
        if (!modal || !entryDescription.trim()) return;
        const date = modal.type === 'planning' ? planningDate : auditingDate;
        addTimelineEntry({
            type: modal.type,
            timeSlot: modal.timeSlot,
            description: entryDescription.trim(),
            date: date,
        });
        setModal(null);
        setEntryDescription('');
    };

    const handleRemoveEntry = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeTimelineEntry(id);
    };

    const renderTimelineColumn = (type: 'planning' | 'auditing') => {
        const isPlanning = type === 'planning';
        const selectedDate = isPlanning ? planningDate : auditingDate;
        const setSelectedDate = isPlanning ? setPlanningDate : setAuditingDate;
        const entries = isPlanning ? planningEntries : auditingEntries;
        const points = isPlanning ? PLANNING_POINTS : AUDITING_POINTS;
        const isToday = selectedDate === today;

        return (
            <div className="timeline-column">
                <div className={`timeline-header ${type}`}>
                    {isPlanning ? <ClipboardList className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                    {isPlanning ? 'PLANNING' : 'AUDITING'}
                    <span className="points-badge">+{points} pts</span>
                </div>

                {/* Date Navigation */}
                <div className="timeline-date-nav">
                    <button
                        className="timeline-nav-btn"
                        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                        title="Previous day"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="timeline-date-display">
                        <span className="timeline-date-text">{formatDateDisplay(selectedDate)}</span>
                        {!isToday && (
                            <button
                                className="timeline-today-btn"
                                onClick={() => setSelectedDate(today)}
                            >
                                Today
                            </button>
                        )}
                    </div>
                    <button
                        className="timeline-nav-btn"
                        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                        title="Next day"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="timeline-scroll">
                    {TIME_SLOTS.map(slot => {
                        const slotEntries = entries.filter(e => e.timeSlot === slot.id);
                        const isCurrent = slot.id === currentTimeSlot && isToday;

                        return (
                            <div key={slot.id} className={`timeline-slot ${isCurrent ? 'current' : ''}`}>
                                <div className="timeline-time">
                                    <span className="timeline-time-label">{slot.label}</span>
                                </div>
                                <div
                                    className="timeline-content"
                                    onClick={() => handleSlotClick(type, slot.id)}
                                >
                                    {slotEntries.map(entry => (
                                        <div key={entry.id} className={`timeline-entry ${type}`}>
                                            <span className="timeline-entry-text">{entry.description}</span>
                                            <button
                                                className="timeline-entry-delete"
                                                onClick={(e) => handleRemoveEntry(entry.id, e)}
                                                title="Remove entry"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Timer Status Card */}
            <div className={`card ${timer.isRinging ? 'animate-pulse-ring border-[var(--color-highlight)]' : ''}`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Timer Status
                    </h2>
                    <button
                        onClick={timer.isActive ? timer.stopTimer : timer.startTimer}
                        className={`btn ${timer.isActive ? 'btn-danger' : 'btn-success'} flex items-center gap-2`}
                    >
                        {timer.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        {timer.isActive ? 'Stop Timer' : 'Start Timer'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[var(--color-surface)] rounded-lg p-4">
                        <p className="text-[var(--color-text-muted)] text-sm mb-1">Status</p>
                        <p className={`text-lg font-medium ${timer.isRinging ? 'text-[var(--color-highlight)]' : timer.isResting ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
                            {timer.isRinging ? '🔔 RINGING!' : timer.isResting ? '😴 Resting...' : timer.isActive ? '✓ Active' : '○ Inactive'}
                        </p>
                    </div>
                    <div className="bg-[var(--color-surface)] rounded-lg p-4">
                        <p className="text-[var(--color-text-muted)] text-sm mb-1">Next Alarm</p>
                        <p className="text-lg font-medium">{timer.nextAlarmTime || 'N/A'}</p>
                    </div>
                    <div className="bg-[var(--color-surface)] rounded-lg p-4">
                        <p className="text-[var(--color-text-muted)] text-sm mb-1">Time Until</p>
                        <p className="text-lg font-medium">{timer.timeUntilNextAlarm || 'N/A'}</p>
                    </div>
                </div>

                {(timer.isRinging || timer.isResting) && (
                    <button
                        onClick={timer.stopAlarm}
                        className="btn btn-primary mt-4 w-full flex items-center justify-center gap-2"
                    >
                        <BellOff className="w-4 h-4" />
                        Stop Alarm Cycle
                    </button>
                )}
            </div>

            {/* Points Display */}
            <div className="card text-center">
                <p className="text-[var(--color-text-muted)] text-sm mb-2">Current Points</p>
                <p className={`text-5xl font-bold ${data.currentPoints >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-highlight)]'}`}>
                    {(data.currentPoints || 0).toFixed(2)}
                </p>
            </div>

            {/* Timeline Section */}
            <div className="timeline-wrapper">
                {renderTimelineColumn('planning')}
                {renderTimelineColumn('auditing')}
            </div>

            {/* Quick Log Activities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quests (formerly Rewards) */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--color-success)] flex items-center gap-2">
                            📜 Active Quests
                        </h3>
                        <div className="flex bg-[var(--color-bg-secondary)] rounded-lg p-1 gap-1">
                            <button
                                onClick={() => setQuestTab('daily')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${questTab === 'daily'
                                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                                    : 'text-[var(--color-text-muted)] hover:text-white'
                                    }`}
                            >
                                Daily
                            </button>
                            <button
                                onClick={() => setQuestTab('weekly')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${questTab === 'weekly'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'text-[var(--color-text-muted)] hover:text-white'
                                    }`}
                            >
                                Weekly
                            </button>
                        </div>
                    </div>

                    {/* Bonus Progress Card */}
                    {(() => {
                        const todayIndex = new Date().getDay();
                        const isDaily = questTab === 'daily';

                        // Filter Quests
                        const questsToShow = (data.quests || []).filter(q => {
                            if (q.type !== questTab) return false;
                            if (q.type === 'daily' && q.recurrence === 'repeat') {
                                if (q.daysOfWeek && q.daysOfWeek.length > 0 && !q.daysOfWeek.includes(todayIndex)) {
                                    return false;
                                }
                            }
                            return true;
                        });

                        // Bonus Calculations
                        const questsForBonus = questsToShow.filter(q => q.recurrence === 'repeat');
                        const completedCount = questsForBonus.filter(q => q.isCompleted).length;
                        const totalCount = questsForBonus.length;
                        const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                        // Claim Status
                        // Simple check: do we have the current day/week claimed?
                        // We duplicate WIB logic briefly here for UI consistency
                        const now = new Date();
                        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                        const wib = new Date(utc + (3600000 * 7));
                        const wibDateStr = wib.toISOString().split('T')[0];
                        
                        // Week start (Monday based for consistency with store?)
                        // getStartOfWeekWIB uses Monday as start if getDay() returns 1. 0 is Sun.
                        // Impl: day=0(Sun) -> -6. day=1(Mon) -> 0.
                        const day = wib.getDay();
                        const diff = wib.getDate() - day + (day === 0 ? -6 : 1);
                        const weekStart = new Date(wib);
                        weekStart.setDate(diff);
                        const weekStr = weekStart.toISOString().split('T')[0];

                        const isClaimed = isDaily ? (data.lastDailyBonusClaimed === wibDateStr) : (data.lastWeeklyBonusClaimed === weekStr);
                        const canClaim = totalCount > 0 && completedCount === totalCount && !isClaimed;
                        const bonusPoints = isDaily ? 500 : 1000;

                        const handleProgress = (quest: any, delta: number) => {
                            const target = quest.targetValue || 1;
                            const current = quest.currentValue || 0;
                            
                            // Check Penalty on Minus
                            if (delta < 0 && current === 0) {
                                if (confirm(`Mark "${quest.title}" as FORGOTTEN? You will be penalized 50 points.`)) {
                                    logQuestPenalty(quest.id);
                                }
                                return;
                            }

                            let next = current + delta;
                            if (next < 0) next = 0;
                            
                            // Checkbox logic
                            if (target === 1) {
                                next = delta > 0 ? 1 : 0;
                            }

                            updateQuestProgress(quest.id, next);
                        };

                        return (
                            <div className="space-y-4">
                                {/* Bonus Banner */}
                                <div className={`p-3 rounded-lg border ${isDaily ? 'bg-blue-900/20 border-blue-500/30' : 'bg-purple-900/20 border-purple-500/30'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <Gift className={`w-4 h-4 ${isDaily ? 'text-blue-400' : 'text-purple-400'}`} />
                                            <span className="text-sm font-bold text-gray-200">
                                                {isDaily ? 'Daily Bonus' : 'Weekly Bonus'}
                                            </span>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isClaimed ? 'bg-green-900/50 text-green-400' : 'bg-black/30 text-yellow-400'}`}>
                                            {isClaimed ? 'CLAIMED' : `+${bonusPoints} PTS`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-black/40 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${isDaily ? 'bg-blue-500' : 'bg-purple-500'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <button
                                            onClick={isDaily ? claimDailyBonus : claimWeeklyBonus}
                                            disabled={!canClaim}
                                            className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${canClaim
                                                ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20'
                                                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                }`}
                                        >
                                            CLAIM
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="space-y-2">
                                    {questsToShow.length === 0 ? (
                                        <p className="text-[var(--color-text-muted)] text-sm text-center py-4">
                                            No {isDaily ? 'daily' : 'weekly'} quests found.
                                        </p>
                                    ) : (
                                        questsToShow.map(quest => (
                                            <div
                                                key={quest.id}
                                                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-gray-800 hover:border-gray-700 transition-all"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`font-medium text-sm ${quest.isCompleted ? 'text-green-400' : 'text-gray-200'}`}>
                                                        {quest.title}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        {quest.isCompleted && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                                        <span className="text-[var(--color-success)] font-bold text-xs">+{quest.points}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center justify-between gap-4">
                                                    {/* Progress */}
                                                    <div className="flex-1 flex flex-col gap-1">
                                                        <div className="bg-black/40 h-1.5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${quest.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${Math.min(100, (quest.currentValue / quest.targetValue) * 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between text-[10px] text-gray-500">
                                                            <span>{quest.currentValue} / {quest.targetValue} {quest.unit}</span>
                                                            {quest.currentValue === 0 && (
                                                                <span className="text-red-900/50 flex items-center gap-1">
                                                                    <AlertTriangle className="w-3 h-3" />
                                                                    -50 if forgot
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Buttons */}
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleProgress(quest, -1)}
                                                            className="w-6 h-6 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
                                                            title={quest.currentValue === 0 ? "Mark as Forgotten (-50 pts)" : "Decrease Progress"}
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleProgress(quest, 1)}
                                                            className="w-6 h-6 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-white hover:text-green-400 transition-colors"
                                                            title="Add Progress"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Punishments */}
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4 text-[var(--color-highlight)]">⚠️ Punishments</h3>
                    <div className="space-y-2">
                        {punishments.length === 0 ? (
                            <p className="text-[var(--color-text-muted)] text-sm">No visible punishments. Add some in Activities tab.</p>
                        ) : (
                            punishments.map(activity => (
                                <button
                                    key={activity.id}
                                    onClick={() => handleLogActivity(activity.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-accent)] transition-all flex justify-between items-center ${justLogged === activity.id ? 'ring-2 ring-[var(--color-highlight)]' : ''}`}
                                >
                                    <span>{activity.name}</span>
                                    <span className="text-[var(--color-highlight)] font-semibold">{activity.points.toFixed(2)}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Add Entry Modal */}
            {modal && (
                <div className="timeline-modal-overlay" onClick={() => setModal(null)}>
                    <div className="timeline-modal" onClick={e => e.stopPropagation()}>
                        <h3>
                            {modal.type === 'planning' ? '📋 Add Planning Entry' : '🔍 Add Auditing Entry'}
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)] mb-4">
                            Date: {formatDateDisplay(modal.type === 'planning' ? planningDate : auditingDate)} • Time: {modal.timeSlot.replace('-', ' - ')}
                        </p>
                        <input
                            type="text"
                            className="input"
                            placeholder="What did you plan or audit?"
                            value={entryDescription}
                            onChange={e => setEntryDescription(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddEntry()}
                            autoFocus
                        />
                        <div className="timeline-modal-buttons">
                            <button className="btn btn-secondary" onClick={() => setModal(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddEntry}
                                disabled={!entryDescription.trim()}
                            >
                                Add (+{modal.type === 'planning' ? PLANNING_POINTS : AUDITING_POINTS} pts)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity Logs */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Recent Activity Logs
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {expandedLogs ? (
                        [...(data.logs || [])].reverse().map(log => (
                            <div key={log.id} className="flex justify-between items-center p-3 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{log.message}</span>
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                {log.pointsChange !== undefined && log.pointsChange !== 0 && (
                                    <span className={`font-semibold ${log.pointsChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-highlight)]'}`}>
                                        {log.pointsChange > 0 ? '+' : ''}{(log.pointsChange || 0).toFixed(2)}
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        [...(data.logs || [])].reverse().slice(0, 50).map(log => (
                            <div key={log.id} className="flex justify-between items-center p-3 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{log.message}</span>
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                {log.pointsChange !== undefined && log.pointsChange !== 0 && (
                                    <span className={`font-semibold ${log.pointsChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-highlight)]'}`}>
                                        {log.pointsChange > 0 ? '+' : ''}{(log.pointsChange || 0).toFixed(2)}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                    {(!data.logs || data.logs.length === 0) && (
                        <p className="text-[var(--color-text-muted)] text-center py-4">No activity logs yet.</p>
                    )}
                    {data.logs && data.logs.length > 50 && (
                        <button
                            onClick={() => setExpandedLogs(!expandedLogs)}
                            className="w-full text-center py-2 text-sm text-[var(--color-primary)] hover:underline"
                        >
                            {expandedLogs ? 'Show Less' : `Show All (${data.logs.length})`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

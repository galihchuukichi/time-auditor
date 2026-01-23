import { useState, useMemo } from 'react';
import { BellOff, Clock, Power, PowerOff, X, ClipboardList, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const { data, logActivity, addTimelineEntry, removeTimelineEntry } = useData();
    const [justLogged, setJustLogged] = useState<string | null>(null);
    const [modal, setModal] = useState<ModalState | null>(null);
    const [entryDescription, setEntryDescription] = useState('');

    // Separate selected dates for planning and auditing
    const [planningDate, setPlanningDate] = useState(getTodayDateString());
    const [auditingDate, setAuditingDate] = useState(getTodayDateString());
    const [expandedLogs, setExpandedLogs] = useState(false);

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
                    <h3 className="text-lg font-semibold mb-4 text-[var(--color-success)]">📜 Active Quests</h3>
                    <div className="space-y-2">
                        {data.quests?.filter(q => !q.isCompleted && q.type === 'daily').length === 0 ? (
                            <p className="text-[var(--color-text-muted)] text-sm">No active daily quests.</p>
                        ) : (
                            data.quests?.filter(q => !q.isCompleted && q.type === 'daily').slice(0, 5).map(quest => (
                                <div
                                    key={quest.id}
                                    className="w-full text-left px-4 py-3 rounded-lg bg-[var(--color-surface)] flex justify-between items-center border border-gray-800"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm text-gray-200">{quest.title}</span>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <div className="bg-black/40 w-16 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${Math.min(100, (quest.currentValue / quest.targetValue) * 100)}%` }}
                                                />
                                            </div>
                                            <span>{quest.currentValue}/{quest.targetValue}</span>
                                        </div>
                                    </div>
                                    <span className="text-[var(--color-success)] font-bold text-xs">+{quest.points}</span>
                                </div>
                            ))
                        )}
                    </div>
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

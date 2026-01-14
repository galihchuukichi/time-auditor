import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

interface TimerContextType {
    isRinging: boolean;
    isResting: boolean;
    isActive: boolean;
    nextAlarmTime: string | null;
    timeUntilNextAlarm: string;
    stopAlarm: () => void;
    startTimer: () => void;
    stopTimer: () => void;
}

const TimerContext = createContext<TimerContextType | null>(null);

// Target times for the alarm (hours in 24h format)
const ALARM_HOURS = [9, 12, 15, 18, 21]; // 9am, 12pm, 3pm, 6pm, 9pm
const RING_DURATION = 5 * 60 * 1000; // 5 minutes in ms
const REST_DURATION = 5 * 60 * 1000; // 5 minutes in ms

// Create audio context for alarm sound
function createBeepSound(): () => void {
    return () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
            console.error('Audio error:', e);
        }
    };
}

function getNextAlarmTime(): Date | null {
    const now = new Date();
    const todayAlarms = ALARM_HOURS.map(hour => {
        const d = new Date();
        d.setHours(hour, 0, 0, 0);
        return d;
    });

    // Find next alarm today
    for (const alarm of todayAlarms) {
        if (alarm > now) return alarm;
    }

    // Otherwise, first alarm tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(ALARM_HOURS[0], 0, 0, 0);
    return tomorrow;
}

function formatTimeUntil(target: Date): string {
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return 'Now!';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
}

export function TimerProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(true);
    const [isRinging, setIsRinging] = useState(false);
    const [isResting, setIsResting] = useState(false);
    const [nextAlarm, setNextAlarm] = useState<Date | null>(getNextAlarmTime());
    const [timeUntilNextAlarm, setTimeUntilNextAlarm] = useState('');

    const ringIntervalRef = useRef<number | null>(null);
    const cycleTimeoutRef = useRef<number | null>(null);
    const beepRef = useRef(createBeepSound());

    // Update time until next alarm every second
    useEffect(() => {
        const interval = setInterval(() => {
            const next = getNextAlarmTime();
            setNextAlarm(next);
            if (next) {
                setTimeUntilNextAlarm(formatTimeUntil(next));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Check if it's time to alarm
    useEffect(() => {
        if (!isActive) return;

        const checkAlarm = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            // Check if we're at an alarm time (within first minute)
            if (ALARM_HOURS.includes(currentHour) && currentMinute === 0 && !isRinging && !isResting) {
                startRingCycle();
            }
        };

        const interval = setInterval(checkAlarm, 1000);
        return () => clearInterval(interval);
    }, [isActive, isRinging, isResting]);

    const startRingCycle = useCallback(() => {
        setIsRinging(true);
        setIsResting(false);

        // Play beep every 2 seconds while ringing
        ringIntervalRef.current = window.setInterval(() => {
            beepRef.current();
        }, 2000);

        // After 5 minutes of ringing, rest for 5 minutes
        cycleTimeoutRef.current = window.setTimeout(() => {
            if (ringIntervalRef.current) {
                clearInterval(ringIntervalRef.current);
                ringIntervalRef.current = null;
            }
            setIsRinging(false);
            setIsResting(true);

            // After 5 minutes of rest, ring again
            cycleTimeoutRef.current = window.setTimeout(() => {
                startRingCycle();
            }, REST_DURATION);
        }, RING_DURATION);
    }, []);

    const stopAlarm = useCallback(() => {
        if (ringIntervalRef.current) {
            clearInterval(ringIntervalRef.current);
            ringIntervalRef.current = null;
        }
        if (cycleTimeoutRef.current) {
            clearTimeout(cycleTimeoutRef.current);
            cycleTimeoutRef.current = null;
        }
        setIsRinging(false);
        setIsResting(false);
    }, []);

    const startTimer = useCallback(() => {
        setIsActive(true);
    }, []);

    const stopTimer = useCallback(() => {
        setIsActive(false);
        stopAlarm();
    }, [stopAlarm]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
            if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
        };
    }, []);

    return (
        <TimerContext.Provider
            value={{
                isRinging,
                isResting,
                isActive,
                nextAlarmTime: nextAlarm ? nextAlarm.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
                timeUntilNextAlarm,
                stopAlarm,
                startTimer,
                stopTimer,
            }}
        >
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    const ctx = useContext(TimerContext);
    if (!ctx) throw new Error('useTimer must be used within TimerProvider');
    return ctx;
}

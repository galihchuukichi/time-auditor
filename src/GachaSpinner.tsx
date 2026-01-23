import { useEffect, useRef, useState } from 'react';
import type { CasinoReward } from './store';

interface GachaSpinnerProps {
    rewards: CasinoReward[];
    isSpinning: boolean;
    winningReward: CasinoReward | null;
    onComplete: () => void;
}

export function GachaSpinner({ rewards, isSpinning, winningReward, onComplete }: GachaSpinnerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [displayItems, setDisplayItems] = useState<CasinoReward[]>([]);

    // Initialize/Reset display items
    useEffect(() => {
        if (!isSpinning && !winningReward) {
            // Static display or initial state
            setDisplayItems(rewards.slice(0, 10)); // Show some items
        }
    }, [isSpinning, winningReward, rewards]);

    // Handle Spin Logic
    useEffect(() => {
        if (isSpinning && winningReward && scrollRef.current) {
            // 1. Generate a long strip of items ending with the winner
            // Pattern: [Random * 30] + [Winner] + [Random * 3]
            const randomsBefore = Array.from({ length: 40 }, () => rewards[Math.floor(Math.random() * rewards.length)]);
            const randomsAfter = Array.from({ length: 3 }, () => rewards[Math.floor(Math.random() * rewards.length)]);
            const spinItems = [...randomsBefore, winningReward, ...randomsAfter];

            setDisplayItems(spinItems);

            // Reset scroll to 0 first
            if (scrollRef.current) scrollRef.current.scrollLeft = 0;

            // Trigger animation
            // We use a timeout to let the DOM update with the new items list first
            setTimeout(() => {
                if (scrollRef.current) {
                    // Animation handled via CSS transform on child
                }
            }, 50);
        }
    }, [isSpinning, winningReward, rewards]);

    return (
        <div className="relative w-full h-40 bg-[var(--color-bg-secondary)] overflow-hidden rounded-lg border-2 border-[var(--color-highlight)] shadow-inner">
            {/* Center Marker */}
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[var(--color-danger)] z-20 -translate-x-1/2 opacity-70"></div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 text-[var(--color-danger)]">▼</div>

            <div
                className="flex items-center h-full px-[50%]"
                style={{
                    transform: isSpinning && winningReward
                        ? `translateX(calc(-${(40 * 116)}px))` // 40 items * (100px + 16px gap)
                        : 'translateX(0)',
                    transition: isSpinning ? 'transform 4s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                    width: 'max-content',
                    gap: '16px'
                }}
                onTransitionEnd={onComplete}
            >
                {displayItems.map((item, idx) => (
                    <div
                        key={`${item.id}-${idx}`}
                        className={`
                            flex-shrink-0 w-[100px] h-[120px] 
                            bg-[var(--color-bg-primary)] 
                            border border-[var(--color-border)] 
                            rounded-md flex flex-col items-center justify-center p-2
                            shadow-sm
                            ${item.tier === 1 ? 'border-yellow-400 bg-yellow-900/10' : ''}
                            ${item.tier === 2 ? 'border-purple-400 bg-purple-900/10' : ''}
                            ${item.tier === 3 ? 'border-blue-400 bg-blue-900/10' : ''}
                            ${item.tier === 4 ? 'border-gray-400 bg-gray-900/10' : ''}
                        `}
                    >
                        <span className="text-4xl mb-2">{item.image}</span>
                        <span className="text-xs font-bold truncate w-full text-center">{item.name}</span>
                        <span className={`
                            text-[10px] uppercase font-bold mt-1 px-1 rounded
                            ${item.tier === 1 ? 'text-yellow-400' : ''}
                            ${item.tier === 2 ? 'text-purple-400' : ''}
                            ${item.tier === 3 ? 'text-blue-400' : ''}
                            ${item.tier === 4 ? 'text-gray-400' : ''}
                        `}>
                            {item.tier === 1 ? 'Legendary' : item.tier === 2 ? 'Rare' : item.tier === 3 ? 'Uncommon' : 'Common'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Overlay Gradient for depth */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[var(--color-bg-secondary)] via-transparent to-[var(--color-bg-secondary)] z-10"></div>
        </div>
    );
}

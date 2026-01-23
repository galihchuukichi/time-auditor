import { useEffect, useState } from 'react';
import type { CasinoReward } from './store';

interface GachaSpinnerProps {
    rewards: CasinoReward[];
    isSpinning: boolean;
    winningReward: CasinoReward | null;
    onComplete: () => void;
}

export function GachaSpinner({ rewards, isSpinning, winningReward, onComplete }: GachaSpinnerProps) {
    const [displayItems, setDisplayItems] = useState<CasinoReward[]>([]);
    const [targetIndex, setTargetIndex] = useState(0);

    // Initialize/Reset display items (Passive Mode)
    useEffect(() => {
        if (!isSpinning && !winningReward) {
            // Passive display: Just show a random slice
            // Fill a buffer to ensure we cover the screen
            let show: CasinoReward[] = [];
            while (show.length < 50) {
                show = [...show, ...rewards];
            }
            // Use slice
            setDisplayItems(show);
            // Center on index 25 (middle of 50) so we have equal items left and right
            setTargetIndex(25);
        }
    }, [isSpinning, winningReward, rewards]);

    // Handle Spin Logic
    useEffect(() => {
        if (isSpinning && winningReward) {
            // Generate 10-item pattern logic...
            const pattern: CasinoReward[] = [];
            pattern.push(winningReward);

            const slotsNeeded = 9;

            const satisfyConstraints = (currentList: CasinoReward[]) => {
                const t2 = currentList.filter(i => i.tier === 2).length;
                const t3 = currentList.filter(i => i.tier === 3).length;
                const t4 = currentList.filter(i => i.tier === 4).length;
                return { t2, t3, t4 };
            };

            let currentPool = [...rewards];

            for (let i = 0; i < slotsNeeded; i++) {
                const { t2 } = satisfyConstraints(pattern);
                const validCandidates = currentPool.filter(item => {
                    if (item.tier === 1) return false;
                    if (item.tier === 2 && t2 >= 1) return false;
                    return true;
                });

                if (validCandidates.length === 0) {
                    const t4s = rewards.filter(r => r.tier === 4);
                    if (t4s.length > 0) pattern.push(t4s[0]);
                    else if (rewards.length > 0) pattern.push(rewards[0]);
                } else {
                    const pick = validCandidates[Math.floor(Math.random() * validCandidates.length)];
                    pattern.push(pick);
                }
            }

            let retry = true;
            let attempts = 0;
            while (retry && attempts < 100) {
                attempts++;
                const { t3, t4 } = satisfyConstraints(pattern);
                if (t3 >= t4) {
                    const t3Idx = pattern.findIndex(x => x.tier === 3 && x.id !== winningReward.id);
                    if (t3Idx !== -1) {
                        const t4Item = rewards.find(r => r.tier === 4);
                        if (t4Item) pattern[t3Idx] = t4Item;
                        else retry = false;
                    } else {
                        const otherIdx = pattern.findIndex(x => x.tier !== 4 && x.id !== winningReward.id);
                        const t4Item = rewards.find(r => r.tier === 4);
                        if (otherIdx !== -1 && t4Item) pattern[otherIdx] = t4Item;
                        else retry = false;
                    }
                } else {
                    retry = false;
                }
            }

            const shuffledPattern = [...pattern].sort(() => Math.random() - 0.5);

            // Construct Strip
            // Create a LARGE prefix buffer
            const prefix = [];
            for (let i = 0; i < 3; i++) prefix.push(...shuffledPattern);

            const loops = 8;
            let strip = [...prefix];
            for (let k = 0; k < loops; k++) {
                strip.push(...shuffledPattern);
            }

            const winnerIdxInPattern = shuffledPattern.findIndex(x => x.id === winningReward.id);
            // Target Land Index
            const targetLoop = 5;
            const target = prefix.length + (targetLoop * shuffledPattern.length) + winnerIdxInPattern;

            setDisplayItems(strip);
            // Start at same visual offset as passive
            setTargetIndex(25);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTargetIndex(target);
                });
            });
        }
    }, [isSpinning, winningReward, rewards]);

    const itemWidth = 100;
    const itemGap = 16;
    const totalItemWidth = itemWidth + itemGap;

    return (
        <div className="relative w-full h-48 bg-[var(--color-bg-secondary)] overflow-hidden rounded-lg border-2 border-[var(--color-highlight)] shadow-inner">
            {/* Center Marker */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[var(--color-highlight)] z-30 -translate-x-1/2 shadow-[0_0_10px_var(--color-highlight)] opacity-50"></div>

            <div
                className="flex items-center h-full px-[calc(50%-50px)]"
                style={{
                    transform: `translateX(-${targetIndex * totalItemWidth}px)`,
                    transition: isSpinning && targetIndex > 30 ? 'transform 6s cubic-bezier(0.1, 0.9, 0.3, 1.0)' : 'none',
                    width: 'max-content',
                    gap: `${itemGap}px`
                }}
                onTransitionEnd={onComplete}
            >
                {displayItems.map((item, idx) => (
                    <div
                        key={`${item.id}-${idx}`}
                        className={`
                            flex-shrink-0 w-[100px] h-[100px] 
                            bg-gradient-to-b from-gray-800 to-gray-900
                            border-b-4
                            rounded flex flex-col items-center justify-center p-1
                            shadow-lg relative overflow-hidden group
                            ${item.tier === 1 ? 'border-yellow-500' : ''}
                            ${item.tier === 2 ? 'border-purple-500' : ''}
                            ${item.tier === 3 ? 'border-blue-500' : ''}
                            ${item.tier === 4 ? 'border-gray-500' : ''}
                        `}
                    >
                        {/* Background Splatter/Glow - Reduced opacity */}
                        <div className={`absolute inset-0 opacity-10 
                            ${item.tier === 1 ? 'bg-yellow-500' : ''}
                            ${item.tier === 2 ? 'bg-purple-500' : ''}
                            ${item.tier === 3 ? 'bg-blue-500' : ''}
                            ${item.tier === 4 ? 'bg-gray-500' : ''}
                        `}></div>

                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                            <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain drop-shadow-md" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Overlay Gradient for Fade Effect - Stronger Vignette */}
            <div className="absolute inset-0 pointer-events-none z-20"
                style={{
                    background: 'linear-gradient(90deg, var(--color-bg-secondary) 0%, transparent 30%, transparent 70%, var(--color-bg-secondary) 100%)'
                }}
            ></div>
        </div>
    );
}

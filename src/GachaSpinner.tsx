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
            let show = [...rewards];
            while (show.length < 20 && show.length > 0) {
                show = [...show, ...rewards];
            }
            // Use slice
            setDisplayItems(show.slice(0, 20));
            // Center on index 2 (so items 0 and 1 are visible on the left)
            setTargetIndex(2);
        }
    }, [isSpinning, winningReward, rewards]);

    // Handle Spin Logic
    useEffect(() => {
        if (isSpinning && winningReward) {
            // Generate 10-item Pattern with constraints
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

            const prefix = shuffledPattern.slice(-3);
            const loops = 5;
            let strip = [...prefix];
            for (let k = 0; k < loops; k++) {
                strip.push(...shuffledPattern);
            }

            const winnerIdxInPattern = shuffledPattern.findIndex(x => x.id === winningReward.id);
            const targetLoop = 3;
            const target = prefix.length + (targetLoop * shuffledPattern.length) + winnerIdxInPattern;

            setDisplayItems(strip);
            setTargetIndex(2);

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
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[var(--color-danger)] z-30 -translate-x-1/2 shadow-[0_0_10px_var(--color-danger)]"></div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 text-[var(--color-danger)] text-2xl drop-shadow-md">▼</div>

            <div
                className="flex items-center h-full px-[calc(50%-50px)]"
                style={{
                    transform: `translateX(-${targetIndex * totalItemWidth}px)`,
                    transition: isSpinning && targetIndex > 10 ? 'transform 5s cubic-bezier(0.1, 0.9, 0.3, 1.0)' : 'none',
                    width: 'max-content',
                    gap: `${itemGap}px`
                }}
                onTransitionEnd={onComplete}
            >
                {displayItems.map((item, idx) => (
                    <div
                        key={`${item.id}-${idx}`}
                        className={`
                            flex-shrink-0 w-[100px] h-[120px] 
                            bg-gradient-to-b from-gray-800 to-gray-900
                            border-2
                            rounded-lg flex flex-col items-center justify-center p-1
                            shadow-lg relative overflow-hidden group
                            ${item.tier === 1 ? 'border-yellow-500 shadow-yellow-500/20' : ''}
                            ${item.tier === 2 ? 'border-purple-500 shadow-purple-500/20' : ''}
                            ${item.tier === 3 ? 'border-blue-500 shadow-blue-500/20' : ''}
                            ${item.tier === 4 ? 'border-gray-500 shadow-gray-500/20' : ''}
                        `}
                    >
                        <div className={`absolute inset-0 opacity-20 
                            ${item.tier === 1 ? 'bg-yellow-500' : ''}
                            ${item.tier === 2 ? 'bg-purple-500' : ''}
                            ${item.tier === 3 ? 'bg-blue-500' : ''}
                            ${item.tier === 4 ? 'bg-gray-500' : ''}
                        `}></div>

                        <div className="relative z-10 w-full h-20 flex items-center justify-center mb-1 bg-black/30 rounded">
                            <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                        </div>

                        <div className={`
                            w-full text-[10px] font-bold text-center text-white px-1 py-0.5 rounded
                            ${item.tier === 1 ? 'bg-yellow-600' : ''}
                            ${item.tier === 2 ? 'bg-purple-600' : ''}
                            ${item.tier === 3 ? 'bg-blue-600' : ''}
                            ${item.tier === 4 ? 'bg-gray-600' : ''}
                        `}>
                            Tier {item.tier}
                        </div>
                    </div>
                ))}
            </div>

            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[var(--color-bg-secondary)] via-transparent to-[var(--color-bg-secondary)] z-20"></div>
        </div>
    );
}

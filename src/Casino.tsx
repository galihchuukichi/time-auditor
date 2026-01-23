import { useState, useCallback } from 'react';
import { Coins, History, Package, ArrowUpCircle } from 'lucide-react';
import { useData } from './DataContext';
import type { InventoryItem } from './store';
import { GachaSpinner } from './GachaSpinner';

export function Casino() {
    const { data, playGacha, tradeUp } = useData();
    const [isSpinning, setIsSpinning] = useState(false);
    const [winningResult, setWinningResult] = useState<{ reward: InventoryItem; won: boolean; tier: number } | null>(null);
    const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSpin = useCallback(() => {
        if (isSpinning) return;

        const result = playGacha();
        if (result && result.won) {
            setWinningResult(result);
            setIsSpinning(true);
        }
    }, [isSpinning, playGacha]);

    const handleSpinComplete = () => {
        setIsSpinning(false);
        // winningResult stays set to show the result message until next spin or dismissed
    };

    const handleTradeUp = (targetTier: number) => {
        const result = tradeUp(targetTier);
        setTradeMessage({
            type: result.success ? 'success' : 'error',
            text: result.message
        });
        setTimeout(() => setTradeMessage(null), 3000);
    };

    // Group inventory for display if needed, but per requirement "not merge", so we show all.
    // However, sorting by acquiredAt desc is nice.
    const sortedInventory = [...data.inventory].sort((a, b) =>
        new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()
    );

    // Count items for trade-up availability
    const counts = {
        t4: data.inventory.filter(i => i.tier === 4).length,
        t3: data.inventory.filter(i => i.tier === 3).length,
        t2: data.inventory.filter(i => i.tier === 2).length,
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            🎰 Gacha Casino
                        </h2>
                        <p className="text-[var(--color-text-muted)] text-sm mt-1">
                            Spin for rewards! 1000 pts per spin.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 text-[var(--color-highlight)]">
                            <Coins className="w-5 h-5" />
                            <span className="text-2xl font-bold">{data.currentPoints.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)]">Your Points</p>
                    </div>
                </div>
            </div>

            {/* Gacha Machine */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4">🔮 Gacha Machine</h3>

                <div className="mb-6">
                    <GachaSpinner
                        rewards={data.casinoRewards}
                        isSpinning={isSpinning}
                        winningReward={winningResult ? data.casinoRewards.find(r => r.id === winningResult.reward.rewardId) || null : null}
                        onComplete={handleSpinComplete}
                    />
                </div>

                <div className="flex justify-center flex-col items-center gap-4">
                    {!isSpinning && winningResult && (
                        <div className="text-center animate-bounce-in">
                            <p className="text-lg font-bold text-[var(--color-success)]">You Won!</p>
                            <div className="w-32 h-32 my-2 relative">
                                <img
                                    src={winningResult.reward.image}
                                    alt={winningResult.reward.name}
                                    className="w-full h-full object-contain drop-shadow-lg"
                                />
                            </div>
                            <p className="font-semibold">{winningResult.reward.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase
                                ${winningResult.tier === 1 ? 'bg-yellow-900 text-yellow-400' : ''}
                                ${winningResult.tier === 2 ? 'bg-purple-900 text-purple-400' : ''}
                                ${winningResult.tier === 3 ? 'bg-blue-900 text-blue-400' : ''}
                                ${winningResult.tier === 4 ? 'bg-gray-700 text-gray-300' : ''}
                            `}>
                                Tier {winningResult.tier}
                            </span>
                        </div>

                    )}

                    <button
                        onClick={handleSpin}
                        disabled={isSpinning || data.currentPoints < 1000}
                        className={`btn w-64 py-4 text-lg font-bold shadow-lg transition-transform active:scale-95
                            ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}
                            ${data.currentPoints >= 1000 ? 'btn-primary' : 'bg-gray-600 cursor-not-allowed'}
                        `}
                    >
                        {isSpinning ? 'Spinning...' : 'Spin Gacha (1000 pts)'}
                    </button>
                    {data.currentPoints < 1000 && (
                        <p className="text-[var(--color-danger)] text-sm">Not enough points!</p>
                    )}
                </div>

                <div className="mt-6 flex justify-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Common (50%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Uncommon (37%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400"></span> Rare (13%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Legendary (Trade-Up Only)</span>
                </div>
            </div>

            {/* Trade Up System */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5" />
                    Trade Up System
                </h3>

                {tradeMessage && (
                    <div className={`p-3 rounded mb-4 text-center ${tradeMessage.type === 'success' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'}`}>
                        {tradeMessage.text}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-4">
                    {/* T4 -> T3 */}
                    <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg flex flex-col items-center text-center">
                        <h4 className="font-bold text-blue-400 mb-2">Get Uncommon (Tier 3)</h4>
                        <p className="text-sm text-[var(--color-text-muted)] mb-4">Trade 6 Tier 4 Items</p>
                        <div className="mb-4 text-2xl font-bold">
                            {counts.t4} / 6
                        </div>
                        <button
                            onClick={() => handleTradeUp(3)}
                            disabled={counts.t4 < 6}
                            className={`btn w-full ${counts.t4 >= 6 ? 'btn-primary' : 'btn-secondary opacity-50'}`}
                        >
                            Trade Up
                        </button>
                    </div>

                    {/* T3 -> T2 */}
                    <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg flex flex-col items-center text-center">
                        <h4 className="font-bold text-purple-400 mb-2">Get Rare (Tier 2)</h4>
                        <p className="text-sm text-[var(--color-text-muted)] mb-4">Trade 10 Tier 3 Items</p>
                        <div className="mb-4 text-2xl font-bold">
                            {counts.t3} / 10
                        </div>
                        <button
                            onClick={() => handleTradeUp(2)}
                            disabled={counts.t3 < 10}
                            className={`btn w-full ${counts.t3 >= 10 ? 'btn-primary' : 'btn-secondary opacity-50'}`}
                        >
                            Trade Up
                        </button>
                    </div>

                    {/* T2 -> T1 */}
                    <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg flex flex-col items-center text-center borderBorder-yellow-500/30">
                        <h4 className="font-bold text-yellow-400 mb-2">Get Legendary (Tier 1)</h4>
                        <p className="text-sm text-[var(--color-text-muted)] mb-4">Trade 12 Tier 2 Items</p>
                        <div className="mb-4 text-2xl font-bold">
                            {counts.t2} / 12
                        </div>
                        <button
                            onClick={() => handleTradeUp(1)}
                            disabled={counts.t2 < 12}
                            className={`btn w-full ${counts.t2 >= 12 ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'btn-secondary opacity-50'}`}
                        >
                            Trade Up
                        </button>
                    </div>
                </div>
            </div>

            {/* Locker / Inventory */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Locker ({data.inventory.length} items)
                </h3>

                {sortedInventory.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-muted)]">
                        Your locker is empty. Spin the Gacha to get rewards!
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                        {sortedInventory.map((item) => {
                            const isLegendary = item.tier === 1;
                            const isRare = item.tier === 2;
                            const isUncommon = item.tier === 3;

                            // Dynamic styles based on tier
                            let styles = {
                                border: 'border-gray-700/50',
                                shadow: 'shadow-black/50',
                                accent: 'bg-gray-500',
                                text: 'text-gray-400',
                                label: 'Common',
                                bg: 'bg-gray-900'
                            };

                            if (isLegendary) {
                                styles = {
                                    border: 'border-yellow-500/80',
                                    shadow: 'shadow-yellow-500/20',
                                    accent: 'bg-yellow-500',
                                    text: 'text-yellow-400',
                                    label: 'Legendary',
                                    bg: 'bg-yellow-950/30'
                                };
                            } else if (isRare) {
                                styles = {
                                    border: 'border-purple-500/60',
                                    shadow: 'shadow-purple-500/20',
                                    accent: 'bg-purple-500',
                                    text: 'text-purple-400',
                                    label: 'Rare',
                                    bg: 'bg-purple-950/30'
                                };
                            } else if (isUncommon) {
                                styles = {
                                    border: 'border-blue-500/60',
                                    shadow: 'shadow-blue-500/20',
                                    accent: 'bg-blue-500',
                                    text: 'text-blue-400',
                                    label: 'Uncommon',
                                    bg: 'bg-blue-950/30'
                                };
                            }

                            return (
                                <div
                                    key={item.id}
                                    className={`
                                        group relative aspect-square rounded-xl overflow-hidden cursor-pointer
                                        border ${styles.border} ${styles.bg}
                                        transition-all duration-300 hover:scale-[1.02] hover:z-10 hover:shadow-xl hover:${styles.shadow}
                                    `}
                                >
                                    {/* Background Image Layer - Full Bleed */}
                                    <div className="absolute inset-0 z-0 bg-gray-950">
                                        {(item.image.startsWith('/') || item.image.startsWith('http')) ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-30">
                                                <span className="text-5xl select-none">{item.image}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Shimmer Effect for Legendaries */}
                                    {isLegendary && (
                                        <div className="absolute inset-0 z-10 animate-shimmer-premium pointer-events-none opacity-20" style={{
                                            background: 'linear-gradient(45deg, transparent 40%, rgba(255, 215, 0, 0.6) 50%, transparent 60%)',
                                        }}></div>
                                    )}

                                    {/* Gradient Overlay for Text Readability */}
                                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-300"></div>

                                    {/* Content Layer (Bottom) */}
                                    <div className="absolute inset-x-0 bottom-0 z-20 p-3 flex flex-col justify-end">
                                        <div className="transform translate-y-1 transition-transform duration-300 group-hover:translate-y-0">
                                            {/* Tier Label */}
                                            <div className="flex items-center gap-1.5 mb-1 opacity-90">
                                                <div className={`w-1.5 h-1.5 rounded-full ${styles.accent} shadow-[0_0_6px_currentColor]`}></div>
                                                <span className={`text-[10px] uppercase font-bold tracking-wider leading-none ${styles.text}`}>
                                                    {styles.label}
                                                </span>
                                            </div>

                                            {/* Item Name */}
                                            <h4 className="text-sm font-bold text-white leading-tight truncate drop-shadow-sm group-hover:text-white/100">
                                                {item.name}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Hover Border Glow */}
                                    <div className={`absolute inset-0 border-2 ${styles.border.replace('border-', 'border-')} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none`}></div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* History */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-[var(--color-text-muted)]" />
                    History
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.casinoHistory.slice(0, 10).map((h) => (
                        <div key={h.id} className="text-sm flex justify-between p-2 rounded bg-[var(--color-bg-secondary)]">
                            <span>
                                {h.game === 'dice' ? '🎲 Dice' : '🔮 Gacha'} - {h.won ? `Won ${h.rewardName}` : 'No win'}
                            </span>
                            <span className="text-[var(--color-text-muted)]">
                                {new Date(h.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

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
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {sortedInventory.map((item) => (
                            <div
                                key={item.id}
                                className={`
                                    relative aspect-square flex flex-col items-center justify-center p-2 rounded-lg border bg-[var(--color-bg-secondary)]
                                    ${item.tier === 1 ? 'border-yellow-400/50 hover:border-yellow-400' : ''}
                                    ${item.tier === 2 ? 'border-purple-400/50 hover:border-purple-400' : ''}
                                    ${item.tier === 3 ? 'border-blue-400/50 hover:border-blue-400' : ''}
                                    ${item.tier === 4 ? 'border-gray-500/30 hover:border-gray-400' : ''}
                                    transition-colors group
                                `}
                            >
                                <div className="w-12 h-12 mb-1 flex items-center justify-center">
                                    {(item.image.startsWith('/') || item.image.startsWith('http')) ? (
                                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <span className="text-3xl">{item.image}</span>
                                    )}
                                </div>
                                <span className="text-[10px] w-full text-center truncate font-medium">{item.name}</span>
                                <div className={`
                                    absolute top-1 right-1 w-2 h-2 rounded-full
                                    ${item.tier === 1 ? 'bg-yellow-400' : ''}
                                    ${item.tier === 2 ? 'bg-purple-400' : ''}
                                    ${item.tier === 3 ? 'bg-blue-400' : ''}
                                    ${item.tier === 4 ? 'bg-gray-400' : ''}
                                `}></div>
                            </div>
                        ))}
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

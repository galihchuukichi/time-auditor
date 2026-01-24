import { useState, useCallback } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useData } from './DataContext';
import { getLegendaryAuraClass, type InventoryItem, type CasinoReward } from './store'; // Import types
import { GachaSpinner } from './GachaSpinner';

export function Shop() {
    const { data, playShopGacha } = useData();
    const [isSpinning, setIsSpinning] = useState(false);
    const [winningResult, setWinningResult] = useState<{ reward: InventoryItem; won: boolean; tier: number } | null>(null);

    const handleSpin = useCallback(() => {
        if (isSpinning) return;

        const result = playShopGacha();
        if (result && result.won) {
            setWinningResult(result);
            setIsSpinning(true);
        }
    }, [isSpinning, playShopGacha]);

    const handleSpinComplete = () => {
        setIsSpinning(false);
    };

    // Map ShopItems to CasinoRewards interface for GachaSpinner
    const spinnerRewards: CasinoReward[] = data.shopItems.map(item => ({
        id: item.id,
        name: item.name,
        image: item.image,
        tier: item.tier || 4,
        minRoll: 0,
        cost: 0,
        description: ''
    }));

    // Find the winning ShopItem corresponding to the InventoryItem we won
    const winningShopItem = winningResult
        ? spinnerRewards.find(r => r.id === winningResult.reward.rewardId)
        : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6" />
                        Shop Gacha
                    </h2>
                    <p className="text-[var(--color-text-muted)] text-sm mt-1">
                        Spin for random shop items! 500 pts per spin.
                    </p>
                </div>

                <div className="card py-2 px-4">
                    <span className="text-[var(--color-text-muted)]">Balance: </span>
                    <span className={`font-bold ${data.currentPoints >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-highlight)]'}`}>
                        {data.currentPoints.toFixed(2)} pts
                    </span>
                </div>
            </div>

            {/* Gacha Machine */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4">🔮 Shop Gacha</h3>

                <div className="mb-6">
                    {spinnerRewards.length > 0 ? (
                        <GachaSpinner
                            rewards={spinnerRewards}
                            isSpinning={isSpinning}
                            winningReward={winningShopItem || null}
                            onComplete={handleSpinComplete}
                        />
                    ) : (
                        <div className="text-center py-8 text-[var(--color-text-muted)] border-2 border-dashed border-gray-700 rounded-lg">
                            No shop items available. Add some in the Shop Manager!
                        </div>
                    )}
                </div>

                <div className="flex justify-center flex-col items-center gap-4">
                    {!isSpinning && winningResult && (
                        <div className="text-center animate-bounce-in">
                            <p className="text-lg font-bold text-[var(--color-success)]">You Won!</p>
                            <div className="w-32 h-32 my-2 relative flex items-center justify-center">
                                {winningResult.tier === 1 && (
                                    <div className="absolute inset-0 z-0 scale-150 opacity-80">
                                        <div className="fluid-aura-container">
                                            <div className={`fluid-aura-layer ${getLegendaryAuraClass(winningResult.reward.name) || 'bg-yellow-500'}`}></div>
                                            <div className={`fluid-aura-layer ${getLegendaryAuraClass(winningResult.reward.name) || 'bg-yellow-500'}`}></div>
                                            <div className="fluid-aura-layer"></div>
                                        </div>
                                    </div>
                                )}
                                {winningResult.reward.image.startsWith('http') || winningResult.reward.image.startsWith('/') ? (
                                    <img
                                        src={winningResult.reward.image}
                                        alt={winningResult.reward.name}
                                        className={`w-full h-full object-contain drop-shadow-lg relative z-10`}
                                    />
                                ) : (
                                    <span className="text-6xl relative z-10 filter drop-shadow-lg">{winningResult.reward.image}</span>
                                )}
                            </div>
                            <p className="font-semibold relative z-10">{winningResult.reward.name}</p>
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
                        disabled={isSpinning || data.currentPoints < 500 || spinnerRewards.length === 0}
                        className={`btn w-64 py-4 text-lg font-bold shadow-lg transition-transform active:scale-95
                            ${isSpinning || spinnerRewards.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                            ${data.currentPoints >= 500 && spinnerRewards.length > 0 ? 'btn-primary' : 'bg-gray-600 cursor-not-allowed'}
                        `}
                    >
                        {isSpinning ? 'Spinning...' : 'Spin Shop (500 pts)'}
                    </button>
                    {data.currentPoints < 500 && (
                        <p className="text-[var(--color-danger)] text-sm">Not enough points!</p>
                    )}
                </div>

                <div className="mt-6 flex justify-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Common (50%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Uncommon (37%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400"></span> Rare (13%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Legendary (0%)</span>
                </div>
            </div>

            {/* Recent Wins / Purchase History - Adapted for Gacha */}
            {data.purchaseHistory.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Win History</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {data.purchaseHistory.slice().reverse().map((purchase, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0">
                                <span>{purchase.itemName}</span>
                                <div className="text-right">
                                    <span className="text-[var(--color-highlight)]">-{purchase.price.toFixed(2)} pts</span>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        {new Date(purchase.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

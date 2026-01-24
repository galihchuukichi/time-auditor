import { useState, useCallback } from 'react';
import { Coins, History, Package, ArrowUpCircle, X, Trophy, Sparkles } from 'lucide-react';
import { useData } from './DataContext';
import { getLegendaryAuraClass, type InventoryItem } from './store';

import { GachaSpinner } from './GachaSpinner';

// Helper component for the exclusive animation
const PremiumGlow = ({ children, colorRGB, className = "" }: { children: React.ReactNode, colorRGB: string, className?: string }) => {
    return (
        <div
            className={`rounded-lg p-2 text-center transition-all duration-200 relative overflow-hidden ${className}`}
            style={{
                background: `linear-gradient(rgb(0, 0, 0), rgb(0, 0, 0)) border-box padding-box, linear-gradient(135deg, rgb(${colorRGB}), rgb(0, 0, 0), rgb(${colorRGB})) border-box rgb(0, 0, 0)`,
                border: '1px solid transparent',
                boxShadow: `rgba(${colorRGB}, 0.4) 0px 0px 12px, rgba(${colorRGB}, 0.2) 0px 1px 0px inset`
            }}
        >
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `linear-gradient(45deg, transparent 20%, rgba(${colorRGB}, 0.3) 50%, transparent 80%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer-premium 2.5s ease-in-out infinite'
                }}
            ></div>
        </div>
    );
};

export function Casino() {
    const { data, playGacha, tradeUp } = useData();
    const [isSpinning, setIsSpinning] = useState(false);
    const [winningResult, setWinningResult] = useState<{ reward: InventoryItem; won: boolean; tier: number } | null>(null);
    const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [rewardModal, setRewardModal] = useState<{ item: InventoryItem; title: string; subtext: string } | null>(null);

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
        if (result.success && result.newItem) {
            // Show exciting popup!
            setRewardModal({
                item: result.newItem,
                title: "Trade Successful!",
                subtext: result.message
            });
            setTradeMessage(null);
        } else {
            setTradeMessage({
                type: 'error',
                text: result.message
            });
            setTimeout(() => setTradeMessage(null), 3000);
        }
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
                            <span className="text-2xl font-bold">{(data.currentPoints || 0).toFixed(2)}</span>
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
                            <div className="w-32 h-32 my-2 relative flex items-center justify-center">
                                {winningResult.tier === 1 && (
                                    <div className="absolute inset-0 z-0 scale-150 opacity-80">
                                        <div className="fluid-aura-container">
                                            <div className={`fluid-aura-layer ${getLegendaryAuraClass(winningResult.reward.name, winningResult.reward.auraColors) || 'bg-yellow-500'}`}></div>
                                            <div className={`fluid-aura-layer ${getLegendaryAuraClass(winningResult.reward.name, winningResult.reward.auraColors) || 'bg-yellow-500'}`}></div>
                                            <div className="fluid-aura-layer"></div>
                                        </div>
                                    </div>
                                )}
                                <img
                                    src={winningResult.reward.image}
                                    alt={winningResult.reward.name}
                                    className={`w-full h-full object-contain drop-shadow-lg relative z-10`}
                                />
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
                        disabled={isSpinning || data.currentPoints < 1000}
                        className={`btn w-full max-w-xs py-4 text-lg font-bold shadow-lg transition-transform active:scale-95
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
                    <div className="bg-[var(--color-bg-secondary)] p-4 rounded-lg flex flex-col items-center text-center border border-yellow-500/30">
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

                            // Colors
                            const blueRGB = "59, 130, 246";   // Uncommon
                            const purpleRGB = "168, 85, 247"; // Rare
                            const goldRGB = "255, 215, 0";    // Legendary (Gold)

                            // Legendary Item: Entire card wrapped in Gold PremiumGlow
                            if (isLegendary) {
                                return (
                                    <PremiumGlow
                                        key={item.id}
                                        colorRGB={goldRGB}
                                        className="group aspect-square cursor-pointer hover:scale-[1.02] hover:z-10 !p-0"
                                    >
                                        <div className="w-full h-full relative">
                                            <div className="absolute inset-0 z-0 p-2">
                                                {(item.image.startsWith('/') || item.image.startsWith('http')) ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain drop-shadow-2xl" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-30"><span className="text-5xl">{item.image}</span></div>
                                                )}
                                            </div>

                                            <div className="absolute inset-x-0 bottom-0 z-20 p-2 flex flex-col justify-end items-center">
                                                <h4 className="text-sm font-bold text-[#ffd700] leading-tight truncate drop-shadow-sm bg-black/50 px-2 rounded backdrop-blur-sm">
                                                    {item.name}
                                                </h4>
                                            </div>
                                        </div>
                                    </PremiumGlow>
                                );
                            }

                            // Other Items: Standard Card
                            return (
                                <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-gray-700/50 bg-gray-900 transition-all duration-300 hover:scale-[1.02] hover:z-10 hover:shadow-xl hover:shadow-black/50">
                                    {/* Image */}
                                    <div className="absolute inset-0 z-0 bg-gray-950">
                                        {(item.image.startsWith('/') || item.image.startsWith('http')) ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-30"><span className="text-5xl">{item.image}</span></div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-300"></div>

                                    {/* Content */}
                                    <div className="absolute inset-x-0 bottom-0 z-20 p-2 flex flex-col justify-end">
                                        <div className="transform translate-y-1 transition-transform duration-300 group-hover:translate-y-0 text-center">
                                            {/* Name with conditional styling */}
                                            {isUncommon ? (
                                                <PremiumGlow colorRGB={blueRGB} className="mb-0 !p-1">
                                                    <h4 className="text-[10px] font-bold text-blue-400 leading-tight truncate uppercase tracking-wide">{item.name}</h4>
                                                </PremiumGlow>
                                            ) : isRare ? (
                                                <PremiumGlow colorRGB={purpleRGB} className="mb-0 !p-1">
                                                    <h4 className="text-[10px] font-bold text-purple-400 leading-tight truncate uppercase tracking-wide">{item.name}</h4>
                                                </PremiumGlow>
                                            ) : (
                                                // Common
                                                <h4 className="text-sm font-medium text-gray-300 leading-tight truncate drop-shadow-sm group-hover:text-white pb-1">
                                                    {item.name}
                                                </h4>
                                            )}
                                        </div>
                                    </div>
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
            {/* Reward Popup Modal */}
            {rewardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-sm bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl animate-scale-in overflow-hidden">

                        {/* Background FX */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-highlight)_0%,_transparent_70%)] opacity-10 pointer-events-none"></div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--color-highlight)] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

                        <button
                            onClick={() => setRewardModal(null)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-20"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className="mb-2 text-[var(--color-highlight)] animate-bounce">
                                <Trophy size={48} className="drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                            </div>

                            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 mb-1 drop-shadow-sm">
                                {rewardModal.title}
                            </h2>

                            <p className="text-gray-400 text-sm mb-6 max-w-[200px]">
                                {rewardModal.subtext}
                            </p>

                            <div className="relative w-48 h-48 mb-6 group perspective-1000">
                                {/* Glow Effect */}
                                <div className={`absolute inset-0 rounded-xl blur-xl opacity-75 
                                    ${rewardModal.item.tier === 1 ? (getLegendaryAuraClass(rewardModal.item.name, rewardModal.item.auraColors) || 'bg-yellow-500') : ''}
                                    ${rewardModal.item.tier === 2 ? 'bg-purple-500' : ''}
                                    ${rewardModal.item.tier === 3 ? 'bg-blue-500' : ''}
                                    ${rewardModal.item.tier === 4 ? 'bg-gray-500' : ''}
                                    animate-pulse-ring
                                `}></div>

                                <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl transform transition-transform duration-500 hover:scale-105 hover:rotate-2 bg-gray-900">
                                    {/* Inner Aura for Legendaries */}
                                    {rewardModal.item.tier === 1 && getLegendaryAuraClass(rewardModal.item.name, rewardModal.item.auraColors) && (
                                        <div className="absolute inset-0 overflow-hidden">
                                            <div className="fluid-aura-container">
                                                <div className={`fluid-aura-layer ${getLegendaryAuraClass(rewardModal.item.name, rewardModal.item.auraColors)}`}></div>
                                                <div className={`fluid-aura-layer ${getLegendaryAuraClass(rewardModal.item.name, rewardModal.item.auraColors)}`}></div>
                                                <div className="fluid-aura-layer"></div>
                                            </div>
                                        </div>
                                    )}

                                    <img
                                        src={rewardModal.item.image}
                                        alt={rewardModal.item.name}
                                        className={`w-full h-full ${rewardModal.item.tier === 1 ? 'object-contain p-4 relative z-10' : 'object-cover'}`}
                                    />
                                    {/* Shimmer overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>
                                </div>

                                {/* Floating sparkles */}
                                <div className="absolute -top-4 -right-4 text-yellow-400 animate-pulse delay-75">
                                    <Sparkles size={24} />
                                </div>
                                <div className="absolute -bottom-2 -left-2 text-yellow-200 animate-pulse delay-150">
                                    <Sparkles size={16} />
                                </div>
                            </div>

                            <div className="space-y-3 w-full">
                                <h3 className="text-xl font-bold text-white">{rewardModal.item.name}</h3>

                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                    ${rewardModal.item.tier === 1 ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/30' : ''}
                                    ${rewardModal.item.tier === 2 ? 'bg-purple-900/50 text-purple-400 border border-purple-500/30' : ''}
                                    ${rewardModal.item.tier === 3 ? 'bg-blue-900/50 text-blue-400 border border-blue-500/30' : ''}
                                    ${rewardModal.item.tier === 4 ? 'bg-gray-700/50 text-gray-300 border border-gray-500/30' : ''}
                                `}>
                                    <span>
                                        {rewardModal.item.tier === 1 && 'Legendary'}
                                        {rewardModal.item.tier === 2 && 'Rare'}
                                        {rewardModal.item.tier === 3 && 'Uncommon'}
                                        {rewardModal.item.tier === 4 && 'Common'}
                                    </span>
                                </div>

                                <button
                                    onClick={() => setRewardModal(null)}
                                    className="w-full mt-4 btn btn-primary py-3 font-bold shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                                >
                                    Awesome!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

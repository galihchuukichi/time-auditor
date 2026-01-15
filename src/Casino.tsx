import { useState, useCallback } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Coins, Trophy, History } from 'lucide-react';
import { useData } from './DataContext';
import type { CasinoReward } from './store';

// Dice face components
const DiceFaces = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export function Casino() {
    const { data, playCasinoGame } = useData();
    const [isRolling, setIsRolling] = useState(false);
    const [displayDice1, setDisplayDice1] = useState(1);
    const [displayDice2, setDisplayDice2] = useState(1);
    const [result, setResult] = useState<{ dice1: number; dice2: number; total: number; won: boolean; reward?: CasinoReward } | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [selectedReward, setSelectedReward] = useState<CasinoReward | null>(null);

    const handleRoll = useCallback(() => {
        if (!selectedReward || data.currentPoints < selectedReward.cost || isRolling) return;

        setIsRolling(true);
        setShowResult(false);
        setResult(null);

        // Animate dice rolling
        let rollCount = 0;
        const maxRolls = 15;
        const rollInterval = setInterval(() => {
            setDisplayDice1(Math.floor(Math.random() * 6) + 1);
            setDisplayDice2(Math.floor(Math.random() * 6) + 1);
            rollCount++;
            if (rollCount >= maxRolls) {
                clearInterval(rollInterval);

                // Execute actual roll
                const gameResult = playCasinoGame(selectedReward.cost);
                setDisplayDice1(gameResult.dice1);
                setDisplayDice2(gameResult.dice2);
                setResult(gameResult);
                setIsRolling(false);

                // Show result after a brief delay
                setTimeout(() => setShowResult(true), 300);
            }
        }, 100);
    }, [data.currentPoints, isRolling, playCasinoGame, selectedReward]);

    const Dice1Icon = DiceFaces[displayDice1 - 1];
    const Dice2Icon = DiceFaces[displayDice2 - 1];
    const canRoll = selectedReward && data.currentPoints >= selectedReward.cost && !isRolling;

    return (
        <div className="space-y-6">
            {/* Header with Points */}
            <div className="card">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            🎰 Casino
                        </h2>
                        <p className="text-[var(--color-text-muted)] text-sm mt-1">
                            Roll two dice Monopoly-style and win rewards!
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

            {/* Main Game Area */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Dice Roll Section */}
                <div className="card casino-game-card">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        🎲🎲 Dice Roll
                        {selectedReward && (
                            <span className="text-sm font-normal text-[var(--color-text-muted)]">
                                Cost: {selectedReward.cost} points
                            </span>
                        )}
                    </h3>

                    {/* Reward Selection */}
                    <div className="mb-4">
                        <label className="block text-sm text-[var(--color-text-muted)] mb-2">
                            Select a reward to play for:
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {data.casinoRewards.length === 0 ? (
                                <p className="text-[var(--color-text-muted)] text-sm">
                                    No rewards configured. Add rewards in Manage Casino.
                                </p>
                            ) : (
                                data.casinoRewards
                                    .slice()
                                    .sort((a, b) => b.minRoll - a.minRoll)
                                    .map(reward => (
                                        <button
                                            key={reward.id}
                                            onClick={() => setSelectedReward(reward)}
                                            disabled={data.currentPoints < reward.cost || isRolling}
                                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${selectedReward?.id === reward.id
                                                    ? 'border-[var(--color-highlight)] bg-[var(--color-highlight)]/10'
                                                    : data.currentPoints < reward.cost
                                                        ? 'border-[var(--color-border)] opacity-50 cursor-not-allowed'
                                                        : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                                                }`}
                                        >
                                            <span className="text-xl">{reward.image}</span>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{reward.name}</p>
                                                <p className="text-xs text-[var(--color-text-muted)]">
                                                    Roll {reward.minRoll}+ | Cost: {reward.cost} pts
                                                </p>
                                            </div>
                                        </button>
                                    ))
                            )}
                        </div>
                    </div>

                    {/* Dual Dice Display */}
                    <div className="flex flex-col items-center py-6">
                        <div className="flex items-center gap-4">
                            <div
                                className={`dice-container ${isRolling ? 'dice-rolling' : ''} ${showResult && result?.won ? 'dice-win' : ''}`}
                            >
                                <Dice1Icon className="w-16 h-16 md:w-20 md:h-20 text-[var(--color-highlight)]" />
                            </div>
                            <span className="text-2xl font-bold text-[var(--color-text-muted)]">+</span>
                            <div
                                className={`dice-container ${isRolling ? 'dice-rolling' : ''} ${showResult && result?.won ? 'dice-win' : ''}`}
                            >
                                <Dice2Icon className="w-16 h-16 md:w-20 md:h-20 text-[var(--color-highlight)]" />
                            </div>
                        </div>

                        {/* Total Display */}
                        {showResult && result && (
                            <div className="mt-4 text-center">
                                <span className="text-3xl font-bold text-[var(--color-highlight)]">
                                    = {result.total}
                                </span>
                            </div>
                        )}

                        {/* Result Display */}
                        {showResult && result && (
                            <div className={`mt-4 text-center result-animation ${result.won ? 'result-win' : 'result-lose'}`}>
                                {result.won ? (
                                    <>
                                        <div className="flex items-center justify-center gap-2 text-[var(--color-success)] mb-2">
                                            <Trophy className="w-6 h-6" />
                                            <span className="text-xl font-bold">You Won!</span>
                                        </div>
                                        <div className="text-3xl mb-2">{result.reward?.image}</div>
                                        <p className="text-[var(--color-highlight)] font-medium">{result.reward?.name}</p>
                                    </>
                                ) : (
                                    <div className="text-[var(--color-text-muted)]">
                                        <span className="text-lg">No win this time</span>
                                        <p className="text-sm mt-1">Needed {selectedReward?.minRoll}+ to win</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Roll Button */}
                    <button
                        onClick={handleRoll}
                        disabled={!canRoll}
                        className={`btn w-full py-4 text-lg ${canRoll ? 'btn-primary casino-roll-btn' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
                    >
                        {isRolling ? 'Rolling...' : selectedReward ? `Roll Dice (${selectedReward.cost} pts)` : 'Select a reward first'}
                    </button>

                    {selectedReward && data.currentPoints < selectedReward.cost && !isRolling && (
                        <p className="text-center text-[var(--color-danger)] text-sm mt-2">
                            Not enough points to play
                        </p>
                    )}
                </div>

                {/* Recent History */}
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-[var(--color-text-muted)]" />
                        Recent Games
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {data.casinoHistory.length === 0 ? (
                            <p className="text-[var(--color-text-muted)] text-sm">
                                No games played yet.
                            </p>
                        ) : (
                            data.casinoHistory.slice(0, 15).map(game => (
                                <div
                                    key={game.id}
                                    className={`flex items-center justify-between p-3 rounded-lg ${game.won ? 'bg-[var(--color-success)]/10' : 'bg-[var(--color-bg-secondary)]'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🎲🎲</span>
                                        <div>
                                            <span className="font-medium">{game.dice1} + {game.dice2} = {game.total}</span>
                                            <span className="text-xs text-[var(--color-text-muted)] ml-2">
                                                (-{game.cost} pts)
                                            </span>
                                        </div>
                                    </div>
                                    {game.won ? (
                                        <span className="text-[var(--color-success)] text-sm flex items-center gap-1">
                                            <Trophy className="w-3 h-3" />
                                            {game.rewardName}
                                        </span>
                                    ) : (
                                        <span className="text-[var(--color-text-muted)] text-sm">
                                            No win
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

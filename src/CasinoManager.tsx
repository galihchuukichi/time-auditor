import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Trophy, Dice6 } from 'lucide-react';
import { useData } from './DataContext';
import type { CasinoReward } from './store';

// Common emoji options for casino rewards
const EMOJI_OPTIONS = ['🍀', '🎁', '🏆', '💎', '⭐', '🌟', '🎯', '🎪', '🎠', '🎡', '🍭', '🍩', '🧁', '🍪', '🎂', '🍫'];

export function CasinoManager() {
    const { data, addCasinoReward, updateCasinoReward, deleteCasinoReward } = useData();
    const [newName, setNewName] = useState('');
    const [newImage, setNewImage] = useState('🎁');
    const [newMinRoll, setNewMinRoll] = useState(10);
    const [newCost, setNewCost] = useState(1);
    const [newDescription, setNewDescription] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editImage, setEditImage] = useState('');
    const [editMinRoll, setEditMinRoll] = useState(10);
    const [editCost, setEditCost] = useState(1);
    const [editDescription, setEditDescription] = useState('');

    const handleAdd = () => {
        if (!newName.trim()) return;
        addCasinoReward({
            name: newName.trim(),
            image: newImage,
            minRoll: newMinRoll,
            cost: newCost,
            description: newDescription.trim() || undefined,
        });
        setNewName('');
        setNewImage('🎁');
        setNewMinRoll(10);
        setNewCost(1);
        setNewDescription('');
    };

    const handleUpdate = (id: string) => {
        if (!editName.trim()) return;
        updateCasinoReward(id, {
            name: editName.trim(),
            image: editImage,
            minRoll: editMinRoll,
            cost: editCost,
            description: editDescription.trim() || undefined,
        });
        setEditingId(null);
    };

    const startEdit = (reward: CasinoReward) => {
        setEditingId(reward.id);
        setEditName(reward.name);
        setEditImage(reward.image);
        setEditMinRoll(reward.minRoll);
        setEditCost(reward.cost);
        setEditDescription(reward.description || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="card">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-[var(--color-highlight)]" />
                    Casino Rewards Manager
                </h2>
                <p className="text-[var(--color-text-muted)] text-sm mt-1">
                    Configure rewards for the dice roll game (2 dice, total 2-12)
                </p>
            </div>

            {/* Add New Reward */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add New Reward
                </h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">
                                Reward Name
                            </label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g., Jackpot Prize"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">
                                Cost to Play (points)
                            </label>
                            <input
                                type="number"
                                min={0.01}
                                step={0.01}
                                value={newCost}
                                onChange={(e) => setNewCost(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">
                                Min Roll to Win (2-12)
                            </label>
                            <div className="flex items-center gap-2">
                                <Dice6 className="w-5 h-5 text-[var(--color-text-muted)]" />
                                <input
                                    type="number"
                                    min={2}
                                    max={12}
                                    value={newMinRoll}
                                    onChange={(e) => setNewMinRoll(Math.max(2, Math.min(12, parseInt(e.target.value) || 2)))}
                                    className="w-20"
                                />
                                <span className="text-sm text-[var(--color-text-muted)]">
                                    (Roll ≥{newMinRoll} wins)
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">
                                Description (optional)
                            </label>
                            <input
                                type="text"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="e.g., Roll double 6 to win!"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">
                            Emoji Icon
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setNewImage(emoji)}
                                    className={`w-10 h-10 text-xl rounded-lg border transition-all ${newImage === emoji
                                            ? 'border-[var(--color-highlight)] bg-[var(--color-highlight)]/20'
                                            : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                                        }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={!newName.trim()}
                        className="btn btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        Add Reward
                    </button>
                </div>
            </div>

            {/* Existing Rewards */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4">
                    Existing Rewards ({data.casinoRewards.length})
                </h3>

                {data.casinoRewards.length === 0 ? (
                    <p className="text-[var(--color-text-muted)] text-center py-8">
                        No rewards configured yet. Add your first reward above!
                    </p>
                ) : (
                    <div className="space-y-3">
                        {data.casinoRewards
                            .slice()
                            .sort((a, b) => b.minRoll - a.minRoll)
                            .map((reward) => (
                                <div
                                    key={reward.id}
                                    className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
                                >
                                    {editingId === reward.id ? (
                                        // Edit Mode
                                        <div className="flex-1 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    placeholder="Name"
                                                    className="w-full"
                                                />
                                                <input
                                                    type="number"
                                                    min={2}
                                                    max={12}
                                                    value={editMinRoll}
                                                    onChange={(e) => setEditMinRoll(Math.max(2, Math.min(12, parseInt(e.target.value) || 2)))}
                                                    className="w-full"
                                                    placeholder="Min Roll"
                                                />
                                                <input
                                                    type="number"
                                                    min={0.01}
                                                    step={0.01}
                                                    value={editCost}
                                                    onChange={(e) => setEditCost(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                                                    className="w-full"
                                                    placeholder="Cost"
                                                />
                                                <input
                                                    type="text"
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    placeholder="Description"
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {EMOJI_OPTIONS.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => setEditImage(emoji)}
                                                        className={`w-8 h-8 text-lg rounded border transition-all ${editImage === emoji
                                                                ? 'border-[var(--color-highlight)] bg-[var(--color-highlight)]/20'
                                                                : 'border-[var(--color-border)]'
                                                            }`}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleUpdate(reward.id)} className="btn btn-success btn-sm">
                                                    <Save className="w-4 h-4" />
                                                    Save
                                                </button>
                                                <button onClick={cancelEdit} className="btn btn-secondary btn-sm">
                                                    <X className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode
                                        <>
                                            <span className="text-3xl">{reward.image}</span>
                                            <div className="flex-1">
                                                <p className="font-medium">{reward.name}</p>
                                                <p className="text-sm text-[var(--color-text-muted)]">
                                                    {reward.description || `Roll ${reward.minRoll}+ to win`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="badge badge-planning">
                                                    Roll ≥{reward.minRoll}
                                                </span>
                                                <p className="text-xs text-[var(--color-highlight)] mt-1">
                                                    Cost: {reward.cost} pts
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEdit(reward)}
                                                    className="btn btn-secondary p-2"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteCasinoReward(reward.id)}
                                                    className="btn btn-danger p-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="card bg-[var(--color-bg-secondary)]">
                <h4 className="font-semibold mb-2">🎲🎲 How it works (Monopoly-style)</h4>
                <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
                    <li>• Players roll TWO dice (range: 2-12, like Monopoly)</li>
                    <li>• Each reward has a different cost to play</li>
                    <li>• Select a reward, then roll to try to win it</li>
                    <li>• Higher minRoll = harder to win = more valuable reward</li>
                    <li>• Probability: 12 (2.8%), 10+ (16.7%), 8+ (41.7%), 6+ (72.2%)</li>
                </ul>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Trophy } from 'lucide-react';
import { useData } from './DataContext';
import type { CasinoReward } from './store';
import { EmojiPicker } from './EmojiPicker';

export function CasinoManager() {
    const { data, addCasinoReward, updateCasinoReward, deleteCasinoReward } = useData();
    const [newName, setNewName] = useState('');
    const [newImage, setNewImage] = useState('🎁');
    const [newTier, setNewTier] = useState<1 | 2 | 3 | 4>(4);
    const [newDescription, setNewDescription] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editImage, setEditImage] = useState('');
    const [editTier, setEditTier] = useState<1 | 2 | 3 | 4>(4);
    const [editDescription, setEditDescription] = useState('');

    const handleAdd = () => {
        if (!newName.trim()) return;
        addCasinoReward({
            name: newName.trim(),
            image: newImage,
            tier: newTier,
            minRoll: 0, // Deprecated
            cost: 0, // Deprecated
            description: newDescription.trim() || undefined,
        });
        setNewName('');
        setNewImage('🎁');
        setNewTier(4);
        setNewDescription('');
    };

    const handleUpdate = (id: string) => {
        if (!editName.trim()) return;
        updateCasinoReward(id, {
            name: editName.trim(),
            image: editImage,
            tier: editTier,
            description: editDescription.trim() || undefined,
        });
        setEditingId(null);
    };

    const startEdit = (reward: CasinoReward) => {
        setEditingId(reward.id);
        setEditName(reward.name);
        setEditImage(reward.image);
        setEditTier(reward.tier || 4);
        setEditDescription(reward.description || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const TierBadge = ({ tier }: { tier: number }) => {
        const colors = {
            1: 'bg-yellow-900 text-yellow-400 border-yellow-400',
            2: 'bg-purple-900 text-purple-400 border-purple-400',
            3: 'bg-blue-900 text-blue-400 border-blue-400',
            4: 'bg-gray-700 text-gray-300 border-gray-400',
        };
        const labels = { 1: 'Legendary', 2: 'Rare', 3: 'Uncommon', 4: 'Common' };

        return (
            <span className={`px-2 py-0.5 rounded text-xs border ${colors[tier as keyof typeof colors]}`}>
                {labels[tier as keyof typeof labels]} (T{tier})
            </span>
        );
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
                    Configure Gacha rewards. Assign tiers (1=Legendary, 4=Common).
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
                                Tier (Rarity)
                            </label>
                            <select
                                value={newTier}
                                onChange={(e) => setNewTier(Number(e.target.value) as 1 | 2 | 3 | 4)}
                                className="w-full p-2 rounded border bg-[var(--color-bg-primary)] border-[var(--color-border)]"
                            >
                                <option value={4}>Tier 4 (Common - 50%)</option>
                                <option value={3}>Tier 3 (Uncommon - 37%)</option>
                                <option value={2}>Tier 2 (Rare - 13%)</option>
                                <option value={1}>Tier 1 (Legendary - Trade-Up Only)</option>
                            </select>
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
                            placeholder="e.g., Shiny collectible"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">
                            Emoji Icon
                        </label>
                        <EmojiPicker
                            value={newImage}
                            onChange={(emoji) => setNewImage(emoji)}
                        />
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
                        No rewards configured yet.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {data.casinoRewards
                            .slice()
                            .sort((a, b) => (a.tier || 4) - (b.tier || 4))
                            .map((reward) => (
                                <div
                                    key={reward.id}
                                    className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
                                >
                                    {editingId === reward.id ? (
                                        // Edit Mode
                                        <div className="flex-1 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    placeholder="Name"
                                                    className="w-full"
                                                />
                                                <select
                                                    value={editTier}
                                                    onChange={(e) => setEditTier(Number(e.target.value) as 1 | 2 | 3 | 4)}
                                                    className="w-full p-2 rounded border bg-[var(--color-bg-primary)] border-[var(--color-border)]"
                                                >
                                                    <option value={4}>Tier 4 (Common)</option>
                                                    <option value={3}>Tier 3 (Uncommon)</option>
                                                    <option value={2}>Tier 2 (Rare)</option>
                                                    <option value={1}>Tier 1 (Legendary)</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    placeholder="Description"
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <EmojiPicker
                                                    value={editImage}
                                                    onChange={(emoji) => setEditImage(emoji)}
                                                />
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
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium">{reward.name}</p>
                                                    <TierBadge tier={reward.tier || 4} />
                                                </div>
                                                <p className="text-sm text-[var(--color-text-muted)]">
                                                    {reward.description || 'No description'}
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

            <div className="card bg-[var(--color-bg-secondary)]">
                <h4 className="font-semibold mb-2">📊 Gacha Probabilities</h4>
                <ul className="text-sm text-[var(--color-text-muted)] space-y-1">
                    <li>• Tier 4 (Common): 50%</li>
                    <li>• Tier 3 (Uncommon): 37%</li>
                    <li>• Tier 2 (Rare): 13%</li>
                    <li>• Tier 1 (Legendary): 0% (Only available via Trade-Up!)</li>
                </ul>
            </div>
        </div>
    );
}

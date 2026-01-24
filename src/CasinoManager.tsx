import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, Trophy, Upload, Palette, Minus } from 'lucide-react';
import { useData } from './DataContext';
import type { CasinoReward } from './store';
import { EmojiPicker } from './EmojiPicker';

export function CasinoManager() {
    const { data, addCasinoReward, updateCasinoReward, deleteCasinoReward } = useData();
    const [newName, setNewName] = useState('');
    const [newImage, setNewImage] = useState('🎁');
    const [newTier, setNewTier] = useState<1 | 2 | 3 | 4>(4);
    const [newDescription, setNewDescription] = useState('');
    const [newAuraColors, setNewAuraColors] = useState<string[]>(['#FFD700', '#FFA500']); // Default Gold/Orange

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editImage, setEditImage] = useState('');
    const [editTier, setEditTier] = useState<1 | 2 | 3 | 4>(4);
    const [editDescription, setEditDescription] = useState('');
    const [editAuraColors, setEditAuraColors] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            if (img.width !== img.height) {
                alert('Image must be 1:1 ratio (square).');
                URL.revokeObjectURL(objectUrl);
                // Reset input
                if (isEdit && editFileInputRef.current) editFileInputRef.current.value = '';
                if (!isEdit && fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (isEdit) {
                    setEditImage(result);
                } else {
                    setNewImage(result);
                }
                URL.revokeObjectURL(objectUrl);
            };
            reader.readAsDataURL(file);
        };
        img.src = objectUrl;
    };

    const handleAdd = () => {
        if (!newName.trim()) return;
        addCasinoReward({
            name: newName.trim(),
            image: newImage,
            tier: newTier,
            minRoll: 0,
            cost: 0,
            description: newDescription.trim() || undefined,
            auraColors: newTier === 1 ? newAuraColors : undefined
        });
        setNewName('');
        setNewImage('🎁');
        setNewTier(4);
        setNewDescription('');
        setNewAuraColors(['#FFD700', '#FFA500']);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpdate = (id: string) => {
        if (!editName.trim()) return;
        updateCasinoReward(id, {
            name: editName.trim(),
            image: editImage,
            tier: editTier,
            description: editDescription.trim() || undefined,
            auraColors: editTier === 1 ? editAuraColors : undefined
        });
        setEditingId(null);
    };

    const startEdit = (reward: CasinoReward) => {
        setEditingId(reward.id);
        setEditName(reward.name);
        setEditImage(reward.image);
        setEditTier(reward.tier || 4);
        setEditDescription(reward.description || '');
        setEditAuraColors(reward.auraColors || ['#FFD700', '#FFA500']);
        if (editFileInputRef.current) editFileInputRef.current.value = '';
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

    const AuraColorPicker = ({ colors, setColors }: { colors: string[], setColors: (c: string[]) => void }) => {
        const addColor = () => {
            if (colors.length < 3) setColors([...colors, '#000000']);
        };
        const removeColor = (idx: number) => {
            if (colors.length > 2) setColors(colors.filter((_, i) => i !== idx));
        };
        const updateColor = (idx: number, color: string) => {
            const newColors = [...colors];
            newColors[idx] = color;
            setColors(newColors);
        };

        return (
            <div className="space-y-2 p-3 bg-black/20 rounded border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold flex items-center gap-2">
                        <Palette className="w-4 h-4 text-yellow-400" />
                        Legendary Aura Colors
                    </label>
                    <span className="text-xs text-[var(--color-text-muted)]">Min 2, Max 3 (Gradient)</span>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    {colors.map((c, i) => (
                        <div key={i} className="flex flex-col gap-1 items-center">
                            <input
                                type="color"
                                value={c}
                                onChange={(e) => updateColor(i, e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer bg-transparent border-none p-0"
                            />
                            {colors.length > 2 && (
                                <button onClick={() => removeColor(i)} className="text-[var(--color-danger)] hover:bg-black/30 rounded p-0.5">
                                    <Minus className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                    {colors.length < 3 && (
                        <button onClick={addColor} className="w-10 h-10 flex items-center justify-center border border-dashed border-[var(--color-border)] rounded hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]">
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {/* Preview */}
                <div className="h-6 rounded w-full mt-2 border border-white/10" style={{
                    background: colors.length >= 2
                        ? (colors.length === 3
                            ? `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]}, ${colors[2]})`
                            : `linear-gradient(to bottom right, ${colors[0]}, ${colors[1]})`)
                        : '#333'
                }}></div>
            </div>
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
                            Reward Image (Icon or 1:1 Image)
                        </label>
                        <div className="flex gap-4 items-start p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)]">
                            <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center border rounded bg-black/40 overflow-hidden relative">
                                {(newImage.startsWith('data:') || newImage.startsWith('http')) ? (
                                    <img src={newImage} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-4xl">{newImage}</span>
                                )}
                            </div>
                            <div className="space-y-3 flex-1">
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm gap-2 w-fit">
                                        <Upload className="w-4 h-4" /> Upload Image (1:1)
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, false)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[var(--color-text-muted)]">OR Emoji:</span>
                                    <EmojiPicker value={newImage} onChange={setNewImage} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {newTier === 1 && (
                        <AuraColorPicker colors={newAuraColors} setColors={setNewAuraColors} />
                    )}

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
                                    className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
                                >
                                    {editingId === reward.id ? (
                                        // Edit Mode
                                        <div className="flex-1 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                            </div>
                                            <input
                                                type="text"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                placeholder="Description"
                                                className="w-full"
                                            />

                                            <div className="flex gap-4 items-center p-2 border border-[var(--color-border)] rounded bg-black/20">
                                                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border rounded bg-black/40 overflow-hidden relative">
                                                    {(editImage.startsWith('data:') || editImage.startsWith('http')) ? (
                                                        <img src={editImage} alt="Preview" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <span className="text-2xl">{editImage}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex gap-2 items-center flex-wrap">
                                                    <button onClick={() => editFileInputRef.current?.click()} className="btn btn-secondary btn-xs gap-1">
                                                        <Upload className="w-3 h-3" /> Upload
                                                    </button>
                                                    <input
                                                        ref={editFileInputRef}
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(e, true)}
                                                    />
                                                    <span className="text-xs text-[var(--color-text-muted)]">|</span>
                                                    <EmojiPicker value={editImage} onChange={setEditImage} />
                                                </div>
                                            </div>

                                            {editTier === 1 && (
                                                <AuraColorPicker colors={editAuraColors} setColors={setEditAuraColors} />
                                            )}

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
                                            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border rounded bg-black/40 overflow-hidden relative">
                                                {(reward.image.startsWith('data:') || reward.image.startsWith('http')) ? (
                                                    <img src={reward.image} alt={reward.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <span className="text-3xl">{reward.image}</span>
                                                )}
                                                {reward.tier === 1 && reward.auraColors && (
                                                    <div className="absolute top-0 right-0 w-3 h-3 rounded-full border border-black" style={{
                                                        background: `linear-gradient(to bottom right, ${reward.auraColors[0]}, ${reward.auraColors[1] || reward.auraColors[0]})`
                                                    }} title="Custom Aura"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 w-full text-center sm:text-left">
                                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
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

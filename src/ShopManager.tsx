import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Settings } from 'lucide-react';
import { useData } from './DataContext';
import type { ShopItem } from './store';

// Common emoji options for shop items
const EMOJI_OPTIONS = ['☕', '🎮', '🎬', '🍰', '🍕', '📚', '🎵', '🏖️', '🎁', '💤', '🍿', '🎨', '🏃', '🎯', '🌟', '💪'];

export function ShopManager() {
    const { data, addShopItem, updateShopItem, deleteShopItem } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', image: '🎁', price: 1 });

    const handleAdd = () => {
        if (!form.name.trim()) return;
        addShopItem({
            name: form.name.trim(),
            image: form.image,
            price: Math.max(0.01, form.price),
        });
        setForm({ name: '', image: '🎁', price: 1 });
        setIsAdding(false);
    };

    const handleUpdate = (id: string) => {
        if (!form.name.trim()) return;
        updateShopItem(id, {
            name: form.name.trim(),
            image: form.image,
            price: Math.max(0.01, form.price),
        });
        setEditingId(null);
        setForm({ name: '', image: '🎁', price: 1 });
    };

    const startEdit = (item: ShopItem) => {
        setEditingId(item.id);
        setForm({
            name: item.name,
            image: item.image,
            price: item.price,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsAdding(false);
        setForm({ name: '', image: '🎁', price: 1 });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Settings className="w-6 h-6" />
                    Shop Manager
                </h2>
                {!isAdding && !editingId && (
                    <button onClick={() => setIsAdding(true)} className="btn btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Item
                    </button>
                )}
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="card">
                    <h3 className="text-lg font-medium mb-4">New Shop Item</h3>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Item name..."
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="input"
                            autoFocus
                        />
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-2">Choose Icon</label>
                            <div className="flex flex-wrap gap-2">
                                {EMOJI_OPTIONS.map(emoji => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => setForm({ ...form, image: emoji })}
                                        className={`text-2xl p-2 rounded-lg transition-all ${form.image === emoji ? 'bg-[var(--color-highlight)] scale-110' : 'bg-[var(--color-surface)] hover:bg-[var(--color-accent)]'}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-2">Price (points)</label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0.01 })}
                                className="input"
                                min="0.01"
                                step="0.01"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={cancelEdit} className="btn btn-secondary flex items-center gap-2">
                                <X className="w-4 h-4" /> Cancel
                            </button>
                            <button onClick={handleAdd} className="btn btn-success flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Items List */}
            <div className="space-y-3">
                {data.shopItems.map(item => (
                    <div key={item.id} className="card flex items-center gap-4">
                        {editingId === item.id ? (
                            <div className="flex-1 space-y-4">
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="input"
                                    autoFocus
                                />
                                <div>
                                    <label className="block text-sm text-[var(--color-text-muted)] mb-2">Choose Icon</label>
                                    <div className="flex flex-wrap gap-2">
                                        {EMOJI_OPTIONS.map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => setForm({ ...form, image: emoji })}
                                                className={`text-2xl p-2 rounded-lg transition-all ${form.image === emoji ? 'bg-[var(--color-highlight)] scale-110' : 'bg-[var(--color-surface)] hover:bg-[var(--color-accent)]'}`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-[var(--color-text-muted)] mb-2">Price</label>
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0.01 })}
                                        className="input"
                                        min="0.01"
                                        step="0.01"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={cancelEdit} className="btn btn-secondary flex items-center gap-2">
                                        <X className="w-4 h-4" /> Cancel
                                    </button>
                                    <button onClick={() => handleUpdate(item.id)} className="btn btn-success flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="text-4xl">{item.image}</div>
                                <div className="flex-1">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-[var(--color-warning)] text-sm">{item.price.toFixed(2)} points</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => startEdit(item)}
                                        className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteShopItem(item.id)}
                                        className="p-2 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-highlight)] transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {data.shopItems.length === 0 && (
                    <div className="card text-center text-[var(--color-text-muted)]">
                        <p>No shop items yet. Create your first one!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

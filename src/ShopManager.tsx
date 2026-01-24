import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, Settings, Download, Upload, Image as ImageIcon, Loader } from 'lucide-react';
import { useData } from './DataContext';
import type { ShopItem } from './store';
import { EmojiPicker } from './EmojiPicker'; // Keep as fallback/option if desired, or remove if strictly 1:1 image
import { uploadShopImage } from './supabase';

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
            {labels[tier as keyof typeof labels]}
        </span>
    );
};

export function ShopManager() {
    const { data, addShopItem, updateShopItem, deleteShopItem, exportData, importData } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [form, setForm] = useState<{
        name: string;
        image: string; // URL or Emoji
        price: number;
        tier: 1 | 2 | 3 | 4;
    }>({ name: '', image: '🎁', price: 1, tier: 4 });

    const [uploading, setUploading] = useState(false);
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageUploadRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const url = await uploadShopImage(file);
        setUploading(false);

        if (url) {
            setForm(prev => ({ ...prev, image: url }));
        } else {
            alert('Failed to upload image. Please try again.');
        }
    };

    const handleAdd = () => {
        if (!form.name.trim()) return;
        addShopItem({
            name: form.name.trim(),
            image: form.image,
            price: Math.max(0.01, form.price),
            tier: form.tier, // Pass tier
        } as any); // Cast because store might not be fully updated in typescript intelligence yet
        resetForm();
    };

    const handleUpdate = (id: string) => {
        if (!form.name.trim()) return;
        updateShopItem(id, {
            name: form.name.trim(),
            image: form.image,
            price: Math.max(0.01, form.price),
            tier: form.tier,
        } as any);
        setEditingId(null);
        resetForm();
    };

    const handleSave = () => {
        if (isAdding) {
            handleAdd();
        } else if (editingId) {
            handleUpdate(editingId);
        }
    };

    const startEdit = (item: ShopItem) => {
        setEditingId(item.id);
        setForm({
            name: item.name,
            image: item.image,
            price: item.price,
            tier: item.tier || 4,
        });
        setIsAdding(false);
    };

    const resetForm = () => {
        setForm({ name: '', image: '🎁', price: 1, tier: 4 });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const success = importData(content);
            setImportStatus(success ? 'success' : 'error');
            setTimeout(() => setImportStatus('idle'), 3000);
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
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

            {/* Data Backup Section */}
            <div className="card">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Data Backup
                </h3>
                <div className="flex flex-wrap gap-3">
                    <button onClick={exportData} className="btn btn-success flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export Data
                    </button>
                    <button onClick={handleImportClick} className="btn btn-secondary flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Import Data
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
                {importStatus === 'success' && <p className="text-[var(--color-success)] text-sm mt-2">✓ Imported successfully!</p>}
                {importStatus === 'error' && <p className="text-[var(--color-danger)] text-sm mt-2">✗ Import failed.</p>}
            </div>

            {/* Editing/Adding Form */}
            {(isAdding || editingId) && (
                <div className="card border-2 border-[var(--color-highlight)]">
                    <h3 className="text-lg font-medium mb-4">{isAdding ? 'New Shop Item' : 'Edit Shop Item'}</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-[var(--color-text-muted)] mb-1">Item Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="input w-full"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[var(--color-text-muted)] mb-1">Tier (Probability)</label>
                                <select
                                    value={form.tier}
                                    onChange={e => setForm({ ...form, tier: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                                    className="input w-full"
                                >
                                    <option value={4}>Common (50%)</option>
                                    <option value={3}>Uncommon (37%)</option>
                                    <option value={2}>Rare (13%)</option>
                                    <option value={1}>Legendary (0% - Trade Up)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-[var(--color-text-muted)] mb-2">Image (1:1 Ratio)</label>
                            <div className="flex items-start gap-4">
                                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-center group">
                                    {uploading ? (
                                        <Loader className="w-8 h-8 animate-spin text-[var(--color-highlight)]" />
                                    ) : form.image.startsWith('http') || form.image.startsWith('/') ? (
                                        <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl">{form.image}</span>
                                    )}
                                    <button
                                        onClick={() => imageUploadRef.current?.click()}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                    >
                                        <Upload className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="flex-1 space-y-2">
                                    <input
                                        ref={imageUploadRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => imageUploadRef.current?.click()}
                                        className="btn btn-secondary btn-sm flex items-center gap-2"
                                    >
                                        <ImageIcon className="w-4 h-4" /> Upload Image
                                    </button>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        Upload a 1:1 ratio image. This will be saved to Supabase.
                                    </p>

                                    <div className="pt-2">
                                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Or use emoji:</p>
                                        <EmojiPicker
                                            value={form.image.length < 5 ? form.image : '🎁'} // Only show emoji in picker if it looks like one
                                            onChange={(emoji) => setForm({ ...form, image: emoji })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <button onClick={resetForm} className="btn btn-secondary flex items-center gap-2">
                                <X className="w-4 h-4" /> Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!form.name.trim() || uploading}
                                className="btn btn-success flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Item
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                {data.shopItems.map(item => (
                    <div key={item.id} className={`card flex items-center gap-4 ${editingId === item.id ? 'hidden' : ''}`}>
                        <div className="w-16 h-16 rounded overflow-hidden bg-[var(--color-bg-secondary)] flex-shrink-0 flex items-center justify-center">
                            {item.image.startsWith('http') || item.image.startsWith('/') ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl">{item.image}</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-medium">{item.name}</p>
                                <TierBadge tier={item.tier || 4} />
                            </div>
                            <p className="text-[var(--color-text-muted)] text-sm">
                                {item.price ? `${item.price} pts (Reference)` : 'Gacha Item'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => startEdit(item)}
                                className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => deleteShopItem(item.id)}
                                className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-danger)] transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {data.shopItems.length === 0 && (
                    <div className="text-center py-8 text-[var(--color-text-muted)]">
                        No items found. Add some to populate the Shop Gacha!
                    </div>
                )}
            </div>
        </div>
    );
}

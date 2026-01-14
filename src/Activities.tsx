import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { useData } from './DataContext';
import type { Activity } from './store';

export function Activities() {
    const { data, addActivity, updateActivity, deleteActivity, toggleActivityVisibility } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', type: 'reward' as 'reward' | 'punishment', points: 0 });

    const handleAdd = () => {
        if (!form.name.trim()) return;
        addActivity({
            name: form.name.trim(),
            type: form.type,
            points: form.type === 'punishment' ? -Math.abs(form.points) : Math.abs(form.points),
            isVisible: true,
        });
        setForm({ name: '', type: 'reward', points: 0 });
        setIsAdding(false);
    };

    const handleUpdate = (id: string) => {
        if (!form.name.trim()) return;
        updateActivity(id, {
            name: form.name.trim(),
            type: form.type,
            points: form.type === 'punishment' ? -Math.abs(form.points) : Math.abs(form.points),
        });
        setEditingId(null);
        setForm({ name: '', type: 'reward', points: 0 });
    };

    const startEdit = (activity: Activity) => {
        setEditingId(activity.id);
        setForm({
            name: activity.name,
            type: activity.type,
            points: Math.abs(activity.points),
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsAdding(false);
        setForm({ name: '', type: 'reward', points: 0 });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Activities</h2>
                {!isAdding && !editingId && (
                    <button onClick={() => setIsAdding(true)} className="btn btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Activity
                    </button>
                )}
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="card">
                    <h3 className="text-lg font-medium mb-4">New Activity</h3>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Activity name..."
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="input"
                            autoFocus
                        />
                        <div className="flex gap-4">
                            <select
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value as 'reward' | 'punishment' })}
                                className="input"
                            >
                                <option value="reward">Reward (+)</option>
                                <option value="punishment">Punishment (-)</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Points"
                                value={form.points}
                                onChange={e => setForm({ ...form, points: parseFloat(e.target.value) || 0 })}
                                className="input"
                                min="0"
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

            {/* Activities List */}
            <div className="space-y-3">
                {data.activities.map(activity => (
                    <div
                        key={activity.id}
                        className={`card flex items-center gap-4 ${!activity.isVisible ? 'opacity-50' : ''}`}
                    >
                        {editingId === activity.id ? (
                            <div className="flex-1 space-y-4">
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="input"
                                    autoFocus
                                />
                                <div className="flex gap-4">
                                    <select
                                        value={form.type}
                                        onChange={e => setForm({ ...form, type: e.target.value as 'reward' | 'punishment' })}
                                        className="input"
                                    >
                                        <option value="reward">Reward (+)</option>
                                        <option value="punishment">Punishment (-)</option>
                                    </select>
                                    <input
                                        type="number"
                                        value={form.points}
                                        onChange={e => setForm({ ...form, points: parseFloat(e.target.value) || 0 })}
                                        className="input"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={cancelEdit} className="btn btn-secondary flex items-center gap-2">
                                        <X className="w-4 h-4" /> Cancel
                                    </button>
                                    <button onClick={() => handleUpdate(activity.id)} className="btn btn-success flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1">
                                    <p className="font-medium">{activity.name}</p>
                                    <p className={`text-sm ${activity.type === 'reward' ? 'text-[var(--color-success)]' : 'text-[var(--color-highlight)]'}`}>
                                        {activity.type === 'reward' ? '+' : ''}{activity.points.toFixed(2)} points
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleActivityVisibility(activity.id)}
                                        className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                                        title={activity.isVisible ? 'Hide from dashboard' : 'Show on dashboard'}
                                    >
                                        {activity.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => startEdit(activity)}
                                        className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteActivity(activity.id)}
                                        className="p-2 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-highlight)] transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {data.activities.length === 0 && (
                    <div className="card text-center text-[var(--color-text-muted)]">
                        <p>No activities yet. Create your first one!</p>
                    </div>
                )}
            </div>
        </div>
    );
}

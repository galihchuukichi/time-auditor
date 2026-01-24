import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Save, AlertCircle } from 'lucide-react';
import { useData } from './DataContext';
import type { Quest } from './store';

export function QuestManager() {
    const { data, addQuest, updateQuest, deleteQuest } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Omit<Quest, 'id' | 'isCompleted' | 'currentValue'>>({
        title: '',
        description: '',
        points: 0,
        type: 'daily',
        recurrence: 'repeat',
        targetValue: 1,
        unit: 'times',
        daysOfWeek: []
    });

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            points: 0,
            type: 'daily',
            recurrence: 'repeat',
            targetValue: 1,
            unit: 'times',
            daysOfWeek: []
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleEditClick = (quest: Quest) => {
        setFormData({
            title: quest.title,
            description: quest.description || '',
            points: quest.points,
            type: quest.type,
            recurrence: quest.recurrence,
            targetValue: quest.targetValue || 1,
            unit: quest.unit || 'times',
            daysOfWeek: quest.daysOfWeek || []
        });
        setEditingId(quest.id);
        setIsAdding(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        if (editingId) {
            updateQuest(editingId, formData);
        } else {
            addQuest({ ...formData, currentValue: 0 });
        }
        resetForm();
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this quest?')) {
            deleteQuest(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Edit2 className="w-6 h-6" />
                    Manage Quests
                </h2>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Quest
                    </button>
                )}
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="card border-2 border-[var(--color-primary)]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            {editingId ? 'Edit Quest' : 'New Quest'}
                        </h3>
                        <button onClick={resetForm} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Quest Title</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Push Up 100x"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Details about the quest"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Target Value</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.targetValue}
                                    onChange={e => setFormData({ ...formData, targetValue: Math.max(1, Number(e.target.value)) })}
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Unit (e.g. times, km)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.unit}
                                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    placeholder="times"
                                />
                            </div>
                        </div>

                        {formData.recurrence === 'repeat' && formData.type === 'daily' && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium mb-2">Repeat On Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                                        const isSelected = !formData.daysOfWeek || formData.daysOfWeek.length === 0 || formData.daysOfWeek.includes(index);

                                        return (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => {
                                                    const current = formData.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
                                                    let newDays;
                                                    if (current.includes(index)) {
                                                        // Remove
                                                        newDays = current.filter(d => d !== index);
                                                    } else {
                                                        // Add
                                                        newDays = [...current, index];
                                                    }
                                                    setFormData({ ...formData, daysOfWeek: newDays });
                                                }}
                                                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${isSelected
                                                    ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)] scale-110'
                                                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-yellow-500/50'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                    {!formData.daysOfWeek || formData.daysOfWeek.length === 0 || formData.daysOfWeek.length === 7
                                        ? "Repeats every day"
                                        : "Repeats only on marked days"}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Points Reward</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.points}
                                    onChange={e => setFormData({ ...formData, points: Number(e.target.value) })}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select
                                    className="input"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as 'daily' | 'weekly' })}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Recurrence</label>
                                <select
                                    className="input"
                                    value={formData.recurrence}
                                    onChange={e => setFormData({ ...formData, recurrence: e.target.value as 'once' | 'repeat' })}
                                >
                                    <option value="repeat">Repeats (Resets)</option>
                                    <option value="once">One-time Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
                            <button type="submit" className="btn btn-primary flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                {editingId ? 'Update Quest' : 'Create Quest'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Quest List */}
            <div className="grid grid-cols-1 gap-4">
                {(data.quests || []).length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-muted)] border-2 border-dashed border-[var(--color-border)] rounded-lg">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No quests configured yet.</p>
                        <p className="text-sm">Create your first quest to start earning points!</p>
                    </div>
                ) : (
                    (data.quests || []).map(quest => (
                        <div key={quest.id} className="card flex flex-col sm:flex-row justify-between items-center group gap-4">
                            <div className="w-full text-center sm:text-left">
                                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                                    <h3 className="font-semibold text-lg">{quest.title}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${quest.type === 'daily' ? 'bg-blue-900/50 text-blue-200' : 'bg-purple-900/50 text-purple-200'
                                        }`}>
                                        {quest.type.toUpperCase()}
                                    </span>
                                    {quest.recurrence === 'once' && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                                            ONCE
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-[var(--color-text-muted)]">{quest.description}</p>
                                <p className="text-sm font-medium text-[var(--color-success)] mt-1">
                                    +{quest.points} Points
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditClick(quest)}
                                    className="p-2 hover:bg-[var(--color-accent)] rounded-lg transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(quest.id)}
                                    className="p-2 hover:bg-red-900/30 rounded-lg transition-colors text-[var(--color-text-muted)] hover:text-red-400"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

import { useState, useRef } from 'react';
import { Download, Upload, CheckCircle, XCircle, AlertTriangle, Database, FileJson, Shield } from 'lucide-react';
import { useData } from './DataContext';

export function Settings() {
    const { data, exportData, importData, isCloudConnected } = useData();
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [importMessage, setImportMessage] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        exportData();
        setImportStatus('success');
        setImportMessage('Data exported successfully! Check your downloads folder.');
        setTimeout(() => setImportStatus('idle'), 3000);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show confirmation dialog
        setPendingFile(file);
        setShowConfirmDialog(true);

        // Reset the input so the same file can be selected again
        e.target.value = '';
    };

    const confirmImport = async () => {
        if (!pendingFile) return;

        try {
            const text = await pendingFile.text();
            const success = importData(text);

            if (success) {
                setImportStatus('success');
                setImportMessage('Data imported successfully! All your data has been restored.');
            } else {
                setImportStatus('error');
                setImportMessage('Invalid backup file format. Please select a valid Time Auditor backup file.');
            }
        } catch {
            setImportStatus('error');
            setImportMessage('Failed to read the file. Please try again.');
        }

        setShowConfirmDialog(false);
        setPendingFile(null);
        setTimeout(() => setImportStatus('idle'), 5000);
    };

    const cancelImport = () => {
        setShowConfirmDialog(false);
        setPendingFile(null);
    };

    // Calculate data summary
    const dataSummary = {
        activities: data.activities?.length || 0,
        shopItems: data.shopItems?.length || 0,
        timelineEntries: data.timelineEntries?.length || 0,
        purchaseHistory: data.purchaseHistory?.length || 0,
        logs: data.logs?.length || 0,
        casinoRewards: data.casinoRewards?.length || 0,
        casinoHistory: data.casinoHistory?.length || 0,
        currentPoints: data.currentPoints || 0,
    };

    return (
        <div className="space-y-8">
            {/* Page Title */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gradient mb-2">Settings</h2>
                <p className="text-[var(--color-text-muted)]">Manage your data and preferences</p>
            </div>

            {/* Data Backup Section */}
            <div className="glass rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold">Data Backup</h3>
                        <p className="text-sm text-[var(--color-text-muted)]">Export or import your data</p>
                    </div>
                </div>

                {/* Current Data Summary */}
                <div className="glass-card rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                        <FileJson className="w-4 h-4" />
                        <span>Current Data Summary</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                            <div className="text-lg font-bold text-[var(--color-primary)]">{dataSummary.currentPoints.toFixed(2)}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Points</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                            <div className="text-lg font-bold text-[var(--color-accent)]">{dataSummary.activities}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Activities</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                            <div className="text-lg font-bold text-[var(--color-success)]">{dataSummary.shopItems}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Shop Items</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                            <div className="text-lg font-bold text-[var(--color-highlight)]">{dataSummary.timelineEntries}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Timeline Entries</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                            <div className="text-lg font-bold text-yellow-400">{dataSummary.casinoRewards}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Casino Rewards</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                            <div className="text-lg font-bold text-pink-400">{dataSummary.casinoHistory}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Casino Games</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                            <div className="text-lg font-bold text-blue-400">{dataSummary.purchaseHistory}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Purchases</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                            <div className="text-lg font-bold text-gray-400">{dataSummary.logs}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">Log Entries</div>
                        </div>
                    </div>
                </div>

                {/* Status Message */}
                {importStatus !== 'idle' && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${importStatus === 'success'
                            ? 'bg-[var(--color-success)]/20 border border-[var(--color-success)]/30'
                            : 'bg-red-500/20 border border-red-500/30'
                        }`}>
                        {importStatus === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={importStatus === 'success' ? 'text-[var(--color-success)]' : 'text-red-400'}>
                            {importMessage}
                        </span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg"
                    >
                        <Download className="w-5 h-5" />
                        <span>Export Data</span>
                    </button>

                    {/* Import Button */}
                    <button
                        onClick={handleImportClick}
                        className="flex items-center justify-center gap-3 p-4 rounded-xl bg-[var(--color-bg-secondary)] border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                        <Upload className="w-5 h-5" />
                        <span>Import Data</span>
                    </button>
                </div>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Info Note */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                    <Shield className="w-5 h-5 text-[var(--color-primary)] mt-0.5" />
                    <div className="text-sm text-[var(--color-text-muted)]">
                        <p className="font-medium text-[var(--color-text-secondary)] mb-1">Backup Information</p>
                        <p>Your backup includes all activities, shop items, casino rewards, timeline entries, purchase history, logs, and your current points balance.
                            {isCloudConnected
                                ? ' Your data is also synced to the cloud.'
                                : ' Consider setting up Supabase for cloud backup.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card rounded-2xl p-6 max-w-md w-full space-y-4 animate-scale-in">
                        <div className="flex items-center gap-3 text-yellow-400">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="text-lg font-semibold">Confirm Data Import</h3>
                        </div>
                        <p className="text-[var(--color-text-secondary)]">
                            This will <span className="font-semibold text-red-400">replace all your current data</span> with the data from the backup file. This action cannot be undone.
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            File: <span className="font-mono">{pendingFile?.name}</span>
                        </p>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={cancelImport}
                                className="flex-1 py-3 px-4 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] font-medium hover:bg-[var(--color-border)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmImport}
                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform"
                            >
                                Import & Replace
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

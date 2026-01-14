import { useState } from 'react';
import { ShoppingBag, Check, X } from 'lucide-react';
import { useData } from './DataContext';

export function Shop() {
    const { data, purchaseItem } = useData();
    const [purchasedId, setPurchasedId] = useState<string | null>(null);
    const [errorId, setErrorId] = useState<string | null>(null);

    const handlePurchase = (id: string) => {
        const success = purchaseItem(id);
        if (success) {
            setPurchasedId(id);
            setTimeout(() => setPurchasedId(null), 1500);
        } else {
            setErrorId(id);
            setTimeout(() => setErrorId(null), 1500);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6" />
                    Rewards Shop
                </h2>
                <div className="card py-2 px-4">
                    <span className="text-[var(--color-text-muted)]">Balance: </span>
                    <span className={`font-bold ${data.currentPoints >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-highlight)]'}`}>
                        {data.currentPoints.toFixed(2)} pts
                    </span>
                </div>
            </div>

            {/* Shop Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.shopItems.map(item => {
                    const canAfford = data.currentPoints >= item.price;
                    const isPurchased = purchasedId === item.id;
                    const isError = errorId === item.id;

                    return (
                        <div
                            key={item.id}
                            className={`card flex flex-col items-center text-center transition-all ${isPurchased ? 'ring-2 ring-[var(--color-success)]' : isError ? 'ring-2 ring-[var(--color-highlight)] animate-shake' : ''}`}
                        >
                            <div className="text-6xl mb-4">{item.image}</div>
                            <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                            <p className="text-[var(--color-warning)] font-bold mb-4">{item.price.toFixed(2)} pts</p>
                            <button
                                onClick={() => handlePurchase(item.id)}
                                disabled={!canAfford || isPurchased}
                                className={`btn w-full flex items-center justify-center gap-2 ${canAfford ? 'btn-primary' : 'bg-gray-600 cursor-not-allowed opacity-50'}`}
                            >
                                {isPurchased ? (
                                    <>
                                        <Check className="w-4 h-4" /> Purchased!
                                    </>
                                ) : isError ? (
                                    <>
                                        <X className="w-4 h-4" /> Not enough!
                                    </>
                                ) : (
                                    'Redeem'
                                )}
                            </button>
                        </div>
                    );
                })}

                {data.shopItems.length === 0 && (
                    <div className="col-span-full card text-center text-[var(--color-text-muted)]">
                        <p>No items in shop. Add some in the Shop Manager!</p>
                    </div>
                )}
            </div>

            {/* Purchase History */}
            {data.purchaseHistory.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Purchase History</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {data.purchaseHistory.slice().reverse().map((purchase, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0">
                                <span>{purchase.itemName}</span>
                                <div className="text-right">
                                    <span className="text-[var(--color-highlight)]">-{purchase.price.toFixed(2)} pts</span>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        {new Date(purchase.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

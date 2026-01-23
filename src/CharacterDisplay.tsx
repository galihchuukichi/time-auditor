import { useState } from 'react';
import { useData } from './DataContext';
import { Package, X } from 'lucide-react';
import { getLegendaryAuraClass } from './store';

export function CharacterDisplay() {
    const { data, setData } = useData();
    const [isOpen, setIsOpen] = useState(false);

    // Find selected character
    const selectedCharacter = data.selectedCharacterId
        ? data.inventory.find(i => i.id === data.selectedCharacterId)
        : null;

    const handleSelect = (id: string) => {
        const newData = { ...data, selectedCharacterId: id };
        setData(newData);
        setIsOpen(false);
    };

    const handleClear = () => {
        const newData = { ...data, selectedCharacterId: null };
        setData(newData);
        setIsOpen(false);
    };

    // Chest/Locker Toggle Button - Always visible on bottom right
    // Positioned slightly above the mobile nav if on mobile, but handled via fixed positioning

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">

            {/* Selected Character Preview (Floating) */}
            {selectedCharacter && !isOpen && (
                <div className="pointer-events-auto relative group cursor-pointer" onClick={() => setIsOpen(true)}>
                    {/* Speak Bubble (Optional interaction later) */}

                    {/* Character Container with Float Animation */}
                    <div className="animate-float-y transition-transform hover:scale-110">
                        {/* Aura for Legendary */}
                        {selectedCharacter.tier === 1 && getLegendaryAuraClass(selectedCharacter.name) && (
                            <div className="absolute inset-0 scale-150 opacity-60 pointer-events-none">
                                <div className="fluid-aura-container">
                                    <div className={`fluid-aura-layer ${getLegendaryAuraClass(selectedCharacter.name)}`}></div>
                                    <div className="fluid-aura-layer"></div>
                                </div>
                            </div>
                        )}

                        <div className="w-24 h-24 md:w-32 md:h-32 filter drop-shadow-2xl rounded-2xl overflow-hidden">
                            {(selectedCharacter.image.startsWith('/') || selectedCharacter.image.startsWith('http')) ? (
                                <img
                                    src={selectedCharacter.image}
                                    alt={selectedCharacter.name}
                                    className="w-full h-full object-cover rounded-2xl"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-6xl">
                                    {selectedCharacter.image}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Chest / Locker Toggle */}
            <div className="pointer-events-auto">
                <button
                    onClick={() => setIsOpen(true)}
                    className="btn btn-primary rounded-full w-12 h-12 md:w-14 md:h-14 shadow-lg flex items-center justify-center hover:scale-110 transition-transform group relative"
                    title="Open Locker"
                >
                    <Package className="w-6 h-6 md:w-8 md:h-8" />

                    {/* Notification dot if empty state and no character selected? Maybe unnecessary */}
                </button>
            </div>

            {/* Locker Modal / Popover */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
                    <div className="bg-[#111] border border-[#333] rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl animate-scale-in relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                            <Package className="text-[var(--color-highlight)]" />
                            Select Companion
                        </h2>
                        <p className="text-gray-400 mb-6 text-sm">Choose a character to follow you across the app.</p>

                        <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                            {data.inventory.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <p>Your locker is empty.</p>
                                    <p className="text-sm mt-2">Visit the Casino to win characters!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                    {/* Clear Selection Option */}
                                    <button
                                        onClick={handleClear}
                                        className={`aspect-square rounded-xl border border-dashed border-gray-600 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors
                                            ${!selectedCharacter ? 'ring-2 ring-red-500 bg-red-500/10' : ''}
                                        `}
                                    >
                                        <X className="w-8 h-8 text-gray-500" />
                                        <span className="text-xs font-bold text-gray-400">None</span>
                                    </button>

                                    {/* Inventory Items */}
                                    {data.inventory.map(item => {
                                        const isSelected = selectedCharacter?.id === item.id;
                                        const isLegendary = item.tier === 1;

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelect(item.id)}
                                                className={`relative group aspect-square rounded-xl overflow-hidden border transition-all duration-200
                                                    ${isSelected ? 'ring-2 ring-[var(--color-highlight)] scale-95 opacity-100 z-10' : 'border-gray-800 hover:border-gray-500 opacity-80 hover:opacity-100 hover:scale-105'}
                                                    bg-gray-900
                                                `}
                                            >
                                                {/* Background Gradient for Legendaries */}
                                                {isLegendary && (
                                                    <div className="absolute inset-0 bg-yellow-900/20 animate-pulse-slow"></div>
                                                )}

                                                <div className="absolute inset-0 p-2 flex items-center justify-center">
                                                    {(item.image.startsWith('/') || item.image.startsWith('http')) ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-contain drop-shadow-lg" />
                                                    ) : (
                                                        <span className="text-4xl">{item.image}</span>
                                                    )}
                                                </div>

                                                {/* Name Label */}
                                                <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 text-center">
                                                    <p className={`text-[10px] truncate font-bold
                                                        ${item.tier === 1 ? 'text-yellow-400' :
                                                            item.tier === 2 ? 'text-purple-400' :
                                                                item.tier === 3 ? 'text-blue-400' : 'text-gray-300'}
                                                    `}>
                                                        {item.name}
                                                    </p>
                                                </div>

                                                {/* Selected Indicator */}
                                                {isSelected && (
                                                    <div className="absolute top-1 right-1 w-3 h-3 bg-[var(--color-highlight)] rounded-full shadow-[0_0_8px_var(--color-highlight)]"></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

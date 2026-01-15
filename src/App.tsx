import { useState } from 'react';
import { LayoutDashboard, ListTodo, ShoppingBag, Settings, Bell, Cloud, HardDrive, Dice6, Trophy } from 'lucide-react';
import { DataProvider, useData } from './DataContext';
import { TimerProvider, useTimer } from './TimerContext';
import { Dashboard } from './Dashboard';
import { Activities } from './Activities';
import { Shop } from './Shop';
import { ShopManager } from './ShopManager';
import { Casino } from './Casino';
import { CasinoManager } from './CasinoManager';

type Tab = 'dashboard' | 'activities' | 'shop' | 'manager' | 'casino' | 'casino-manager';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const timer = useTimer();
  const { isCloudConnected, isLoading } = useData();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'activities', label: 'Activities', icon: <ListTodo className="w-5 h-5" /> },
    { id: 'shop', label: 'Shop', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'manager', label: 'Manage Shop', icon: <Settings className="w-5 h-5" /> },
    { id: 'casino', label: 'Casino', icon: <Dice6 className="w-5 h-5" /> },
    { id: 'casino-manager', label: 'Manage Casino', icon: <Trophy className="w-5 h-5" /> },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--color-highlight)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className={`w-6 h-6 ${timer.isRinging ? 'text-[var(--color-highlight)] animate-pulse-ring' : ''}`} />
            <span className="hidden sm:inline">Time Auditor</span>
            <span className="sm:hidden">TA</span>
          </h1>
          <div className="flex items-center gap-2">
            {isCloudConnected ? (
              <span className="flex items-center gap-1 text-xs text-[var(--color-success)]" title="Connected to cloud">
                <Cloud className="w-4 h-4" />
                <span className="hidden sm:inline">Cloud</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]" title="Local storage only">
                <HardDrive className="w-4 h-4" />
                <span className="hidden sm:inline">Local</span>
              </span>
            )}
            {timer.isRinging && (
              <span className="px-3 py-1 bg-[var(--color-highlight)] rounded-full text-sm font-medium animate-pulse">
                🔔
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="glass border-t-0">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'text-[var(--color-highlight)] border-b-2 border-[var(--color-highlight)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'activities' && <Activities />}
        {activeTab === 'shop' && <Shop />}
        {activeTab === 'manager' && <ShopManager />}
        {activeTab === 'casino' && <Casino />}
        {activeTab === 'casino-manager' && <CasinoManager />}
      </main>

      {/* Footer */}
      <footer className="glass border-t-0 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-[var(--color-text-muted)] text-sm">
          <p>Alarms: 9am • 12pm • 3pm • 6pm • 9pm | Pattern: 5min ring → 5min rest → repeat</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <TimerProvider>
        <AppContent />
      </TimerProvider>
    </DataProvider>
  );
}

export default App;

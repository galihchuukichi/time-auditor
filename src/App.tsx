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

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'activities', label: 'Activities', icon: <ListTodo className="w-5 h-5" /> },
  { id: 'shop', label: 'Shop', icon: <ShoppingBag className="w-5 h-5" /> },
  { id: 'manager', label: 'Manage Shop', icon: <Settings className="w-5 h-5" /> },
  { id: 'casino', label: 'Casino', icon: <Dice6 className="w-5 h-5" /> },
  { id: 'casino-manager', label: 'Manage Casino', icon: <Trophy className="w-5 h-5" /> },
];

// Desktop Sidebar Component
function Sidebar({
  activeTab,
  setActiveTab,
  isRinging,
  isCloudConnected
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isRinging: boolean;
  isCloudConnected: boolean;
}) {
  return (
    <nav className="nav-sidebar liquid-glass">
      {/* Brand */}
      <div className="nav-brand">
        <div className="nav-brand-icon">
          <Bell className={`w-7 h-7 ${isRinging ? 'text-[var(--color-highlight)] animate-pulse-ring' : ''}`} />
        </div>
        <span className="nav-brand-text">Time Auditor</span>
      </div>

      {/* Nav Items */}
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
        >
          <div className="nav-item-icon">
            {tab.icon}
          </div>
          <span className="nav-item-text">{tab.label}</span>
        </button>
      ))}

      {/* Connection Status */}
      <div className={`nav-status ${isCloudConnected ? 'connected' : ''}`}>
        <div className="nav-status-icon">
          {isCloudConnected ? <Cloud className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
        </div>
        <span className="nav-status-text">
          {isCloudConnected ? 'Cloud Sync' : 'Local Only'}
        </span>
      </div>
    </nav>
  );
}

// Mobile Bottom Navigation Component
function MobileNav({
  activeTab,
  setActiveTab
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}) {
  return (
    <div className="nav-mobile">
      <div className="nav-mobile-inner liquid-glass">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-mobile-item ${activeTab === tab.id ? 'active' : ''}`}
          >
            <div className="nav-mobile-item-icon">
              {tab.icon}
            </div>
            <span className="nav-mobile-item-text">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const timer = useTimer();
  const { isCloudConnected, isLoading } = useData();

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
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRinging={timer.isRinging}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Content Area */}
      <div className="app-content">
        {/* Header */}
        <header className="app-header glass">
          <h1 className="app-header-title">
            {timer.isRinging && (
              <span className="text-[var(--color-highlight)] animate-pulse">🔔</span>
            )}
            <span className="hidden lg:inline">
              {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
            </span>
            <span className="lg:hidden">Time Auditor</span>
          </h1>
          <div className="app-header-status">
            {isCloudConnected ? (
              <span className="flex items-center gap-1 text-xs text-[var(--color-success)]" title="Connected to cloud">
                <Cloud className="w-4 h-4" />
                <span className="status-text">Cloud</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]" title="Local storage only">
                <HardDrive className="w-4 h-4" />
                <span className="status-text">Local</span>
              </span>
            )}
          </div>
        </header>

        {/* Page Content */}
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

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
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


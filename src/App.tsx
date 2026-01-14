import { useState } from 'react';
import { LayoutDashboard, ListTodo, ShoppingBag, Settings, Bell } from 'lucide-react';
import { DataProvider } from './DataContext';
import { TimerProvider, useTimer } from './TimerContext';
import { Dashboard } from './Dashboard';
import { Activities } from './Activities';
import { Shop } from './Shop';
import { ShopManager } from './ShopManager';

type Tab = 'dashboard' | 'activities' | 'shop' | 'manager';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const timer = useTimer();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'activities', label: 'Activities', icon: <ListTodo className="w-5 h-5" /> },
    { id: 'shop', label: 'Shop', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'manager', label: 'Manage Shop', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className={`w-6 h-6 ${timer.isRinging ? 'text-[var(--color-highlight)] animate-pulse-ring' : ''}`} />
            Time Auditor
          </h1>
          {timer.isRinging && (
            <span className="px-3 py-1 bg-[var(--color-highlight)] rounded-full text-sm font-medium animate-pulse">
              🔔 RINGING
            </span>
          )}
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

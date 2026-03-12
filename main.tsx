import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Settings as SettingsIcon, 
  BarChart3, 
  LogOut, 
  PlusCircle, 
  RefreshCw,
  Warehouse,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Notification, CDODivision, GNDivision, Program, OtherNursery, JournalPrice } from './types';

// Components
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import NurseryDashboard from './components/NurseryDashboard';
import Settings from './components/Settings';
import Reports from './components/Reports';
import ManageOrders from './components/ManageOrders';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [tabNonce, setTabNonce] = useState(0);
  const [isOtherNurseryOpen, setIsOtherNurseryOpen] = useState(false);
  const [isIssueOrdersOpen, setIsIssueOrdersOpen] = useState(false);
  const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);

  // Auto-open sub-menu if active tab is inside it
  useEffect(() => {
    if (['other-details', 'other-receipts'].includes(activeTab)) {
      setIsOtherNurseryOpen(true);
    }
    if (activeTab === 'manage-orders') {
      setIsIssueOrdersOpen(true);
    }
  }, [activeTab]);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('coconut_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('coconut_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('coconut_user');
    setActiveTab('dashboard');
    setSelectedOrderNo(null);
  };

  const handleTabChange = (tab: string, orderNo?: string) => {
    setActiveTab(tab);
    setTabNonce(prev => prev + 1);
    if (orderNo) {
      setSelectedOrderNo(orderNo);
    } else {
      setSelectedOrderNo(null);
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = user.role?.toLowerCase() === 'admin';

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Warehouse size={24} />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">Coconut</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => handleTabChange('dashboard')} 
          />
          
          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Operations</p>
              </div>
              
              <div className="space-y-1">
                <button 
                  onClick={() => setIsIssueOrdersOpen(!isIssueOrdersOpen)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${isIssueOrdersOpen ? 'bg-slate-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={20} />
                    <span className="font-medium">Issue Orders</span>
                  </div>
                  {isIssueOrdersOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                
                <AnimatePresence>
                  {isIssueOrdersOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-9 space-y-1"
                    >
                      <button 
                        onClick={() => handleTabChange('manage-orders')}
                        className={`w-full text-left p-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'manage-orders' ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'manage-orders' ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        Edit/Delete Orders
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-1">
                <button 
                  onClick={() => setIsOtherNurseryOpen(!isOtherNurseryOpen)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${isOtherNurseryOpen ? 'bg-slate-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Warehouse size={20} />
                    <span className="font-medium">Other Nurseries</span>
                  </div>
                  {isOtherNurseryOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                
                <AnimatePresence>
                  {isOtherNurseryOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-9 space-y-1"
                    >
                      <button 
                        onClick={() => handleTabChange('other-details')}
                        className={`w-full text-left p-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'other-details' ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'other-details' ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        Add Details
                      </button>
                      <button 
                        onClick={() => handleTabChange('other-receipts')}
                        className={`w-full text-left p-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'other-receipts' ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'other-receipts' ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        Update Receipts
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          <div className="pt-4 pb-2 px-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analysis</p>
          </div>
          
          <SidebarItem 
            icon={<BarChart3 size={20} />} 
            label="Reports" 
            active={activeTab === 'reports'} 
            onClick={() => handleTabChange('reports')} 
          />

          {isAdmin && (
            <SidebarItem 
              icon={<SettingsIcon size={20} />} 
              label="Settings" 
              active={activeTab === 'settings'} 
              onClick={() => handleTabChange('settings')} 
            />
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 mb-4">
            <p className="text-xs font-medium text-slate-500 mb-1">Logged in as</p>
            <p className="font-bold text-slate-800 truncate">{user.nursery_name || 'Administrator'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'other-details' && 'Other Nursery Details'}
            {activeTab === 'other-receipts' && 'Other Nursery Receipts'}
            {activeTab === 'manage-orders' && 'Manage Issue Orders'}
            {activeTab === 'reports' && 'Management Reports'}
            {activeTab === 'settings' && 'System Settings'}
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs text-slate-500">System Active</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                isAdmin ? <AdminDashboard activeTab={activeTab} tabNonce={tabNonce} selectedYear={selectedYear} onYearChange={setSelectedYear} onNavigate={handleTabChange} /> : <NurseryDashboard user={user} selectedYear={selectedYear} onYearChange={setSelectedYear} />
              )}
              {activeTab === 'other-details' && <AdminDashboard forceOther={true} activeTab={activeTab} tabNonce={tabNonce} selectedYear={selectedYear} onYearChange={setSelectedYear} onNavigate={handleTabChange} />}
              {activeTab === 'other-receipts' && <AdminDashboard forceOtherReceipts={true} activeTab={activeTab} tabNonce={tabNonce} selectedYear={selectedYear} onYearChange={setSelectedYear} onNavigate={handleTabChange} />}
              {activeTab === 'manage-orders' && <ManageOrders initialOrderNo={selectedOrderNo} />}
              {activeTab === 'reports' && <Reports user={user} selectedYear={selectedYear} />}
              {activeTab === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

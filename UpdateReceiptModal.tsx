import { useState, useEffect } from 'react';
import { TrendingUp, Package, CheckCircle2, Clock, Search, RefreshCw, FileText, Calendar, Plus, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { Notification, User, CashSale } from '../types';

// Modals
import UpdateIssuanceModal from './modals/UpdateIssuanceModal';
import AddCashSaleModal from './modals/AddCashSaleModal';

interface NurseryDashboardProps {
  user: User;
  selectedYear: string;
  onYearChange: (year: string) => void;
}

export default function NurseryDashboard({ user, selectedYear, onYearChange }: NurseryDashboardProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cashSales, setCashSales] = useState<CashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCashSaleModalOpen, setIsCashSaleModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'notifications' | 'cash-sales'>('notifications');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?nursery_name=${encodeURIComponent(user.nursery_name || '')}&year=${selectedYear}`);
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchCashSales = async () => {
    try {
      const response = await fetch(`/api/cash-sales?nursery_name=${encodeURIComponent(user.nursery_name || '')}&year=${selectedYear}`);
      const data = await response.json();
      setCashSales(data);
    } catch (err) {
      console.error('Failed to fetch cash sales');
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchCashSales();
  }, [user.nursery_name, selectedYear]);

  const groupedNotifications = notifications.reduce((acc: any[], current) => {
    const existing = acc.find(n => n.notification_no === current.notification_no);
    if (existing) {
      existing.total_quantity += current.quantity;
      existing.total_issued += current.issued_quantity;
      existing.total_received += current.received_receipts;
      if (!existing.gn_names.includes(current.gn_name)) {
        existing.gn_names.push(current.gn_name);
      }
    } else {
      acc.push({
        ...current,
        gn_names: [current.gn_name],
        total_quantity: current.quantity,
        total_issued: current.issued_quantity,
        total_received: current.received_receipts
      });
    }
    return acc;
  }, []);

  const filteredNotifications = groupedNotifications.filter((n: any) => 
    n.notification_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.receipt_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.gn_names.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalQty = notifications.reduce((sum, n) => sum + n.quantity, 0);
  const totalIssued = notifications.reduce((sum, n) => sum + n.issued_quantity, 0);

  const stats = [
    { label: 'Total Quantity', value: totalQty, icon: <Package className="text-blue-600" />, color: 'bg-blue-50' },
    { label: 'Nursery issued seedlings', value: totalIssued, icon: <TrendingUp className="text-emerald-600" />, color: 'bg-emerald-50' },
    { label: 'Balance', value: totalQty - totalIssued, icon: <Clock className="text-amber-600" />, color: 'bg-amber-50' },
    { label: 'Completion Rate', value: totalQty > 0 ? Math.round((totalIssued / totalQty) * 100) : 0, icon: <CheckCircle2 className="text-purple-600" />, color: 'bg-purple-50', suffix: '%' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-emerald-600 rounded-[32px] p-8 text-white shadow-xl shadow-emerald-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Welcome, {user.nursery_name}</h2>
          <p className="text-emerald-100 font-medium">Manage your seedling issuances and track progress</p>
        </div>
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => setIsUpdateModalOpen(true)}
            className="bg-white text-emerald-700 font-bold py-4 px-8 rounded-2xl hover:bg-emerald-50 transition-all shadow-lg flex items-center gap-2"
          >
            <RefreshCw size={20} />
            <span>Update Issuance</span>
          </button>
          <button 
            onClick={() => setIsCashSaleModalOpen(true)}
            className="bg-emerald-500 text-white font-bold py-4 px-8 rounded-2xl hover:bg-emerald-400 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Add Cash Sales</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">
                  {stat.value.toLocaleString()}{stat.suffix}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'notifications' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('cash-sales')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'cash-sales' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Cash Sales
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center flex-1 justify-end">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder={`Search ${activeTab === 'notifications' ? 'notifications' : 'cash sales'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <Calendar className="text-slate-400" size={18} />
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Year:</span>
            <select 
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-bold text-slate-800 cursor-pointer"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'notifications' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notification No</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receipt No</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seedling Type</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Program</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">GN Division</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nursery issued seedlings</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-500 font-medium">Loading your data...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                          <FileText size={32} />
                        </div>
                        <p className="text-slate-500 font-medium">No assigned notifications found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((n: any) => {
                    const isComplete = n.total_quantity === n.total_issued;
                    return (
                      <tr key={n.notification_no} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-xs text-slate-600">{n.date}</td>
                        <td className="p-4 text-xs font-bold text-slate-800">{n.notification_no}</td>
                        <td className="p-4 text-xs text-slate-600">{n.receipt_no}</td>
                        <td className="p-4 text-xs text-slate-600">{n.seedling_type}</td>
                        <td className="p-4 text-xs text-slate-600">{n.program_name}</td>
                        <td className="p-4 text-xs text-slate-600">
                          <div className="max-w-[150px] truncate" title={n.gn_names.join(', ')}>
                            {n.gn_names.join(', ')}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-800">{n.total_quantity}</td>
                        <td className="p-4 text-xs font-semibold text-emerald-600">{n.total_issued}</td>
                        <td className="p-4 text-xs font-medium text-slate-500">{n.total_quantity - n.total_issued}</td>
                        <td className="p-4">
                          {isComplete ? (
                            <span className="text-[10px] font-bold text-emerald-600">Complete</span>
                          ) : (
                            <span className="text-[10px] font-bold text-red-500">Uncomplete</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">CDO Division</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">GN Division</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plant Type</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price (Rs.)</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seedling Type</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-500 font-medium">Loading your data...</p>
                      </div>
                    </td>
                  </tr>
                ) : cashSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                          <DollarSign size={32} />
                        </div>
                        <p className="text-slate-500 font-medium">No cash sales records found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cashSales.filter(cs => 
                    cs.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cs.cdo_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cs.gn_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cs.plant_type.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((cs) => (
                    <tr key={cs.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-xs text-slate-600 font-bold">{cs.month}</td>
                      <td className="p-4 text-xs text-slate-600">{cs.cdo_name}</td>
                      <td className="p-4 text-xs text-slate-600">{cs.gn_name}</td>
                      <td className="p-4 text-xs text-slate-600">{cs.plant_type}</td>
                      <td className="p-4 text-xs text-slate-600 font-medium">Rs. {cs.price?.toFixed(2)}</td>
                      <td className="p-4 text-xs text-slate-600">{cs.seedling_type}</td>
                      <td className="p-4 text-xs font-bold text-slate-800">{cs.quantity.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      <UpdateIssuanceModal 
        isOpen={isUpdateModalOpen} 
        onClose={() => setIsUpdateModalOpen(false)} 
        onSuccess={fetchNotifications}
        nurseryName={user.nursery_name || ''}
      />
      <AddCashSaleModal
        isOpen={isCashSaleModalOpen}
        onClose={() => setIsCashSaleModalOpen(false)}
        onSuccess={() => {
          fetchCashSales();
          setActiveTab('cash-sales');
        }}
        nurseryName={user.nursery_name || ''}
        nurseryType={user.nursery_type as 'Main' | 'Other'}
        selectedYear={selectedYear}
      />
    </div>
  );
}

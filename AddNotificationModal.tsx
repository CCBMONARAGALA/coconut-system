import { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  MoreVertical, 
  TrendingUp, 
  Users, 
  Package,
  CheckCircle2,
  Clock,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification, CDODivision, GNDivision, Program, OtherNursery, JournalPrice } from '../types';

// Modals
import AddNotificationModal from './modals/AddNotificationModal';
import UpdateReceiptModal from './modals/UpdateReceiptModal';

interface AdminDashboardProps {
  forceOther?: boolean;
  forceOtherReceipts?: boolean;
  activeTab?: string;
  tabNonce?: number;
  selectedYear: string;
  onYearChange: (year: string) => void;
  onNavigate?: (tab: string, orderNo?: string) => void;
}

export default function AdminDashboard({ 
  forceOther = false, 
  forceOtherReceipts = false, 
  activeTab = 'dashboard', 
  tabNonce = 0,
  selectedYear,
  onYearChange,
  onNavigate
}: AdminDashboardProps) {
  const [nurseryType, setNurseryType] = useState<'Main' | 'Other'>(forceOther || forceOtherReceipts ? 'Other' : 'Main');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(forceOther);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(forceOtherReceipts);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Fetch all notifications for the selected year to calculate global stats
      const response = await fetch(`/api/notifications?year=${selectedYear}`);
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedYear]); // Fetch when year changes

  useEffect(() => {
    if (forceOther) {
      setNurseryType('Other');
      setIsAddModalOpen(true);
    }
    if (forceOtherReceipts) {
      setNurseryType('Other');
      setIsReceiptModalOpen(true);
    }
    if (!forceOther && !forceOtherReceipts && activeTab === 'dashboard') {
      setNurseryType('Main');
    }
  }, [forceOther, forceOtherReceipts, activeTab, tabNonce]);

  // Filter notifications for the table based on selected nurseryType
  const filteredForTable = notifications.filter(n => n.nursery_type === nurseryType);

  const groupedNotifications = filteredForTable.reduce((acc: any[], current) => {
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
    n.nursery_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalQty = notifications.reduce((sum, n) => sum + n.quantity, 0);
  const totalIssued = notifications.reduce((sum, n) => sum + n.issued_quantity, 0);
  const totalReceived = notifications.reduce((sum, n) => sum + n.received_receipts, 0);

  const stats = [
    { label: 'Total Seedlings', value: totalQty, icon: <Package className="text-blue-600" />, color: 'bg-blue-50' },
    { label: 'Issued Seedlings', value: totalIssued, icon: <TrendingUp className="text-emerald-600" />, color: 'bg-emerald-50' },
    { label: 'Nursery issued seedlings Balance', value: totalQty - totalIssued, icon: <Clock className="text-amber-600" />, color: 'bg-amber-50' },
    { label: 'Update Receipts', value: totalReceived, icon: <RefreshCw className="text-purple-600" />, color: 'bg-purple-50' },
    { label: 'Update Receipts Balance', value: totalIssued - totalReceived, icon: <CheckCircle2 className="text-indigo-600" />, color: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col gap-3">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-xl font-black text-slate-800">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Nursery Type & Year Selector */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setNurseryType('Main')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              nurseryType === 'Main' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Main Nursery
          </button>
          <button
            onClick={() => setNurseryType('Other')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              nurseryType === 'Other' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Other Nurseries
          </button>
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

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search issue orders, receipts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsReceiptModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-2xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={18} />
            <span>Update Receipts</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-3 px-6 rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
          >
            <PlusCircle size={18} />
            <span>Add New Issue Order</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Order No</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receipt No</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seedling Type</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Journal Price</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Program</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">CDO Division</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">GN Division</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nursery issued seedlings</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nursery issued seedlings Balance</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Update Receipts</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Update Receipts Balance</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={14} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-500 font-medium">Loading notifications...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <FileText size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">No notifications found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((n: any) => {
                  const isComplete = n.total_quantity === n.total_issued && n.total_issued === n.total_received;
                  return (
                    <tr key={n.notification_no} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 text-xs text-slate-600 whitespace-nowrap">{n.date}</td>
                      <td className="p-4 text-xs font-bold text-slate-800">{n.notification_no}</td>
                      <td className="p-4 text-xs text-slate-600">{n.receipt_no}</td>
                      <td className="p-4 text-xs text-slate-600">{n.seedling_type}</td>
                      <td className="p-4 text-xs text-slate-600">Rs. {n.journal_price}</td>
                      <td className="p-4 text-xs text-slate-600">{n.program_name}</td>
                      <td className="p-4 text-xs text-slate-600">{n.cdo_name}</td>
                      <td className="p-4 text-xs text-slate-600">
                        <div className="max-w-[150px] truncate" title={n.gn_names.join(', ')}>
                          {n.gn_names.join(', ')}
                        </div>
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-800">{n.total_quantity}</td>
                      <td className="p-4 text-xs font-semibold text-emerald-600">{n.total_issued}</td>
                      <td className="p-4 text-xs font-medium text-slate-500">{n.total_quantity - n.total_issued}</td>
                      <td className="p-4 text-xs font-semibold text-blue-600">{n.total_received}</td>
                      <td className="p-4 text-xs font-medium text-slate-500">{n.total_issued - n.total_received}</td>
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
        </div>
      </div>

      {/* Modals */}
      <AddNotificationModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchNotifications}
        isOther={nurseryType === 'Other'}
      />
      <UpdateReceiptModal 
        isOpen={isReceiptModalOpen} 
        onClose={() => setIsReceiptModalOpen(false)} 
        onSuccess={fetchNotifications}
        isOther={nurseryType === 'Other'}
      />
    </div>
  );
}

import { FileText } from 'lucide-react';

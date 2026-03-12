import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Briefcase, 
  Warehouse, 
  DollarSign,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CDODivision, GNDivision, Program, OtherNursery, JournalPrice, CashSalesPrice, CashSale } from '../types';
import AddCashSaleModal from './modals/AddCashSaleModal';

export default function Settings() {
  const [activeSubTab, setActiveSubTab] = useState('cdo');
  const [cdoDivisions, setCdoDivisions] = useState<CDODivision[]>([]);
  const [gnDivisions, setGnDivisions] = useState<GNDivision[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [otherNurseries, setOtherNurseries] = useState<OtherNursery[]>([]);
  const [journalPrices, setJournalPrices] = useState<JournalPrice[]>([]);
  const [cashSalesPrices, setCashSalesPrices] = useState<CashSalesPrice[]>([]);
  const [otherNurseryCashSales, setOtherNurseryCashSales] = useState<any[]>([]);
  
  const [newName, setNewName] = useState('');
  const [newCdoId, setNewCdoId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCashSaleModalOpen, setIsCashSaleModalOpen] = useState(false);
  const [selectedOtherNursery, setSelectedOtherNursery] = useState<OtherNursery | null>(null);

  const fetchData = async () => {
    try {
      const [cdo, gn, prog, other, price, cashPrice] = await Promise.all([
        fetch('/api/cdo-divisions').then(r => r.json()),
        fetch('/api/gn-divisions').then(r => r.json()),
        fetch('/api/programs').then(r => r.json()),
        fetch('/api/other-nurseries-list').then(r => r.json()),
        fetch('/api/journal-prices').then(r => r.json()),
        fetch('/api/cash-sales-prices').then(r => r.json())
      ]);
      setCdoDivisions(cdo);
      setGnDivisions(gn);
      setPrograms(prog);
      setOtherNurseries(other);
      setJournalPrices(price);
      setCashSalesPrices(cashPrice);
    } catch (err) {
      console.error('Failed to fetch settings data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    let endpoint = '';
    let body: any = {};

    switch(activeSubTab) {
      case 'cdo': endpoint = '/api/cdo-divisions'; body = { name: newName }; break;
      case 'gn': endpoint = '/api/gn-divisions'; body = { name: newName, cdo_id: parseInt(newCdoId) }; break;
      case 'program': endpoint = '/api/programs'; body = { name: newName }; break;
      case 'nursery': endpoint = '/api/other-nurseries-list'; body = { name: newName }; break;
      case 'price': endpoint = '/api/journal-prices'; body = { price: parseFloat(newPrice) }; break;
      case 'cash-price': endpoint = '/api/cash-sales-prices'; body = { price: parseFloat(newPrice) }; break;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setNewName('');
        setNewCdoId('');
        setNewPrice('');
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add item');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    let endpoint = '';
    switch(activeSubTab) {
      case 'cdo': endpoint = `/api/cdo-divisions/${id}`; break;
      case 'gn': endpoint = `/api/gn-divisions/${id}`; break;
      case 'program': endpoint = `/api/programs/${id}`; break;
      case 'nursery': endpoint = `/api/other-nurseries-list/${id}`; break;
      case 'price': endpoint = `/api/journal-prices/${id}`; break;
      case 'cash-price': endpoint = `/api/cash-sales-prices/${id}`; break;
    }

    if (confirm('Are you sure you want to delete this item?')) {
      await fetch(endpoint, { method: 'DELETE' });
      fetchData();
    }
  };

  const tabs = [
    { id: 'cdo', label: 'CDO Divisions', icon: <MapPin size={18} /> },
    { id: 'gn', label: 'GN Divisions', icon: <MapPin size={18} /> },
    { id: 'program', label: 'Programs', icon: <Briefcase size={18} /> },
    { id: 'nursery', label: 'Other Nurseries', icon: <Warehouse size={18} /> },
    { id: 'price', label: 'Journal Prices', icon: <DollarSign size={18} /> },
    { id: 'cash-price', label: 'Cash Sales Prices', icon: <DollarSign size={18} /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar Tabs */}
      <div className="lg:col-span-3 space-y-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id);
              setError('');
              setNewName('');
            }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
              activeSubTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {tab.icon}
              <span className="font-bold">{tab.label}</span>
            </div>
            <ChevronRight size={16} className={activeSubTab === tab.id ? 'opacity-100' : 'opacity-0'} />
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="lg:col-span-9 space-y-6">
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            Register New {tabs.find(t => t.id === activeSubTab)?.label.slice(0, -1)}
          </h3>

          <form onSubmit={handleAdd} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-4">
                  {activeSubTab === 'gn' && (
                    <select
                      required
                      value={newCdoId}
                      onChange={e => setNewCdoId(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    >
                      <option value="">Select CDO Division</option>
                      {cdoDivisions.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}

                  {activeSubTab === 'price' || activeSubTab === 'cash-price' ? (
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Enter price..."
                        value={newPrice}
                        onChange={e => setNewPrice(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder={`Enter ${activeSubTab === 'nursery' ? 'nursery' : 'name'}...`}
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 text-white font-bold py-4 px-8 rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 flex items-center gap-2 justify-center"
                  >
                    <Plus size={20} />
                    <span>Add Item</span>
                  </button>
                </div>
              </form>
        </div>

        {/* List Area */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50">
            <h4 className="font-bold text-slate-800">Registered {tabs.find(t => t.id === activeSubTab)?.label}</h4>
          </div>
          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
            {activeSubTab === 'cdo' && cdoDivisions.map(item => (
              <div key={item.id}><ListItem label={item.name} onDelete={() => handleDelete(item.id)} /></div>
            ))}
            {activeSubTab === 'gn' && gnDivisions.map(item => (
              <div key={item.id}><ListItem label={item.name} subLabel={`CDO: ${item.cdo_name}`} onDelete={() => handleDelete(item.id)} /></div>
            ))}
            {activeSubTab === 'program' && programs.map(item => (
              <div key={item.id}><ListItem label={item.name} onDelete={() => handleDelete(item.id)} /></div>
            ))}
            {activeSubTab === 'nursery' && otherNurseries.map(item => (
              <div key={item.id}><ListItem label={item.name} onDelete={() => handleDelete(item.id)} /></div>
            ))}
            {activeSubTab === 'price' && journalPrices.map(item => (
              <div key={item.id}><ListItem label={`Rs. ${item.price.toFixed(2)}`} onDelete={() => handleDelete(item.id)} /></div>
            ))}
            {activeSubTab === 'cash-price' && cashSalesPrices.map(item => (
              <div key={item.id}><ListItem label={`Rs. ${item.price.toFixed(2)}`} onDelete={() => handleDelete(item.id)} /></div>
            ))}
            
            {((activeSubTab === 'cdo' && cdoDivisions.length === 0) ||
              (activeSubTab === 'gn' && gnDivisions.length === 0) ||
              (activeSubTab === 'program' && programs.length === 0) ||
              (activeSubTab === 'nursery' && otherNurseries.length === 0) ||
              (activeSubTab === 'price' && journalPrices.length === 0) ||
              (activeSubTab === 'cash-price' && cashSalesPrices.length === 0)) && (
              <div className="p-12 text-center text-slate-400 font-medium">No items registered yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListItem({ label, subLabel, onDelete }: { label: string, subLabel?: string, onDelete: () => void | Promise<void> }) {
  return (
    <div className="p-4 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
      <div>
        <p className="font-bold text-slate-700">{label}</p>
        {subLabel && <p className="text-xs text-slate-500 font-medium">{subLabel}</p>}
      </div>
      <button 
        onClick={onDelete}
        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

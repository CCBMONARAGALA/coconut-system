import React, { useState, useEffect } from 'react';
import { X, Calendar, Hash, FileText, MapPin, Warehouse, Tag, DollarSign, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CDODivision, GNDivision, Program, OtherNursery, JournalPrice } from '../../types';

interface AddNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isOther?: boolean;
}

interface GNEntry {
  gn_id: string;
  quantity: string;
  issued_quantity: string;
}

export default function AddNotificationModal({ isOpen, onClose, onSuccess, isOther = false }: AddNotificationModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notification_no: '',
    receipt_no: '',
    seedling_type: 'Field',
    program_id: '',
    cdo_id: '',
    journal_price_id: '',
    nursery_name: ''
  });

  const [gnEntries, setGnEntries] = useState<GNEntry[]>([{ gn_id: '', quantity: '', issued_quantity: '' }]);

  const [cdoDivisions, setCdoDivisions] = useState<CDODivision[]>([]);
  const [gnDivisions, setGnDivisions] = useState<GNDivision[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [otherNurseries, setOtherNurseries] = useState<OtherNursery[]>([]);
  const [journalPrices, setJournalPrices] = useState<JournalPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      setSuccess(false);
      setError('');
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const [cdoRes, gnRes, progRes, otherRes, priceRes] = await Promise.all([
        fetch('/api/cdo-divisions'),
        fetch('/api/gn-divisions'),
        fetch('/api/programs'),
        fetch('/api/other-nurseries-list'),
        fetch('/api/journal-prices')
      ]);

      setCdoDivisions(await cdoRes.json());
      setGnDivisions(await gnRes.json());
      setPrograms(await progRes.json());
      setOtherNurseries(await otherRes.json());
      setJournalPrices(await priceRes.json());
    } catch (err) {
      console.error('Failed to fetch settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const filteredGN = gnDivisions.filter(gn => gn.cdo_id === parseInt(formData.cdo_id));

  const addGNEntry = () => {
    setGnEntries([...gnEntries, { gn_id: '', quantity: '', issued_quantity: '' }]);
  };

  const removeGNEntry = (index: number) => {
    if (gnEntries.length > 1) {
      setGnEntries(gnEntries.filter((_, i) => i !== index));
    }
  };

  const updateGNEntry = (index: number, field: keyof GNEntry, value: string) => {
    const newEntries = [...gnEntries];
    newEntries[index][field] = value;
    setGnEntries(newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (gnEntries.some(entry => !entry.gn_id || !entry.quantity)) {
      setError('Please fill all GN Division entries and quantities');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          program_id: parseInt(formData.program_id),
          cdo_id: parseInt(formData.cdo_id),
          journal_price_id: parseInt(formData.journal_price_id),
          nursery_type: isOther ? 'Other' : 'Main',
          gn_entries: gnEntries.map(entry => ({
            gn_id: parseInt(entry.gn_id),
            quantity: parseInt(entry.quantity),
            issued_quantity: isOther ? (parseInt(entry.issued_quantity) || 0) : 0
          }))
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        onSuccess();
        
        // Wait for 1.5s before closing
        setTimeout(() => {
          onClose();
          setFormData({
            date: new Date().toISOString().split('T')[0],
            notification_no: '',
            receipt_no: '',
            seedling_type: 'Field',
            program_id: '',
            cdo_id: '',
            journal_price_id: '',
            nursery_name: ''
          });
          setGnEntries([{ gn_id: '', quantity: '' }]);
          setSuccess(false);
        }, 1500);
      } else {
        setError(data.error || 'Failed to save notification');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
      >
        {settingsLoading && (
          <div className="absolute inset-0 z-[60] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 font-bold">Loading settings...</p>
          </div>
        )}
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="p-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">Success!</h3>
              <p className="text-slate-500 text-lg">Issue order has been added successfully.</p>
            </motion.div>
          ) : (
            <motion.div key="form">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {isOther ? 'Other Nursery Issue Order' : 'Add New Issue Order'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">Enter seedling distribution details</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="date" 
                        required
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Issue Order No</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. ORD-2024-001"
                        value={formData.notification_no}
                        onChange={e => setFormData({...formData, notification_no: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Receipt No</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. REC-5542"
                        value={formData.receipt_no}
                        onChange={e => setFormData({...formData, receipt_no: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Seedling Type</label>
                    <select 
                      required
                      value={formData.seedling_type}
                      onChange={e => setFormData({...formData, seedling_type: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    >
                      <option value="Field">Field</option>
                      <option value="Potted">Potted</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Journal Price</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        required
                        value={formData.journal_price_id}
                        onChange={e => setFormData({...formData, journal_price_id: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                      >
                        <option value="">Select Price</option>
                        {journalPrices.map(p => (
                          <option key={p.id} value={p.id}>Rs. {p.price.toFixed(2)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Program</label>
                    <select 
                      required
                      value={formData.program_id}
                      onChange={e => setFormData({...formData, program_id: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    >
                      <option value="">Select Program</option>
                      {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">CDO Division</label>
                    <select 
                      required
                      value={formData.cdo_id}
                      onChange={e => {
                        setFormData({...formData, cdo_id: e.target.value});
                        // Reset GN entries when CDO changes
                        setGnEntries([{ gn_id: '', quantity: '', issued_quantity: '' }]);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    >
                      <option value="">Select CDO Division</option>
                      {cdoDivisions.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Nursery</label>
                    <div className="relative">
                      <Warehouse className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        required
                        value={formData.nursery_name}
                        onChange={e => setFormData({...formData, nursery_name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                      >
                        <option value="">Select Nursery</option>
                        {isOther ? (
                          otherNurseries.map(n => (
                            <option key={n.id} value={n.name}>{n.name}</option>
                          ))
                        ) : (
                          <>
                            <option value="Walipitiya Nursery">Walipitiya Nursery</option>
                            <option value="Hadpanagal Nursery">Hadpanagal Nursery</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">GN Division Quantities</h4>
                    <button 
                      type="button"
                      onClick={addGNEntry}
                      disabled={!formData.cdo_id}
                      className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                    >
                      <Plus size={14} />
                      Add GN Division
                    </button>
                  </div>

                  <div className="space-y-3">
                    {gnEntries.map((entry, index) => (
                      <div key={index} className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">GN Division</label>
                          <select 
                            required
                            disabled={!formData.cdo_id}
                            value={entry.gn_id}
                            onChange={e => updateGNEntry(index, 'gn_id', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                          >
                            <option value="">Select GN Division</option>
                            {filteredGN.map(g => (
                              <option key={g.id} value={g.id.toString()}>{g.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24 space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Quantity</label>
                          <input 
                            type="number" 
                            required
                            placeholder="0"
                            value={entry.quantity}
                            onChange={e => updateGNEntry(index, 'quantity', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          />
                        </div>
                        {isOther && (
                          <div className="w-24 space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Issued</label>
                            <input 
                              type="number" 
                              required
                              placeholder="0"
                              value={entry.issued_quantity}
                              onChange={e => updateGNEntry(index, 'issued_quantity', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            />
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={() => removeGNEntry(index)}
                          disabled={gnEntries.length === 1}
                          className="p-2.5 text-slate-400 hover:text-red-500 disabled:opacity-0 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Issue Order'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}



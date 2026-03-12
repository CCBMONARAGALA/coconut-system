import React, { useState, useEffect } from 'react';
import { X, Search, TrendingUp, CheckCircle2, AlertCircle, Package, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from '../../types';

interface UpdateIssuanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  nurseryName: string;
}

export default function UpdateIssuanceModal({ isOpen, onClose, onSuccess, nurseryName }: UpdateIssuanceModalProps) {
  const [searchNo, setSearchNo] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [issueCount, setIssueCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError('');
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchNo) return;
    setSearching(true);
    setError('');
    setNotifications([]);
    setSelectedNotification(null);
    try {
      const response = await fetch(`/api/notifications/${searchNo}`);
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : [data];
        const filtered = results.filter(n => n.nursery_name === nurseryName);
        
        if (filtered.length === 0) {
          setError('No entries for this notification assigned to your nursery');
        } else {
          setNotifications(filtered);
        }
      } else {
        setError('Notification not found');
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (n: Notification) => {
    setSelectedNotification(n);
    setIssueCount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotification) return;
    
    const count = parseInt(issueCount);
    if (isNaN(count) || count <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (selectedNotification.issued_quantity + count > selectedNotification.quantity) {
      setError(`Cannot issue more than total quantity (${selectedNotification.quantity})`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/notifications/${selectedNotification.id}/issue`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issued_quantity: count }),
      });

      if (response.ok) {
        setSuccess(true);
        onSuccess();
        
        setTimeout(() => {
          onClose();
          setSearchNo('');
          setNotifications([]);
          setSelectedNotification(null);
          setSuccess(false);
        }, 1500);
      } else {
        setError('Failed to update issuance');
      }
    } catch (err) {
      setError('Update failed');
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
        className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
      >
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
              <h3 className="text-3xl font-bold text-slate-800">Issued!</h3>
              <p className="text-slate-500 text-lg">Issuance has been recorded successfully.</p>
            </motion.div>
          ) : (
            <motion.div key="form">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Update Issuance</h3>
                  <p className="text-sm text-slate-500 font-medium">Record seedling distribution to farmers</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Notification Number</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Enter notification no..."
                        value={searchNo}
                        onChange={e => setSearchNo(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleSearch}
                      disabled={searching}
                      className="bg-slate-800 text-white px-6 rounded-2xl font-bold hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      {searching ? '...' : 'Search'}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-2xl text-sm font-medium border border-red-100"
                    >
                      <AlertCircle size={18} />
                      {error}
                    </motion.div>
                  )}

                  {notifications.length > 0 && !selectedNotification && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select GN Division to Issue</p>
                      <div className="space-y-2">
                        {notifications.map(n => (
                          <button
                            key={n.id}
                            onClick={() => handleSelect(n)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-100 transition-all group text-left"
                          >
                            <div>
                              <p className="font-bold text-slate-800">{n.gn_name}</p>
                              <p className="text-xs text-slate-500">{n.seedling_type} | Issued: {n.issued_quantity}/{n.quantity}</p>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {selectedNotification && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Entry</p>
                            <h4 className="text-lg font-bold text-slate-800">{selectedNotification.gn_name}</h4>
                          </div>
                          <button 
                            onClick={() => setSelectedNotification(null)}
                            className="text-[10px] font-bold text-emerald-600 hover:underline"
                          >
                            CHANGE
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Seedling Type</p>
                            <p className="font-semibold text-slate-700">{selectedNotification.seedling_type}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Remaining</p>
                            <p className="font-bold text-emerald-600">{selectedNotification.quantity - selectedNotification.issued_quantity}</p>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 ml-1">New Issuance Quantity</label>
                          <div className="relative">
                            <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                              type="number" 
                              required
                              min="1"
                              max={selectedNotification.quantity - selectedNotification.issued_quantity}
                              placeholder="Enter quantity to issue now..."
                              value={issueCount}
                              onChange={e => setIssueCount(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {loading ? 'Updating...' : (
                            <>
                              <TrendingUp size={20} />
                              <span>Confirm Issuance</span>
                            </>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}



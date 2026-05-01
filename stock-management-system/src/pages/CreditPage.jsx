import { useState, useMemo } from 'react';
import { Plus, Search, CreditCard, DollarSign, CheckCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/helpers';

const STATUS_LABELS = { pending: 'Unpaid', partial: 'Partial', paid: 'Paid' };
const STATUS_CLASSES = { pending: 'badge-danger', partial: 'badge-warning', paid: 'badge-success' };

const EMPTY_FORM = { customerName: '', totalAmount: '', items: '', date: new Date().toISOString().split('T')[0], notes: '' };
const EMPTY_PAY = { amount: '', note: '' };

export default function CreditPage() {
  const { state, actions } = useApp();
  const { credits } = state;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [payForm, setPayForm] = useState(EMPTY_PAY);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    let list = [...credits].reverse();
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.customerName.toLowerCase().includes(q) ||
        c.items?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [credits, search, statusFilter]);

  const totals = useMemo(() => ({
    totalOwed: credits.filter(c => c.status !== 'paid').reduce((s, c) => s + c.balance, 0),
    totalRecords: credits.length,
    unpaidCount: credits.filter(c => c.status === 'pending').length,
  }), [credits]);

  const handleAddCredit = (e) => {
    e.preventDefault();
    actions.addCredit({
      customerName: form.customerName,
      totalAmount: parseFloat(form.totalAmount),
      items: form.items,
      date: form.date,
      notes: form.notes,
    });
    setForm(EMPTY_FORM);
    setModal(null);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    const amount = parseFloat(payForm.amount);
    if (!amount || amount <= 0 || !selectedCredit) return;
    if (amount > selectedCredit.balance) {
      actions.toast('Payment exceeds outstanding balance!', 'warning');
      return;
    }
    actions.recordPayment(selectedCredit.id, { amount, note: payForm.note }, selectedCredit);
    setPayForm(EMPTY_PAY);
    setModal(null);
    setSelectedCredit(null);
  };

  const openPayment = (credit) => {
    setSelectedCredit(credit);
    setPayForm(EMPTY_PAY);
    setModal('payment');
  };

  const handleDelete = (credit) => {
    if (window.confirm(`Delete credit record for "${credit.customerName}"?`)) {
      actions.deleteCredit(credit.id);
    }
  };

  const toggleExpand = (id) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="page-enter space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Credit Ledger</h1>
          <p className="text-white/40 text-sm">{credits.length} records</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setModal('add'); }}
          className="btn-gold px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Plus size={16} /> Add Credit
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <GlassCard className="p-3 text-center" gold>
          <p className="text-lg font-bold text-gold-400">{formatCurrency(totals.totalOwed)}</p>
          <p className="text-white/40 text-xs mt-0.5">Total Owed</p>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <p className="text-lg font-bold text-red-400">{totals.unpaidCount}</p>
          <p className="text-white/40 text-xs mt-0.5">Unpaid</p>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <p className="text-lg font-bold text-white">{totals.totalRecords}</p>
          <p className="text-white/40 text-xs mt-0.5">Records</p>
        </GlassCard>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer or items..."
            className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="glass-input px-3 py-2.5 rounded-xl text-sm"
        >
          <option value="all">All</option>
          <option value="pending">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Credit list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <CreditCard size={32} className="mx-auto mb-2 text-white/20" />
            <p className="text-white/30 text-sm">No credit records found.</p>
          </GlassCard>
        ) : (
          filtered.map(credit => (
            <GlassCard key={credit.id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{credit.customerName}</p>
                      <span className={STATUS_CLASSES[credit.status]}>{STATUS_LABELS[credit.status]}</span>
                    </div>
                    <p className="text-white/50 text-xs mt-0.5">{credit.items}</p>
                    <p className="text-white/35 text-xs">{formatDate(credit.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-red-400">{formatCurrency(credit.balance)}</p>
                    <p className="text-white/35 text-xs">of {formatCurrency(credit.totalAmount)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all"
                    style={{ width: `${(credit.amountPaid / credit.totalAmount) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>Paid: {formatCurrency(credit.amountPaid)}</span>
                  <span>{((credit.amountPaid / credit.totalAmount) * 100).toFixed(0)}%</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {credit.status !== 'paid' && (
                    <button
                      onClick={() => openPayment(credit)}
                      className="btn-gold flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <DollarSign size={13} /> Record Payment
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpand(credit.id)}
                    className="btn-glass px-3 py-2 rounded-lg text-xs flex items-center gap-1"
                  >
                    History {expanded === credit.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  <button
                    onClick={() => handleDelete(credit)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Payment history accordion */}
              {expanded === credit.id && (
                <div className="px-4 pb-4 border-t border-white/10 mt-1 pt-3">
                  <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Payment History</p>
                  {(!credit.payments || credit.payments.length === 0) ? (
                    <p className="text-white/25 text-xs">No payments recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {credit.payments.map((pay, i) => (
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                          <div>
                            <p className="text-xs text-white/70">{formatDate(pay.date)}</p>
                            {pay.note && <p className="text-xs text-white/35">{pay.note}</p>}
                          </div>
                          <p className="text-sm font-bold text-green-400">{formatCurrency(pay.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          ))
        )}
      </div>

      {/* Add Credit Modal */}
      <Modal isOpen={modal === 'add'} onClose={() => setModal(null)} title="Add Credit Entry" size="md">
        <form onSubmit={handleAddCredit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/55 mb-1.5">Customer Name *</label>
            <input
              required
              value={form.customerName}
              onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
              placeholder="e.g. Abena Mensah"
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/55 mb-1.5">Amount Owed (GHS) *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={form.totalAmount}
                onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                placeholder="0.00"
                className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-white/55 mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/55 mb-1.5">Items / Description *</label>
            <input
              required
              value={form.items}
              onChange={e => setForm(f => ({ ...f, items: e.target.value }))}
              placeholder="e.g. 2x Soap, 1x Oil"
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-white/55 mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setModal(null)} className="btn-glass flex-1 py-3 rounded-xl text-sm">Cancel</button>
            <button type="submit" className="btn-gold flex-1 py-3 rounded-xl text-sm font-bold">Add Credit</button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={modal === 'payment'} onClose={() => { setModal(null); setSelectedCredit(null); }} title="Record Payment" size="sm">
        {selectedCredit && (
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="glass-card-gold p-3 rounded-xl">
              <p className="font-semibold text-white">{selectedCredit.customerName}</p>
              <div className="flex justify-between mt-1">
                <span className="text-white/50 text-sm">Balance Due:</span>
                <span className="text-red-400 font-bold">{formatCurrency(selectedCredit.balance)}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/55 mb-1.5">Payment Amount (GHS) *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                max={selectedCredit.balance}
                value={payForm.amount}
                onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                autoFocus
                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
              />
              {payForm.amount && parseFloat(payForm.amount) > 0 && (
                <p className="text-white/40 text-xs mt-1.5">
                  Remaining after payment: {formatCurrency(selectedCredit.balance - parseFloat(payForm.amount || 0))}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs text-white/55 mb-1.5">Note (optional)</label>
              <input
                value={payForm.note}
                onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Cash payment"
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setModal(null); setSelectedCredit(null); }} className="btn-glass flex-1 py-3 rounded-xl text-sm">Cancel</button>
              <button type="submit" className="btn-gold flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <CheckCircle size={15} /> Record Payment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

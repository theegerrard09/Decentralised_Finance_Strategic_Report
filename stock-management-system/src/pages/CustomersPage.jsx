import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Phone, Mail, MapPin, CreditCard } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';

const EMPTY = { name: '', phone: '', email: '', address: '', notes: '' };

export default function CustomersPage() {
  const { state, actions } = useApp();
  const { customers, credits } = state;

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const getCreditBalance = (name) => {
    const pending = credits.filter(c => c.customerName.toLowerCase() === name.toLowerCase() && c.status !== 'paid');
    return pending.reduce((s, c) => s + c.balance, 0);
  };

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' }); setEditId(c.id); setModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) actions.updateCustomer(editId, form);
    else actions.addCustomer(form);
    setModal(false);
  };

  const handleDelete = (c) => {
    if (window.confirm(`Remove customer "${c.name}"?`)) actions.deleteCustomer(c.id);
  };

  return (
    <div className="page-enter space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Customers</h1>
          <p className="text-white/40 text-sm">{customers.length} contacts</p>
        </div>
        <button onClick={openAdd} className="btn-gold px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <Users size={32} className="mx-auto mb-2 text-white/20" />
            <p className="text-white/30 text-sm">No customers found.</p>
          </GlassCard>
        ) : filtered.map(c => {
          const balance = getCreditBalance(c.name);
          return (
            <GlassCard key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center shrink-0">
                      <span className="text-gold-400 font-bold text-sm">{c.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white">{c.name}</p>
                        {balance > 0 && (
                          <span className="badge-danger flex items-center gap-1">
                            <CreditCard size={10} /> {formatCurrency(balance)}
                          </span>
                        )}
                      </div>
                      {c.notes && <p className="text-white/40 text-xs">{c.notes}</p>}
                    </div>
                  </div>
                  <div className="mt-2.5 space-y-1 pl-11">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-xs text-white/55 hover:text-white transition-colors">
                        <Phone size={12} /> {c.phone}
                      </a>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-white/55 hover:text-white transition-colors">
                        <Mail size={12} /> {c.email}
                      </a>
                    )}
                    {c.address && (
                      <p className="flex items-center gap-2 text-xs text-white/40">
                        <MapPin size={12} /> {c.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 ml-2">
                  <button onClick={() => openEdit(c)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(c)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Customer' : 'Add Customer'} size="md">
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: 'name', label: 'Full Name *', placeholder: 'e.g. Abena Mensah', required: true },
            { key: 'phone', label: 'Phone Number', placeholder: '0244 123456' },
            { key: 'email', label: 'Email', placeholder: 'customer@example.com', type: 'email' },
            { key: 'address', label: 'Address', placeholder: 'City, Region' },
          ].map(({ key, label, placeholder, required, type = 'text' }) => (
            <div key={key}>
              <label className="block text-xs text-white/55 mb-1.5">{label}</label>
              <input
                required={required}
                type={type}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-white/55 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Regular customer, prefers morning visits"
              rows={2}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-glass flex-1 py-3 rounded-xl text-sm">Cancel</button>
            <button type="submit" className="btn-gold flex-1 py-3 rounded-xl text-sm font-bold">
              {editId ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

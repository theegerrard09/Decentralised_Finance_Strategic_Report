import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Truck, Phone, Mail, MapPin } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';

const EMPTY = { name: '', phone: '', email: '', address: '', notes: '' };

export default function SuppliersPage() {
  const { state, actions } = useApp();
  const { suppliers } = state;

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (s) => { setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', notes: s.notes || '' }); setEditId(s.id); setModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) actions.updateSupplier(editId, form);
    else actions.addSupplier(form);
    setModal(false);
  };

  const handleDelete = (s) => {
    if (window.confirm(`Remove supplier "${s.name}"?`)) actions.deleteSupplier(s.id);
  };

  return (
    <div className="page-enter space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Suppliers</h1>
          <p className="text-white/40 text-sm">{suppliers.length} contacts</p>
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
          placeholder="Search suppliers..."
          className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <Truck size={32} className="mx-auto mb-2 text-white/20" />
            <p className="text-white/30 text-sm">No suppliers found.</p>
          </GlassCard>
        ) : filtered.map(s => (
          <GlassCard key={s.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Truck size={16} className="text-indigo-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{s.name}</p>
                    {s.notes && <p className="text-white/40 text-xs">{s.notes}</p>}
                  </div>
                </div>
                <div className="mt-2.5 space-y-1 pl-11">
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-xs text-white/55 hover:text-white transition-colors">
                      <Phone size={12} /> {s.phone}
                    </a>
                  )}
                  {s.email && (
                    <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-xs text-white/55 hover:text-white transition-colors">
                      <Mail size={12} /> {s.email}
                    </a>
                  )}
                  {s.address && (
                    <p className="flex items-center gap-2 text-xs text-white/40">
                      <MapPin size={12} /> {s.address}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 ml-2">
                <button onClick={() => openEdit(s)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleDelete(s)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Supplier' : 'Add Supplier'} size="md">
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: 'name', label: 'Supplier Name *', placeholder: 'e.g. Ghana Trading Co.', required: true },
            { key: 'phone', label: 'Phone Number', placeholder: '0302 123456' },
            { key: 'email', label: 'Email', placeholder: 'supplier@example.com', type: 'email' },
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
              placeholder="e.g. Main supplier for household goods"
              rows={2}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModal(false)} className="btn-glass flex-1 py-3 rounded-xl text-sm">Cancel</button>
            <button type="submit" className="btn-gold flex-1 py-3 rounded-xl text-sm font-bold">
              {editId ? 'Save Changes' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

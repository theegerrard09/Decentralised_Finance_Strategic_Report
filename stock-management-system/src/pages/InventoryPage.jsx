import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Camera, Package, ArrowUp, Filter } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import BarcodeScanner from '../components/BarcodeScanner';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/helpers';

const CATEGORIES = ['All', 'Food', 'Beverages', 'Household', 'Health', 'Electronics', 'Clothing', 'Other'];

const EMPTY_FORM = {
  name: '', category: 'Food', barcode: '', buyingPrice: '', sellingPrice: '', quantity: '', lowStockThreshold: 10,
};

export default function InventoryPage() {
  const { state, actions } = useApp();
  const { products } = state;

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  const filtered = useMemo(() => {
    let list = products;
    if (catFilter !== 'All') list = list.filter(p => p.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.barcode?.includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, search, catFilter]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModal('form');
  };

  const openEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category,
      barcode: product.barcode || '',
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      lowStockThreshold: product.lowStockThreshold || 10,
    });
    setEditId(product.id);
    setModal('form');
  };

  const handleScan = (code) => {
    setScannerOpen(false);
    const existing = products.find(p => p.barcode === code);
    if (existing) {
      setRestockModal(existing);
      setRestockQty('');
    } else {
      setForm(f => ({ ...f, barcode: code }));
      setModal('form');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      buyingPrice: parseFloat(form.buyingPrice),
      sellingPrice: parseFloat(form.sellingPrice),
      quantity: parseInt(form.quantity),
      lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
    };
    if (editId) {
      actions.updateProduct(editId, data);
    } else {
      actions.addProduct(data);
    }
    setModal(null);
  };

  const handleDelete = (product) => {
    if (window.confirm(`Delete "${product.name}"?`)) {
      actions.deleteProduct(product.id, product.name);
    }
  };

  const handleRestock = (e) => {
    e.preventDefault();
    const qty = parseInt(restockQty);
    if (qty > 0 && restockModal) {
      actions.restockProduct(restockModal.id, qty, restockModal.name);
      setRestockModal(null);
      setRestockQty('');
    }
  };

  const stockStatus = (p) => {
    if (p.quantity === 0) return <span className="badge-danger">Out</span>;
    if (p.quantity <= p.lowStockThreshold) return <span className="badge-warning">Low</span>;
    return <span className="badge-success">OK</span>;
  };

  const margin = (p) => {
    if (!p.buyingPrice) return '–';
    return `${(((p.sellingPrice - p.buyingPrice) / p.sellingPrice) * 100).toFixed(0)}%`;
  };

  return (
    <div className="page-enter space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Inventory</h1>
          <p className="text-white/40 text-sm">{products.length} products</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setScannerOpen(true)}
            className="w-10 h-10 flex items-center justify-center btn-glass rounded-xl"
            title="Scan barcode"
          >
            <Camera size={18} />
          </button>
          <button onClick={openAdd} className="btn-gold px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Items', value: products.reduce((s, p) => s + p.quantity, 0) },
          { label: 'Low Stock', value: products.filter(p => p.quantity > 0 && p.quantity <= p.lowStockThreshold).length, warn: true },
          { label: 'Out of Stock', value: products.filter(p => p.quantity === 0).length, danger: true },
        ].map(({ label, value, warn, danger }) => (
          <GlassCard key={label} className="p-3 text-center">
            <p className={`text-xl font-bold ${danger ? 'text-red-400' : warn ? 'text-yellow-400' : 'text-white'}`}>
              {value}
            </p>
            <p className="text-white/40 text-xs mt-0.5">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
          />
        </div>
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="glass-input px-3 py-2.5 rounded-xl text-sm min-w-[90px]"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-glass">
            <thead>
              <tr>
                <th>Product</th>
                <th className="hidden sm:table-cell">Category</th>
                <th>Buy / Sell</th>
                <th>Qty</th>
                <th className="hidden md:table-cell">Margin</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-white/30">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div>
                        <p className="font-medium text-white text-sm">{p.name}</p>
                        {p.barcode && <p className="text-white/30 text-xs">{p.barcode}</p>}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="badge-info">{p.category}</span>
                    </td>
                    <td>
                      <div className="text-xs">
                        <p className="text-white/60">GHS {p.buyingPrice?.toFixed(2)}</p>
                        <p className="text-green-400 font-medium">GHS {p.sellingPrice?.toFixed(2)}</p>
                      </div>
                    </td>
                    <td className="font-semibold text-white">{p.quantity}</td>
                    <td className="hidden md:table-cell text-gold-400 text-sm">{margin(p)}</td>
                    <td>{stockStatus(p)}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setRestockModal(p); setRestockQty(''); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
                          title="Restock"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Scanner modal */}
      <Modal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} title="Scan Barcode" size="sm">
        <BarcodeScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />
      </Modal>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={modal === 'form'}
        onClose={() => setModal(null)}
        title={editId ? 'Edit Product' : 'Add New Product'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs text-white/55 mb-1.5">Product Name *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Sunlight Soap"
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/55 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                >
                  {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/55 mb-1.5">Barcode</label>
                <input
                  value={form.barcode}
                  onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                  placeholder="Optional"
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/55 mb-1.5">Buying Price (GHS) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.buyingPrice}
                  onChange={e => setForm(f => ({ ...f, buyingPrice: e.target.value }))}
                  placeholder="0.00"
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/55 mb-1.5">Selling Price (GHS) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.sellingPrice}
                  onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))}
                  placeholder="0.00"
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/55 mb-1.5">Quantity *</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="0"
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/55 mb-1.5">Low Stock Alert At</label>
                <input
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={e => setForm(f => ({ ...f, lowStockThreshold: e.target.value }))}
                  placeholder="10"
                  className="glass-input w-full px-3 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {form.buyingPrice && form.sellingPrice && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-sm">
              <span className="text-white/50">Profit margin:</span>
              <span className="text-green-400 font-bold">
                {(((parseFloat(form.sellingPrice) - parseFloat(form.buyingPrice)) / parseFloat(form.sellingPrice)) * 100).toFixed(1)}%
              </span>
              <span className="text-white/50">·</span>
              <span className="text-green-400">
                GHS {(parseFloat(form.sellingPrice) - parseFloat(form.buyingPrice)).toFixed(2)} / unit
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setModal(null)} className="btn-glass flex-1 py-3 rounded-xl text-sm">Cancel</button>
            <button type="submit" className="btn-gold flex-1 py-3 rounded-xl text-sm font-bold">
              {editId ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Restock Modal */}
      <Modal isOpen={!!restockModal} onClose={() => setRestockModal(null)} title="Restock Product" size="sm">
        {restockModal && (
          <form onSubmit={handleRestock} className="space-y-4">
            <div className="glass-card-gold p-3 rounded-xl">
              <p className="font-semibold text-white">{restockModal.name}</p>
              <p className="text-white/50 text-sm">Current stock: <span className="text-white">{restockModal.quantity}</span></p>
            </div>
            <div>
              <label className="block text-xs text-white/55 mb-1.5">Units to Add *</label>
              <input
                required
                type="number"
                min="1"
                value={restockQty}
                onChange={e => setRestockQty(e.target.value)}
                placeholder="Enter quantity"
                autoFocus
                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
              />
              {restockQty && (
                <p className="text-white/40 text-xs mt-1.5">
                  New total: {restockModal.quantity + parseInt(restockQty || 0)} units
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setRestockModal(null)} className="btn-glass flex-1 py-3 rounded-xl text-sm">Cancel</button>
              <button type="submit" className="btn-gold flex-1 py-3 rounded-xl text-sm font-bold">Restock</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

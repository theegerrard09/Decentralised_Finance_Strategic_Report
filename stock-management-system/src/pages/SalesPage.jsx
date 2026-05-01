import { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Camera, CheckCircle, X } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import BarcodeScanner from '../components/BarcodeScanner';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../utils/helpers';

export default function SalesPage() {
  const { state, actions } = useApp();
  const { products, sales } = state;

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [payMethod, setPayMethod] = useState('cash');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [tab, setTab] = useState('pos');

  const filtered = useMemo(() => {
    if (!search.trim()) return products.filter(p => p.quantity > 0);
    const q = search.toLowerCase();
    return products.filter(p =>
      p.quantity > 0 && (
        p.name.toLowerCase().includes(q) ||
        p.barcode?.includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
    );
  }, [products, search]);

  const cartTotal = cart.reduce((s, i) => s + i.sellingPrice * i.quantity, 0);
  const cartProfit = cart.reduce((s, i) => s + (i.sellingPrice - i.buyingPrice) * i.quantity, 0);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        const inStock = products.find(p => p.id === product.id);
        if (existing.quantity >= inStock.quantity) {
          actions.toast('Not enough stock!', 'warning');
          return prev;
        }
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sellingPrice: product.sellingPrice,
        buyingPrice: product.buyingPrice,
        quantity: 1,
        maxQty: product.quantity,
      }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev =>
      prev.map(i => {
        if (i.productId !== productId) return i;
        const newQty = i.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > i.maxQty) { actions.toast('Not enough stock!', 'warning'); return i; }
        return { ...i, quantity: newQty };
      }).filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const sale = actions.addSale({
      items: cart.map(i => ({ ...i })),
      total: cartTotal,
      paymentMethod: payMethod,
    });
    setReceipt(sale);
    setCart([]);
    setSearch('');
  };

  const handleScan = (code) => {
    setScannerOpen(false);
    const product = products.find(p => p.barcode === code && p.quantity > 0);
    if (product) {
      addToCart(product);
      actions.toast(`Added: ${product.name}`, 'success');
    } else {
      actions.toast('Product not found or out of stock', 'warning');
    }
  };

  const todaySales = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sales.filter(s => s.createdAt?.startsWith(today)).reverse();
  }, [sales]);

  return (
    <div className="page-enter space-y-4">
      {/* Header & tabs */}
      <div>
        <h1 className="text-xl font-bold text-white">Sales / POS</h1>
        <div className="flex gap-1 mt-3 p-1 glass rounded-xl">
          {[['pos', 'Point of Sale'], ['history', "Today's Sales"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key ? 'btn-gold' : 'text-white/50 hover:text-white'
              }`}
            >
              {label}
              {key === 'history' && todaySales.length > 0 && (
                <span className="ml-1.5 badge-info py-0 px-1.5">{todaySales.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'pos' && (
        <div className="space-y-4">
          {/* Product search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products to add..."
                className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              />
            </div>
            <button
              onClick={() => setScannerOpen(true)}
              className="w-11 h-11 flex items-center justify-center btn-glass rounded-xl"
            >
              <Camera size={18} />
            </button>
          </div>

          {/* Product grid */}
          {(search || filtered.length > 0) && (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {filtered.slice(0, 20).map(p => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="text-left p-3 glass-card hover:border-gold-500/40 transition-all active:scale-95"
                >
                  <p className="text-sm font-medium text-white leading-tight">{p.name}</p>
                  <p className="text-gold-400 text-sm font-bold mt-1">{formatCurrency(p.sellingPrice)}</p>
                  <p className="text-white/35 text-xs">{p.quantity} in stock</p>
                </button>
              ))}
              {filtered.length === 0 && search && (
                <p className="col-span-2 text-center text-white/35 text-sm py-4">No products found.</p>
              )}
            </div>
          )}

          {/* Cart */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart size={16} className="text-gold-400" />
              <h2 className="text-sm font-semibold text-white">Cart</h2>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="ml-auto text-red-400/70 hover:text-red-400 text-xs flex items-center gap-1">
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-white/25">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Cart is empty. Search and tap a product to add.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.name}</p>
                      <p className="text-xs text-gold-400">{formatCurrency(item.sellingPrice)} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(item.productId, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg glass hover:bg-white/15"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg glass hover:bg-white/15"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatCurrency(item.sellingPrice * item.quantity)}</p>
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-400/50 hover:text-red-400 mt-0.5">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div className="border-t border-white/10 mt-3 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Subtotal</span>
                    <span className="text-white font-bold">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/35">
                    <span>Est. profit</span>
                    <span className="text-green-400">{formatCurrency(cartProfit)}</span>
                  </div>
                </div>

                {/* Payment method */}
                <div className="mt-3">
                  <p className="text-xs text-white/50 mb-2">Payment Method</p>
                  <div className="flex gap-2">
                    {[
                      { key: 'cash', label: '💵 Cash' },
                      { key: 'mobile_money', label: '📱 MoMo' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setPayMethod(key)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          payMethod === key
                            ? 'btn-gold'
                            : 'btn-glass text-white/60'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="btn-gold w-full py-3.5 rounded-xl font-bold mt-3 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Checkout — {formatCurrency(cartTotal)}
                </button>
              </>
            )}
          </GlassCard>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {todaySales.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <ShoppingCart size={32} className="mx-auto mb-2 text-white/20" />
              <p className="text-white/30 text-sm">No sales today yet.</p>
            </GlassCard>
          ) : (
            <>
              {/* Day totals */}
              <div className="grid grid-cols-2 gap-3">
                <GlassCard className="p-3 text-center">
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(todaySales.reduce((s, sale) => s + sale.total, 0))}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">Revenue</p>
                </GlassCard>
                <GlassCard gold className="p-3 text-center">
                  <p className="text-xl font-bold text-gold-400">
                    {formatCurrency(todaySales.reduce((s, sale) => s + sale.items.reduce((ss, i) => ss + (i.sellingPrice - i.buyingPrice) * i.quantity, 0), 0))}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">Profit</p>
                </GlassCard>
              </div>

              {todaySales.map(sale => (
                <GlassCard key={sale.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-white">{formatCurrency(sale.total)}</p>
                      <p className="text-xs text-white/40">{formatDateTime(sale.createdAt)}</p>
                    </div>
                    <span className={sale.paymentMethod === 'cash' ? 'badge-success' : 'badge-info'}>
                      {sale.paymentMethod === 'cash' ? '💵 Cash' : '📱 MoMo'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {sale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-white/50">
                        <span>{item.name} × {item.quantity}</span>
                        <span>{formatCurrency(item.sellingPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              ))}
            </>
          )}
        </div>
      )}

      {/* Scanner */}
      <Modal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} title="Scan to Add to Cart" size="sm">
        <BarcodeScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={!!receipt} onClose={() => setReceipt(null)} title="Sale Complete! 🎉" size="sm">
        {receipt && (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-400" />
              </div>
            </div>
            <div className="glass-card-gold p-4 text-center">
              <p className="text-3xl font-bold text-white">{formatCurrency(receipt.total)}</p>
              <p className="text-gold-400 text-sm mt-1">{receipt.paymentMethod === 'cash' ? '💵 Cash' : '📱 Mobile Money'}</p>
            </div>
            <div className="space-y-1.5">
              {receipt.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-white/70">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatCurrency(item.sellingPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setReceipt(null)}
              className="btn-gold w-full py-3 rounded-xl font-bold"
            >
              Done — New Sale
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Package, AlertTriangle, DollarSign, Activity, Clock,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime, isToday, getLast7Days, calcProfit } from '../utils/helpers';

function StatCard({ icon: Icon, label, value, sub, color = 'indigo', gold }) {
  const colors = {
    indigo: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/25',
    green: 'text-green-300 bg-green-500/15 border-green-500/25',
    yellow: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/25',
    red: 'text-red-300 bg-red-500/15 border-red-500/25',
    gold: 'text-gold-400 bg-gold-500/15 border-gold-500/25',
  };

  return (
    <GlassCard gold={gold} className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
    </GlassCard>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-white/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { state } = useApp();
  const { products, sales, credits, activityLog } = state;

  const stats = useMemo(() => {
    const todaySales = sales.filter(s => isToday(s.createdAt));
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const todayProfit = todaySales.reduce((sum, s) => sum + calcProfit(s), 0);
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const stockValue = products.reduce((sum, p) => sum + p.quantity * p.buyingPrice, 0);
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.lowStockThreshold);
    const outOfStock = products.filter(p => p.quantity === 0);
    const pendingCredits = credits.filter(c => c.status !== 'paid');
    const totalCreditOwed = pendingCredits.reduce((sum, c) => sum + c.balance, 0);

    return { todayRevenue, todayProfit, totalStock, stockValue, lowStock, outOfStock, totalCreditOwed, todaySalesCount: todaySales.length };
  }, [products, sales, credits]);

  const chartData = useMemo(() => {
    const days = getLast7Days();
    return days.map(day => {
      const daySales = sales.filter(s => s.createdAt?.startsWith(day));
      return {
        date: new Date(day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
        Revenue: daySales.reduce((sum, s) => sum + s.total, 0),
        Profit: daySales.reduce((sum, s) => sum + calcProfit(s), 0),
      };
    });
  }, [sales]);

  const recentActivity = activityLog.slice(0, 10);

  const activityIcon = (action) => {
    if (action.includes('SALE')) return '💰';
    if (action.includes('PRODUCT')) return '📦';
    if (action.includes('CREDIT') || action.includes('PAYMENT')) return '💳';
    if (action.includes('LOGIN')) return '🔐';
    if (action.includes('RESTOCK')) return '📈';
    return '📋';
  };

  return (
    <div className="page-enter space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-0.5">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={DollarSign}
          label="Today's Sales"
          value={formatCurrency(stats.todayRevenue)}
          sub={`${stats.todaySalesCount} transaction${stats.todaySalesCount !== 1 ? 's' : ''}`}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Today's Profit"
          value={formatCurrency(stats.todayProfit)}
          sub="Net earnings"
          color="gold"
          gold
        />
        <StatCard
          icon={Package}
          label="Total Stock"
          value={stats.totalStock.toLocaleString()}
          sub={formatCurrency(stats.stockValue) + ' value'}
          color="indigo"
        />
        <StatCard
          icon={AlertTriangle}
          label="Owed (Credit)"
          value={formatCurrency(stats.totalCreditOwed)}
          sub="Pending balance"
          color="yellow"
        />
      </div>

      {/* Low stock alerts */}
      {(stats.lowStock.length > 0 || stats.outOfStock.length > 0) && (
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-yellow-400" />
            <h2 className="text-sm font-semibold text-white">Stock Alerts</h2>
          </div>
          <div className="space-y-2">
            {stats.outOfStock.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="text-sm text-white">{p.name}</span>
                <span className="badge-danger">Out of Stock</span>
              </div>
            ))}
            {stats.lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-sm text-white">{p.name}</span>
                <span className="badge-warning">{p.quantity} left</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Revenue chart */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-indigo-300" />
          <h2 className="text-sm font-semibold text-white">Last 7 Days Performance</h2>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4A017" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Revenue" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Profit" stroke="#D4A017" fill="url(#colorProfit)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center">
          <span className="flex items-center gap-1.5 text-xs text-white/50">
            <span className="w-3 h-0.5 rounded bg-indigo-400 inline-block" /> Revenue
          </span>
          <span className="flex items-center gap-1.5 text-xs text-white/50">
            <span className="w-3 h-0.5 rounded bg-gold-500 inline-block" /> Profit
          </span>
        </div>
      </GlassCard>

      {/* Recent activity */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-indigo-300" />
          <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-4">No activity yet.</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map(log => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="text-base leading-none mt-0.5">{activityIcon(log.action)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{log.details}</p>
                  <p className="text-xs text-white/35 mt-0.5">{formatDateTime(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

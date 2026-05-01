import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { Download, FileText, TrendingUp, TrendingDown, DollarSign, ShoppingBag } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getDateRange, isInRange, calcProfit, downloadCSV, groupByDate } from '../utils/helpers';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
];

const CHART_COLORS = ['#6366f1', '#D4A017', '#22c55e', '#f87171', '#a78bfa'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-white/60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const { state } = useApp();
  const { sales, products, credits } = state;

  const [period, setPeriod] = useState('week');

  const { start, end } = useMemo(() => getDateRange(period), [period]);

  const periodSales = useMemo(() =>
    sales.filter(s => isInRange(s.createdAt, start, end)),
    [sales, start, end]
  );

  const stats = useMemo(() => {
    const revenue = periodSales.reduce((s, sale) => s + sale.total, 0);
    const profit = periodSales.reduce((s, sale) => s + calcProfit(sale), 0);
    const cogs = revenue - profit;
    const txCount = periodSales.length;
    const avgSale = txCount ? revenue / txCount : 0;
    const stockValue = products.reduce((s, p) => s + p.quantity * p.buyingPrice, 0);

    return { revenue, profit, cogs, txCount, avgSale, stockValue };
  }, [periodSales, products]);

  const chartData = useMemo(() => {
    const grouped = groupByDate(periodSales, 'createdAt');
    const allDates = Object.keys(grouped).sort();
    return allDates.map(date => ({
      date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      Revenue: grouped[date].reduce((s, sale) => s + sale.total, 0),
      Profit: grouped[date].reduce((s, sale) => s + calcProfit(sale), 0),
      COGS: grouped[date].reduce((s, sale) => s + (sale.total - calcProfit(sale)), 0),
    }));
  }, [periodSales]);

  const categoryData = useMemo(() => {
    const cats = {};
    periodSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const cat = product?.category || 'Other';
        cats[cat] = (cats[cat] || 0) + item.sellingPrice * item.quantity;
      });
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [periodSales, products]);

  const paymentData = useMemo(() => {
    const methods = {};
    periodSales.forEach(s => {
      const label = s.paymentMethod === 'cash' ? 'Cash' : 'Mobile Money';
      methods[label] = (methods[label] || 0) + s.total;
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [periodSales]);

  const topProducts = useMemo(() => {
    const map = {};
    periodSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.name, revenue: 0, qty: 0, profit: 0 };
        }
        map[item.productId].revenue += item.sellingPrice * item.quantity;
        map[item.productId].qty += item.quantity;
        map[item.productId].profit += (item.sellingPrice - item.buyingPrice) * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [periodSales]);

  const exportCSV = () => {
    const data = periodSales.map(sale => ({
      Date: formatDate(sale.createdAt),
      'Payment Method': sale.paymentMethod,
      Revenue: sale.total.toFixed(2),
      Profit: calcProfit(sale).toFixed(2),
      COGS: (sale.total - calcProfit(sale)).toFixed(2),
      Items: sale.items.map(i => `${i.name} x${i.quantity}`).join(' | '),
    }));
    downloadCSV(data, `gevite-report-${period}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const periodLabel = PERIODS.find(p => p.key === period)?.label;

    doc.setFillColor(10, 10, 46);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(212, 160, 23);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Gevite Collective', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`Stock Management — ${periodLabel} Report`, 14, 26);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 14, 33);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, 52);

    const summaryData = [
      ['Total Revenue', formatCurrency(stats.revenue)],
      ['Total Profit', formatCurrency(stats.profit)],
      ['Cost of Goods Sold', formatCurrency(stats.cogs)],
      ['Transactions', stats.txCount.toString()],
      ['Avg. Sale Value', formatCurrency(stats.avgSale)],
      ['Profit Margin', stats.revenue ? `${((stats.profit / stats.revenue) * 100).toFixed(1)}%` : '0%'],
    ];

    autoTable(doc, {
      startY: 56,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [10, 10, 46], textColor: [212, 160, 23] },
      styles: { fontSize: 10 },
    });

    if (periodSales.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Date', 'Payment', 'Revenue', 'Profit', 'Items']],
        body: periodSales.slice(0, 50).map(sale => [
          formatDate(sale.createdAt),
          sale.paymentMethod === 'cash' ? 'Cash' : 'Mobile Money',
          formatCurrency(sale.total),
          formatCurrency(calcProfit(sale)),
          sale.items.map(i => `${i.name} ×${i.quantity}`).join(', '),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [48, 43, 99], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellWidth: 'wrap' },
      });
    }

    doc.save(`gevite-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const profitMargin = stats.revenue ? ((stats.profit / stats.revenue) * 100).toFixed(1) : '0';

  return (
    <div className="page-enter space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Reports</h1>
          <p className="text-white/40 text-sm">Profit & Loss Analysis</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-glass px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5">
            <Download size={14} /> CSV
          </button>
          <button onClick={exportPDF} className="btn-gold px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 p-1 glass rounded-xl">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              period === key ? 'btn-gold' : 'text-white/50 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={15} className="text-indigo-300" />
            <p className="text-white/45 text-xs">Revenue</p>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(stats.revenue)}</p>
          <p className="text-white/30 text-xs mt-1">{stats.txCount} sales</p>
        </GlassCard>
        <GlassCard gold className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={15} className="text-gold-400" />
            <p className="text-white/45 text-xs">Profit</p>
          </div>
          <p className="text-xl font-bold text-gold-400">{formatCurrency(stats.profit)}</p>
          <p className="text-white/30 text-xs mt-1">{profitMargin}% margin</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={15} className="text-red-300" />
            <p className="text-white/45 text-xs">COGS</p>
          </div>
          <p className="text-xl font-bold text-red-400">{formatCurrency(stats.cogs)}</p>
          <p className="text-white/30 text-xs mt-1">Cost of goods</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag size={15} className="text-green-300" />
            <p className="text-white/45 text-xs">Avg. Sale</p>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(stats.avgSale)}</p>
          <p className="text-white/30 text-xs mt-1">Per transaction</p>
        </GlassCard>
      </div>

      {/* Revenue/Profit chart */}
      {chartData.length > 0 && (
        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Revenue vs Profit</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
              <Bar dataKey="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#D4A017" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      )}

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Sales by Category</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-xs text-white/60 truncate flex-1">{cat.name}</span>
                  <span className="text-xs font-medium text-white">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Top products */}
      {topProducts.length > 0 && (
        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Top Products</h2>
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: CHART_COLORS[i] + '30', color: CHART_COLORS[i] }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{p.name}</p>
                  <p className="text-xs text-white/35">{p.qty} units sold</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{formatCurrency(p.revenue)}</p>
                  <p className="text-xs text-green-400">{formatCurrency(p.profit)} profit</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Payment methods */}
      {paymentData.length > 0 && (
        <GlassCard className="p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Payment Methods</h2>
          <div className="space-y-2">
            {paymentData.map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="text-lg">{m.name === 'Cash' ? '💵' : '📱'}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/70">{m.name}</span>
                    <span className="text-white font-medium">{formatCurrency(m.value)}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(m.value / stats.revenue) * 100}%`,
                        background: CHART_COLORS[i],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {periodSales.length === 0 && (
        <GlassCard className="p-10 text-center">
          <TrendingUp size={32} className="mx-auto mb-2 text-white/20" />
          <p className="text-white/30 text-sm">No sales data for this period.</p>
          <p className="text-white/20 text-xs mt-1">Make some sales to see reports!</p>
        </GlassCard>
      )}
    </div>
  );
}

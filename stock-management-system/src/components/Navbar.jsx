import { useState } from 'react';
import { Menu, X, LogOut, Bell } from 'lucide-react';
import GeviteLogo from './GeviteLogo';
import { useApp } from '../context/AppContext';

export default function Navbar({ onMenuToggle, sidebarOpen }) {
  const { state, actions } = useApp();
  const { products, activityLog } = state;

  const lowStock = products.filter(p => p.quantity <= p.lowStockThreshold);
  const recentAlerts = lowStock.length;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="w-9 h-9 flex items-center justify-center rounded-xl glass hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <X size={18} className="text-white" /> : <Menu size={18} className="text-white" />}
          </button>
          <GeviteLogo size={36} showText={false} />
          <div className="hidden sm:block leading-tight">
            <div className="text-gold-400 font-bold text-sm font-display tracking-wide">Gevite Collective</div>
            <div className="text-white/40 text-xs tracking-wider uppercase">Stock System</div>
          </div>
        </div>

        {/* Right: alerts + logout */}
        <div className="flex items-center gap-2">
          {recentAlerts > 0 && (
            <div className="relative">
              <button className="w-9 h-9 flex items-center justify-center rounded-xl glass hover:bg-white/10 transition-colors">
                <Bell size={17} className="text-yellow-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {recentAlerts > 9 ? '9+' : recentAlerts}
                </span>
              </button>
            </div>
          )}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 glass rounded-xl">
            <div className="w-6 h-6 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center">
              <span className="text-gold-400 text-xs font-bold">
                {state.auth.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-white/70 text-xs font-medium">{state.auth.username}</span>
          </div>
          <button
            onClick={actions.logout}
            className="w-9 h-9 flex items-center justify-center rounded-xl glass hover:bg-red-500/20 transition-colors group"
            title="Logout"
          >
            <LogOut size={16} className="text-white/60 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}

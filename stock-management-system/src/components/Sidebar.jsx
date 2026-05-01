import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, CreditCard,
  BarChart3, Truck, Users, X
} from 'lucide-react';
import GeviteLogo from './GeviteLogo';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/sales', label: 'Sales / POS', icon: ShoppingCart },
  { path: '/credits', label: 'Credit Ledger', icon: CreditCard },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/suppliers', label: 'Suppliers', icon: Truck },
  { path: '/customers', label: 'Customers', icon: Users },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-64 flex flex-col
          glass border-r border-white/10 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:top-14`}
        style={{ paddingTop: isOpen ? '0' : undefined }}
      >
        {/* Logo (shown when sidebar overlays on mobile) */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 lg:hidden">
          <GeviteLogo size={48} showText />
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full glass"
          >
            <X size={16} className="text-white/70" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);

            return (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-white/25 text-xs text-center">
            Gevite Collective © 2024
          </p>
          <p className="text-white/20 text-xs text-center mt-0.5">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}

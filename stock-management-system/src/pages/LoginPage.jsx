import { useState } from 'react';
import { Eye, EyeOff, Lock, User, LogIn } from 'lucide-react';
import GeviteLogo from '../components/GeviteLogo';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { actions } = useApp();
  const [form, setForm] = useState({ username: '', password: '' });
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const ok = actions.login(form.username.trim(), form.password, staySignedIn);
    if (!ok) {
      setError('Invalid username or password.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gold-500/8 blur-3xl" />
      </div>

      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <GeviteLogo size={100} showText />
        </div>

        {/* Card */}
        <div className="glass-card p-7">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-white">Welcome Back</h1>
            <p className="text-white/45 text-sm mt-1">Sign in to manage your stock</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5 font-medium">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="admin"
                  required
                  autoComplete="username"
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="glass-input w-full pl-10 pr-12 py-3 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Stay signed in */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={staySignedIn}
                  onChange={e => setStaySignedIn(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                  staySignedIn ? 'bg-gold-500' : 'bg-white/15'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm
                    transition-transform duration-200 ${staySignedIn ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </div>
              </div>
              <span className="text-sm text-white/65 group-hover:text-white/85 transition-colors">
                Stay signed in on this device
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                <span>✕</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <p className="text-white/25 text-xs">Default: admin / gevite2024</p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Lord Is Our Gracious · Gevite Collective
        </p>
      </div>
    </div>
  );
}

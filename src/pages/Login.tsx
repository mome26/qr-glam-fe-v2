import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
       toast.error('Please enter both email and password');
       return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Signing in...');
    try {
      await login(email, password);
      toast.success('Welcome back!', { id: toastId });
      navigate('/');
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      toast.error(error.message || 'An unexpected error occurred', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 font-sans">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-info mb-6 shadow-2xl shadow-info/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3 font-display">QR Glam</h1>
          <p className="text-muted text-lg">Sign in to your dashboard</p>
        </div>

        {/* Form Container */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-info transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-background/50 border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all placeholder:text-muted/40"
                  placeholder="admin@qr-glam.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-info transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-4 bg-background/50 border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-info/20 focus:border-info transition-all placeholder:text-muted/40"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-info hover:bg-info/90 disabled:opacity-50 text-white font-bold text-lg rounded-2xl transition-all shadow-xl shadow-info/20 active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Support Help */}
        <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-muted text-sm">
                <span className="w-2 h-2 rounded-full bg-info"></span>
                Login with admin@qr-glam.com
            </div>
        </div>
      </div>
    </div>
  );
}

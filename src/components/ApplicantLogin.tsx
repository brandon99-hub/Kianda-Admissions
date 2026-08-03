import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, LogIn, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveApplicantToken } from '../utils/auth';

interface Props {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export default function ApplicantLogin({ onLoginSuccess, onBack }: Props) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please enter your email and password.');
    setIsLoading(true);
    try {
      const res = await fetch('/api/applicants/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        saveApplicantToken(data.token);
        toast.success('Welcome back!', { icon: '👋' });
        onLoginSuccess();
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch {
      toast.error('Could not connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #FFFFFF 0%, #F5D97A 100%)' }}>
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-secondary/15 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-3xl p-8 rounded-[40px] shadow-[0_50px_100px_-20px_rgba(24,33,109,0.15)] w-full max-w-md border border-white/50 relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-secondary/20 rounded-full blur-2xl animate-pulse" />
            <img src="/kianda-school-logo-removebg-preview.png" alt="Kianda School Logo" className="w-16 h-16 object-contain relative z-10 drop-shadow-xl" />
          </div>
          <h2 className="text-3xl font-headline font-extrabold text-primary mb-1 tracking-tight">Applicant Portal</h2>
          <p className="text-[12px] text-on-surface-variant font-semibold uppercase tracking-[0.2em] opacity-60">Sign in to view your application</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-primary/60 ml-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full bg-white/50 backdrop-blur-sm p-4 rounded-[18px] border border-white/50 font-semibold focus:ring-4 focus:ring-secondary/20 focus:bg-white transition-all shadow-inner placeholder:opacity-30"
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-primary/60 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full bg-white/50 backdrop-blur-sm p-4 rounded-[18px] border border-white/50 font-semibold focus:ring-4 focus:ring-secondary/20 focus:bg-white transition-all shadow-inner placeholder:opacity-30 pr-12"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-5 rounded-[18px] font-black shadow-[0_15px_30px_rgba(255,196,37,0.3)] hover:shadow-[0_20px_40px_rgba(255,196,37,0.4)] hover:-translate-y-1 active:scale-[0.98] transition-all mt-4 relative overflow-hidden group ${isLoading ? 'bg-secondary/50 text-primary/50' : 'bg-secondary text-primary'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="tracking-[0.2em] uppercase text-[11px] relative z-10 flex items-center justify-center gap-2">
              {isLoading ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <><LogIn size={15} /> Sign In</>}
            </span>
          </button>

          <button type="button" onClick={onBack} className="w-full text-[9px] font-extrabold uppercase tracking-[0.3em] text-on-surface-variant/30 hover:text-primary transition-all flex items-center justify-center gap-2 mt-2">
            <ArrowLeft size={12} /> Return to Portal
          </button>
        </form>

        <div className="mt-6 p-4 bg-secondary/5 rounded-2xl border border-secondary/10">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={14} className="text-secondary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Don't have an account?</span>
          </div>
          <p className="text-[11px] text-on-surface-variant/60 font-medium">
            Submit your application first. After payment, you'll be prompted to create an account so you can track and edit your application.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, Loader2, UserPlus, ArrowRight, Eye, EyeOff, ShieldCheck, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveApplicantToken, isApplicantTokenValid } from '../utils/auth';

interface Props {
  applicationId: number;
  onSuccess: () => void;
  onCancel: () => void;
  onBack: () => void;
  phoneNumber?: string;
  parentEmail?: string;
  alreadyVerified?: boolean; // true for manual payment path (skip polling, show success immediately)
}

type AccountStep = 'choice' | 'create' | 'done';

export default function PaymentPolling({ applicationId, onSuccess, onCancel, onBack, phoneNumber, parentEmail, alreadyVerified }: Props) {
  const [status, setStatus] = useState<'polling' | 'success' | 'failed'>(
    alreadyVerified ? 'success' : 'polling'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shortcode = process.env.MPESA_SHORTCODE || '174379';
  const amount = process.env.MPESA_ENVIRONMENT === 'sandbox' ? '1' : '2,000';

  // Account creation state
  const [accountStep, setAccountStep] = useState<AccountStep>('choice');
  const [accountForm, setAccountForm] = useState({ email: parentEmail || '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    if (isApplicantTokenValid()) {
      setAccountStep('done');
    }
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/applications/${applicationId}/payment-status`);
        if (res.ok) {
          const data = await res.json();
          if (data.paymentVerified) {
            setStatus('success');
            clearInterval(intervalId);
          } else if (data.stkPushFailed) {
            setStatus('failed');
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        console.error('Failed to poll status', err);
      }
    };

    if (status === 'polling') {
      intervalId = setInterval(checkStatus, 3000);
    }

    return () => clearInterval(intervalId);
  }, [applicationId, status]);

  const handleCreateAccount = async () => {
    setErrorMsg('');

    if (!accountForm.email || !accountForm.email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Strong password validation regex
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPasswordRegex.test(accountForm.password)) {
      setErrorMsg('Password does not meet all security requirements.');
      return;
    }

    if (accountForm.password !== accountForm.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    // Safety check — applicationId must be a valid number
    if (!applicationId || applicationId <= 0) {
      console.warn('[PaymentPolling] applicationId is missing or invalid:', applicationId);
      setErrorMsg('Something went wrong linking your application. Please contact support.');
      return;
    }

    setIsCreatingAccount(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/applicants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountForm.email, password: accountForm.password, applicationId }),
      });
      const data = await res.json();
      if (res.ok) {
        saveApplicantToken(data.token);
        setAccountStep('done');
        toast.success('Account created! You can now track and edit your application.');
      } else {
        setErrorMsg(data.error || 'Failed to create account.');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode || manualCode.trim().length < 9) {
      setErrorMsg('Please enter a valid M-PESA Transaction Code');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await fetch(`/api/applications/${applicationId}/submit-mpesa-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mpesaCode: manualCode })
      });
      if (res.ok) {
        setStatus('success');
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Failed to submit code');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto bg-white/70 backdrop-blur-3xl p-10 rounded-[40px] shadow-[0_20px_40px_-10px_rgba(24,33,109,0.1)] border border-white/50 text-center relative overflow-hidden"
    >
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[80px]" />
      
      {status === 'polling' && (
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-6 shadow-inner relative">
            <Loader2 size={40} className="animate-spin text-secondary" />
          </div>
          <h3 className="text-2xl font-black text-primary mb-3">Check Your Phone</h3>
          {phoneNumber && (
            <div className="text-sm font-bold text-secondary bg-secondary/10 px-6 py-2 rounded-xl mb-4 border border-secondary/20 tracking-wider">
              {phoneNumber}
            </div>
          )}
          <p className="text-[13px] text-on-surface-variant/80 font-medium leading-relaxed mb-8">
            We have sent an M-PESA STK Push to your phone. Please enter your PIN to complete the application payment.
          </p>
          <div className="flex gap-4 w-full">
            <button
              onClick={onBack}
              className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] text-on-surface-variant hover:text-primary transition-all bg-surface-variant/30 hover:bg-surface-variant/50"
            >
              Back
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-[11px] text-on-surface-variant hover:text-primary transition-all bg-surface-variant/30 hover:bg-surface-variant/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS: Show account creation prompt */}
      {status === 'success' && (
        <div className="relative z-10 flex flex-col items-center">
          <AnimatePresence mode="wait">

            {/* Step: Account creation choice */}
            {accountStep === 'choice' && (
              <motion.div
                key="choice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full flex flex-col items-center"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-5 shadow-inner">
                  <CheckCircle size={40} />
                </motion.div>
                <h3 className="text-2xl font-black text-primary mb-1">Application Submitted!</h3>
                <p className="text-[12px] text-on-surface-variant/70 font-medium mb-6 leading-relaxed">
                  Your application has been received. You will hear from us soon.
                </p>

                {/* Account creation pitch */}
                <div className="w-full bg-gradient-to-br from-primary/5 to-secondary/10 rounded-2xl p-5 mb-6 border border-secondary/20 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={18} className="text-secondary shrink-0" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-primary">Create a Free Account</span>
                  </div>
                  <ul className="space-y-2">
                    {[
                      'View your application status at any time',
                      'Edit your application while it\'s still being reviewed',
                      'Access all submitted details and documents',
                    ].map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-on-surface-variant font-semibold">
                        <span className="w-4 h-4 rounded-full bg-secondary/20 text-secondary flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-black">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="w-full flex flex-col gap-3">
                  <button
                    onClick={() => setAccountStep('create')}
                    className="w-full py-4 rounded-xl font-black uppercase tracking-[0.15em] text-[11px] bg-secondary text-primary hover:shadow-[0_15px_30px_rgba(255,196,37,0.3)] transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus size={16} />
                    Create Account
                  </button>
                  <button
                    onClick={onSuccess}
                    className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] text-on-surface-variant/50 hover:text-primary transition-all"
                  >
                    Continue as Guest
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step: Account creation form */}
            {accountStep === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className="w-full flex flex-col items-center"
              >
                <div className="w-14 h-14 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-4">
                  <UserPlus size={28} />
                </div>
                <h3 className="text-xl font-black text-primary mb-1">Create Your Account</h3>
                <p className="text-[11px] text-on-surface-variant/60 font-medium mb-6">You can log in anytime to track and edit your application.</p>

                <div className="w-full space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60">Email Address</label>
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-3.5 text-sm font-semibold focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={accountForm.password}
                        onChange={(e) => setAccountForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="Min. 8 characters"
                        className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-3.5 pr-12 text-sm font-semibold focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Visual Password Requirements */}
                    <div className="mt-2 space-y-1">
                      {[
                        { label: 'At least 8 characters', regex: /.{8,}/ },
                        { label: 'One uppercase letter', regex: /[A-Z]/ },
                        { label: 'One lowercase letter', regex: /[a-z]/ },
                        { label: 'One number', regex: /\d/ },
                        { label: 'One special character (!@#$%^&*)', regex: /[\W_]/ }
                      ].map((req, i) => {
                        const isMet = req.regex.test(accountForm.password);
                        return (
                          <div key={i} className="flex items-center gap-2 text-[10px] font-semibold">
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold ${isMet ? 'bg-green-100 text-green-600' : 'bg-surface-variant text-on-surface-variant/40'}`}>
                              {isMet ? '✓' : ''}
                            </span>
                            <span className={isMet ? 'text-green-600' : 'text-on-surface-variant/50'}>{req.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60">Confirm Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={accountForm.confirmPassword}
                      onChange={(e) => setAccountForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      placeholder="Re-enter password"
                      className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-3.5 text-sm font-semibold focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                    />
                  </div>
                  {errorMsg && <p className="text-[11px] text-red-500 font-medium">{errorMsg}</p>}
                </div>

                <div className="w-full flex flex-col gap-3 mt-6">
                  <button
                    onClick={handleCreateAccount}
                    disabled={isCreatingAccount}
                    className="w-full py-4 rounded-xl font-black uppercase tracking-[0.15em] text-[11px] bg-secondary text-primary hover:shadow-[0_15px_30px_rgba(255,196,37,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreatingAccount ? <Loader2 className="animate-spin w-4 h-4" /> : <><ArrowRight size={15} /> Create Account</>}
                  </button>
                  <button onClick={() => { setErrorMsg(''); setAccountStep('choice'); }} className="text-[10px] font-bold text-on-surface-variant/40 hover:text-primary transition-colors uppercase tracking-widest">
                    ← Back
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step: Account created successfully */}
            {accountStep === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-5">
                  <LogIn size={36} />
                </div>
                <h3 className="text-xl font-black text-primary mb-2">
                  {isApplicantTokenValid() ? 'Application Submitted!' : 'Account Created!'}
                </h3>
                <p className="text-[12px] text-on-surface-variant/70 font-medium mb-6 leading-relaxed">
                  {isApplicantTokenValid() 
                    ? 'Your application has been successfully linked to your existing account.'
                    : <>You can now log in anytime using <strong>{accountForm.email}</strong> to view and edit your application.</>}
                </p>
                <button
                  onClick={onSuccess}
                  className="w-full py-4 rounded-xl font-black uppercase tracking-[0.15em] text-[11px] bg-secondary text-primary hover:shadow-[0_15px_30px_rgba(255,196,37,0.3)] transition-all"
                >
                  Go to Dashboard
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      )}

      {status === 'failed' && (
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-black text-primary mb-2">STK Push Failed</h3>
          <p className="text-[12px] text-on-surface-variant/80 font-medium leading-relaxed mb-6">
            Your STK push failed or was cancelled. Please send <strong>KES {amount}</strong> to Paybill <strong>{shortcode}</strong> and enter the transaction code below.
          </p>
          
          <div className="w-full space-y-4 mb-6">
            <input 
              type="text" 
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="e.g. OAH4V..." 
              className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium shadow-sm uppercase placeholder:normal-case placeholder:opacity-40 text-center tracking-widest"
              maxLength={20}
              disabled={isSubmitting}
            />
            {errorMsg && <p className="text-[11px] text-red-500 font-medium mt-1">{errorMsg}</p>}
          </div>

          <button
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] text-primary bg-secondary hover:shadow-[0_15px_30px_rgba(255,196,37,0.3)] transition-all mb-4 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Code'}
          </button>
          
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] text-on-surface-variant hover:text-primary transition-all bg-surface-variant/20 hover:bg-surface-variant/40"
          >
            Cancel Application
          </button>
        </div>
      )}
    </motion.div>
  );
}

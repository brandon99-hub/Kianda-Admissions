import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface Props {
  applicationId: number;
  onSuccess: () => void;
  onCancel: () => void;
  onBack: () => void;
  phoneNumber?: string;
}

export default function PaymentPolling({ applicationId, onSuccess, onCancel, onBack, phoneNumber }: Props) {
  const [status, setStatus] = useState<'polling' | 'success' | 'failed'>('polling');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shortcode = process.env.MPESA_SHORTCODE || '174379';
  const amount = process.env.MPESA_ENVIRONMENT === 'sandbox' ? '1' : '2,000';

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
            setTimeout(onSuccess, 2000); // Wait a bit before completing
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
      intervalId = setInterval(checkStatus, 3000); // Poll every 3 seconds
    }

    return () => clearInterval(intervalId);
  }, [applicationId, status, onSuccess]);

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
        setTimeout(onSuccess, 2000);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Failed to submit code');
      }
    } catch (err) {
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

      {status === 'success' && (
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner"
          >
            <CheckCircle size={40} />
          </motion.div>
          <h3 className="text-2xl font-black text-primary mb-3">Payment Successful!</h3>
          <p className="text-[13px] text-on-surface-variant/80 font-medium leading-relaxed">
            Your application is fully submitted. Redirecting...
          </p>
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

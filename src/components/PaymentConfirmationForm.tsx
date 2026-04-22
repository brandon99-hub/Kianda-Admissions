import React, { useState } from 'react';
import { PaymentDetails } from '../types';
import { ArrowLeft, ArrowRight, Check, CreditCard, ShieldCheck, Smartphone, Hash, User, CircleDollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


interface Props {
  data: PaymentDetails;
  updateData: (data: Partial<PaymentDetails>) => void;
  onSubmit: () => void;
  onBack: () => void;
  onCancel: () => void;
  candidateName: string;
  isSubmitting?: boolean;
}

export default function PaymentConfirmationForm({ data, updateData, onSubmit, onBack, onCancel, candidateName, isSubmitting }: Props) {
  const accountName = `${candidateName.split(' ').slice(0, 2).join(' ')} APP`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const instructionItems = [
    { label: 'Paybill Number', value: '34104', icon: Hash },
    { label: 'Account Name', value: accountName, icon: User },
    { label: 'Amount Due', value: 'KES 2,000', icon: CircleDollarSign },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white/70 backdrop-blur-3xl rounded-[40px] shadow-[0_50px_100px_-20px_rgba(24,33,109,0.12)] border border-white/50 overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="relative z-10">
          {/* Header Section */}
          <div className="p-10 md:p-12 pb-6 flex flex-col items-center text-center border-b border-primary/5">
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-inner ring-1 ring-primary/5">
              <Smartphone size={32} />
            </div>
            <h3 className="text-3xl font-extrabold text-primary font-headline tracking-tight mb-2">Payment Verification</h3>
            <p className="text-[13px] text-on-surface-variant/60 font-medium uppercase tracking-[0.2em]">Application Processing Fee</p>
          </div>

          {/* Instructions Section - Unified Horizontal Flow */}
          <div className="px-10 py-10 md:px-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative overflow-hidden">
             {instructionItems.map((item, i) => (
                <div key={item.label} className="flex flex-col items-center text-center group">
                   <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30 mb-3 group-hover:text-secondary transition-colors duration-500">{item.label}</div>
                   <div className="flex flex-col items-center">
                      <div className="text-xl md:text-2xl font-headline font-black text-primary tracking-tight leading-none group-hover:scale-105 transition-transform duration-500 mb-1">{item.value}</div>
                      <div className="w-1 h-1 rounded-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                   </div>
                </div>
             ))}
             
             {/* Styled Perforation Line */}
             <div className="absolute bottom-0 left-8 right-8 flex items-center gap-2 opacity-20">
                <div className="w-3 h-3 rounded-full bg-surface border border-outline-variant/10 -ml-4" />
                <div className="flex-1 h-[1px] border-t border-dashed border-primary" />
                <div className="w-3 h-3 rounded-full bg-surface border border-outline-variant/10 -mr-4" />
             </div>
          </div>

          {/* Verification Section */}
          <div className="p-10 md:p-16 pt-12">
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-6">
                 <div className="text-center">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/80 mb-2">Enter Transaction Code</h4>
                    <p className="text-[12px] text-on-surface-variant font-semibold opacity-60 italic">Found in your M-Pesa confirmation SMS</p>
                 </div>

                 <div className="relative max-w-md mx-auto group">
                    <input
                      type="text"
                      placeholder="e.g. RK91AB23XY"
                      value={data.mpesaCode}
                      onChange={(e) => updateData({ mpesaCode: e.target.value.toUpperCase() })}
                      className="w-full bg-primary/5 border-2 border-transparent rounded-2xl p-6 text-2xl font-mono font-black tracking-[0.3em] text-primary focus:ring-4 focus:ring-secondary/20 focus:bg-white focus:border-secondary transition-all text-center shadow-inner placeholder:opacity-10"
                      required
                      maxLength={10}
                    />
                    <AnimatePresence>
                      {data.mpesaCode.length === 10 && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute right-6 top-1/2 -translate-y-1/2 text-green-500"
                        >
                           <ShieldCheck size={24} className="drop-shadow-sm" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </div>

              <div className="flex flex-col items-center gap-10">
                 <button
                   type="submit"
                   disabled={isSubmitting || data.mpesaCode.length < 10}
                   className={`w-full max-w-md py-6 rounded-2xl font-black transition-all flex items-center justify-center gap-4 group border border-white/20 relative overflow-hidden shadow-[0_20px_40px_rgba(24,33,109,0.1)] ${isSubmitting || data.mpesaCode.length < 10 ? 'bg-surface-variant text-on-surface-variant opacity-40 cursor-not-allowed' : 'bg-secondary text-primary hover:shadow-[0_25px_50px_rgba(255,196,37,0.3)] hover:-translate-y-1 active:scale-95'}`}
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                   <span className="tracking-[0.3em] uppercase text-[12px] relative z-10 font-black">
                     {isSubmitting ? 'Verifying...' : 'Finalize Application'}
                   </span>
                   {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />}
                   {isSubmitting && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin relative z-10" />}
                 </button>

                 <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={onBack}
                      className="px-6 py-2 text-primary/40 hover:text-primary transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
                    >
                      <ArrowLeft size={14} />
                      Go Back
                    </button>
                    <div className="w-[1px] h-4 bg-primary/10 self-center" />
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-6 py-2 text-primary/20 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                      Cancel
                    </button>
                 </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-[10px] text-on-surface-variant/30 font-bold uppercase tracking-[0.3em] leading-relaxed max-w-lg mx-auto italic">
        Kianda School handles all applications with strict confidentiality. Final processing occurs once payment is confirmed.
      </p>
    </motion.div>
  );
}

import { ParentDetails } from '../types';
import { ArrowLeft, ArrowRight, Home, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';

interface Props {
  data: ParentDetails;
  updateData: (data: Partial<ParentDetails>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export default function ParentInfoForm({ data, updateData, onNext, onBack, onCancel }: Props) {
  const [showValidationModal, setShowValidationModal] = useState(false);

  const fields = [
    { label: "Full Name", key: "Name" },
    { label: "Phone Number", key: "Phone" },
    { label: "Email Address", key: "Email" },
    { label: "Profession", key: "Profession" },
    { label: "Place of Work", key: "Work" },
  ];

  const isFatherFilled = !!(data.fatherName || data.fatherPhone || data.fatherEmail || data.fatherProfession || data.fatherWork);
  const isMotherFilled = !!(data.motherName || data.motherPhone || data.motherEmail || data.motherProfession || data.motherWork);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFatherFilled && !isMotherFilled) {
      setShowValidationModal(true);
      return;
    }
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-transparent md:bg-surface-container-lowest p-0 md:p-12 rounded-none md:rounded-2xl shadow-none md:shadow-sm border-none md:border md:border-outline-variant/5"
    >
      <div className="relative z-10">
        <div className="mb-8 md:mb-10 flex items-start md:items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-primary shrink-0">
            <Home size={18} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h3 className="text-lg md:text-2xl font-bold text-primary leading-tight mb-0.5">Parent / Guardian Information</h3>
            <p className="text-[11px] md:text-sm text-on-surface-variant font-medium leading-snug">Please provide contact and professional details for at least one parent.</p>
          </div>
        </div>

        <form className="space-y-12" onSubmit={handleSubmit}>
          {/* Father's Details */}
          <div className="space-y-6">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.3em] text-secondary border-b border-outline-variant/10 pb-2">Father's Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {fields.map(f => (
                <div key={`father${f.key}`} className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">
                    {f.label} {isFatherFilled && f.key !== 'Email' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={f.key === 'Email' ? 'email' : 'text'}
                    value={(data as any)[`father${f.key}`] || ''}
                    onChange={(e) => updateData({ [`father${f.key}`]: e.target.value })}
                    className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium shadow-sm placeholder:opacity-40"
                    required={isFatherFilled && f.key !== 'Email'}
                  />
                </div>
              ))}
            </div>
            <div className="pt-4 mt-4 border-t border-outline-variant/5">
               <h5 className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-4">Alternative Contact if the Father isn't available</h5>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary">Name {isFatherFilled && <span className="text-red-500">*</span>}</label>
                    <input type="text" value={data.fatherAltContactName || ''} onChange={e => updateData({ fatherAltContactName: e.target.value })} required={isFatherFilled} className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium shadow-sm placeholder:opacity-40" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary">Phone {isFatherFilled && <span className="text-red-500">*</span>}</label>
                    <input type="text" value={data.fatherAltContactPhone || ''} onChange={e => updateData({ fatherAltContactPhone: e.target.value })} required={isFatherFilled} className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium shadow-sm placeholder:opacity-40" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary">Relationship {isFatherFilled && <span className="text-red-500">*</span>}</label>
                    <input type="text" value={data.fatherAltContactRelation || ''} onChange={e => updateData({ fatherAltContactRelation: e.target.value })} required={isFatherFilled} className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium shadow-sm placeholder:opacity-40" />
                  </div>
               </div>
            </div>
          </div>

          {/* Mother's Details */}
          <div className="space-y-6">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.3em] text-secondary border-b border-outline-variant/10 pb-2">Mother's Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {fields.map(f => (
                <div key={`mother${f.key}`} className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">
                    {f.label} {isMotherFilled && f.key !== 'Email' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={f.key === 'Email' ? 'email' : 'text'}
                    value={(data as any)[`mother${f.key}`] || ''}
                    onChange={(e) => updateData({ [`mother${f.key}`]: e.target.value })}
                    className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium shadow-sm placeholder:opacity-40"
                    required={isMotherFilled && f.key !== 'Email'}
                  />
                </div>
              ))}
            </div>
            <div className="pt-4 mt-4 border-t border-outline-variant/5">
               <h5 className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-4">Alternative Contact if the Mother isn't available</h5>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary">Name {isMotherFilled && <span className="text-red-500">*</span>}</label>
                    <input type="text" value={data.motherAltContactName || ''} onChange={e => updateData({ motherAltContactName: e.target.value })} required={isMotherFilled} className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium shadow-sm placeholder:opacity-40" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary">Phone {isMotherFilled && <span className="text-red-500">*</span>}</label>
                    <input type="text" value={data.motherAltContactPhone || ''} onChange={e => updateData({ motherAltContactPhone: e.target.value })} required={isMotherFilled} className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium shadow-sm placeholder:opacity-40" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary">Relationship {isMotherFilled && <span className="text-red-500">*</span>}</label>
                    <input type="text" value={data.motherAltContactRelation || ''} onChange={e => updateData({ motherAltContactRelation: e.target.value })} required={isMotherFilled} className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium shadow-sm placeholder:opacity-40" />
                  </div>
               </div>
            </div>
          </div>

          {/* Residency Details */}
          <div className="space-y-6">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.3em] text-secondary border-b border-outline-variant/10 pb-2">Family Residency</h4>
            <div className="grid grid-cols-1 gap-x-12 gap-y-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Physical Address / Estate</label>
                <input
                  type="text"
                  value={(data as any).residency || ''}
                  onChange={(e) => updateData({ residency: e.target.value })}
                  className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium shadow-sm placeholder:opacity-40"
                  required={false}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-between items-stretch md:items-center gap-6 md:gap-0 pt-8 w-full">
            <div className="flex flex-row gap-2 md:gap-4 w-full md:w-auto">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 md:flex-none justify-center px-4 md:px-8 py-4 text-on-surface-variant font-bold uppercase tracking-[0.2em] text-[10px] hover:text-primary transition-colors flex items-center gap-1 md:gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 md:flex-none text-center px-4 md:px-8 py-4 text-on-surface-variant/30 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] hover:text-primary transition-all md:hover:translate-x-[-4px]"
              >
                Cancel
              </button>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto justify-center px-10 py-5 bg-secondary text-primary rounded-[28px] font-black shadow-[0_20px_40px_rgba(255,196,37,0.25)] hover:shadow-[0_25px_50px_rgba(255,196,37,0.35)] hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-4 group border border-white/20 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="tracking-[0.25em] uppercase text-[11px] relative z-10">Continue to Additional Info</span>
              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all relative z-10 shadow-inner">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setShowValidationModal(false)} 
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] relative z-10 border border-outline-variant/10 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-black text-primary mb-2">Missing Details</h3>
              <p className="text-sm font-medium text-on-surface-variant mb-8 leading-relaxed">
                Please provide details for at least one parent or guardian before continuing.
              </p>
              
              <button 
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="w-full py-4 bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors shadow-xl shadow-primary/20"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { ParentDetails } from '../types';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  data: ParentDetails;
  updateData: (data: Partial<ParentDetails>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export default function ParentInfoForm({ data, updateData, onNext, onBack, onCancel }: Props) {
  const fields = [
    { label: "Full Name", key: "Name" },
    { label: "Phone Number", key: "Phone" },
    { label: "Email Address", key: "Email" },
    { label: "Profession", key: "Profession" },
    { label: "Place of Work", key: "Work" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-surface-container-lowest p-8 md:p-12 rounded-2xl shadow-sm border border-outline-variant/5"
    >
      <div className="relative z-10">
        <div className="mb-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-primary">
            <Home size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-primary">Parent / Guardian Information</h3>
            <p className="text-sm text-on-surface-variant font-medium">Please provide contact and professional details for both parents.</p>
          </div>
        </div>

        <form className="space-y-12" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
          {/* Father's Details */}
          <div className="space-y-6">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.3em] text-secondary border-b border-outline-variant/10 pb-2">Father's Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {fields.map(f => (
                <div key={`father${f.key}`} className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{f.label}</label>
                  <input
                    type={f.key === 'Email' ? 'email' : 'text'}
                    value={(data as any)[`father${f.key}`]}
                    onChange={(e) => updateData({ [`father${f.key}`]: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary transition-all text-sm font-medium"
                    required={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Mother's Details */}
          <div className="space-y-6">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.3em] text-secondary border-b border-outline-variant/10 pb-2">Mother's Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {fields.map(f => (
                <div key={`mother${f.key}`} className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{f.label}</label>
                  <input
                    type={f.key === 'Email' ? 'email' : 'text'}
                    value={(data as any)[`mother${f.key}`]}
                    onChange={(e) => updateData({ [`mother${f.key}`]: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary transition-all text-sm font-medium"
                    required={false}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-8">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onBack}
                className="px-8 py-4 text-on-surface-variant font-bold uppercase tracking-[0.2em] text-[10px] hover:text-primary transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="px-8 py-4 text-on-surface-variant/30 font-black uppercase tracking-[0.3em] text-[10px] hover:text-primary transition-all hover:translate-x-[-4px]"
              >
                Cancel Application
              </button>
            </div>
            <button
              type="submit"
              className="px-10 py-5 bg-secondary text-primary rounded-[28px] font-black shadow-[0_20px_40px_rgba(255,196,37,0.25)] hover:shadow-[0_25px_50px_rgba(255,196,37,0.35)] hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-4 group border border-white/20 relative overflow-hidden"
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
    </motion.div>
  );
}

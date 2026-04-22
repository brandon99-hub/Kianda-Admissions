import { AdditionalInfo, Sibling } from '../types';
import { ArrowLeft, ArrowRight, Plus, Trash2, Users, ChevronDown, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect } from 'react';

interface Props {
  data: AdditionalInfo;
  updateData: (data: Partial<AdditionalInfo>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export default function AdditionalInfoForm({ data, updateData, onNext, onBack, onCancel }: Props) {
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addSibling = () => {
    updateData({ siblings: [...data.siblings, { name: '', grade: '', relationship: '' }] });
  };

  const removeSibling = (index: number) => {
    updateData({ siblings: data.siblings.filter((_, i) => i !== index) });
  };

  const updateSibling = (index: number, field: keyof Sibling, value: string) => {
    const newSiblings = [...data.siblings];
    newSiblings[index] = { ...newSiblings[index], [field]: value };
    updateData({ siblings: newSiblings });
  };

  const years = [...Array(10)].map((_, i) => String(2026 - i));

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
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-primary">Additional Information</h3>
            <p className="text-sm text-on-surface-variant font-medium">Help us understand your family's connection to Kianda School.</p>
          </div>
        </div>

        <form className="space-y-12" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
          {/* Siblings */}
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
              <h4 className="text-sm font-extrabold uppercase tracking-[0.3em] text-secondary">Siblings / Relatives at Kianda</h4>
              <button 
                type="button" 
                onClick={addSibling}
                className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1 hover:text-secondary transition-colors"
              >
                <Plus size={14} /> Add Entry
              </button>
            </div>
            
            <div className="space-y-4">
              {data.siblings.length === 0 && (
                <p className="text-xs text-on-surface-variant italic opacity-60">No siblings or relatives listed.</p>
              )}
              {data.siblings.map((sibling, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-surface-container-low rounded-xl relative group">
                  <input
                    placeholder="Full Name"
                    value={sibling.name}
                    onChange={(e) => updateSibling(index, 'name', e.target.value)}
                    className="bg-white border-none rounded-lg p-3 text-xs font-semibold focus:ring-1 focus:ring-primary"
                  />
                  <input
                    placeholder="Class / Grade"
                    value={sibling.grade}
                    onChange={(e) => updateSibling(index, 'grade', e.target.value)}
                    className="bg-white border-none rounded-lg p-3 text-xs font-semibold focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="Relationship"
                      value={sibling.relationship}
                      onChange={(e) => updateSibling(index, 'relationship', e.target.value)}
                      className="flex-grow bg-white border-none rounded-lg p-3 text-xs font-semibold focus:ring-1 focus:ring-primary"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeSibling(index)}
                      className="p-3 text-red-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motivation */}
          <div className="space-y-6 pt-6">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.3em] text-secondary border-b border-outline-variant/10 pb-2">Enrollment Motivation</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Reason for choosing Kianda</label>
                <textarea
                  rows={4}
                  value={data.motivation}
                  onChange={(e) => updateData({ motivation: e.target.value })}
                  className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary transition-all text-sm font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">How did you hear about us?</label>
                  <select
                    value={data.source}
                    onChange={(e) => updateData({ source: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-secondary transition-all text-sm font-medium"
                    required
                  >
                    <option value="">Select Source</option>
                    <option value="Parent">Parent</option>
                    <option value="School">Through daughter's school</option>
                    <option value="Friend">Relative / Friend</option>
                    <option value="Website">Kianda Website</option>
                    <option value="SocialMedia">Social Media</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {data.source === 'Other' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Please specify</label>
                    <input
                      type="text"
                      value={data.sourceOther}
                      onChange={(e) => updateData({ sourceOther: e.target.value })}
                      className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-secondary transition-all text-sm font-medium"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prior Applications */}
          <div className="space-y-6 pt-6">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.3em] text-secondary border-b border-outline-variant/10 pb-2">Prior Applications</h4>
            <div className="flex flex-wrap items-center gap-12">
              <div className="flex items-center gap-6">
                <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant opacity-80">Have you applied before?</span>
                <div className="flex bg-surface-container-low p-1.5 rounded-full border border-outline-variant/5">
                  {([true, false] as const).map(val => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => updateData({ hasAppliedBefore: val })}
                      className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${data.hasAppliedBefore === val ? 'bg-secondary text-primary shadow-lg shadow-secondary/10' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {data.hasAppliedBefore && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-4 group/year"
                  >
                    <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant opacity-80">Year</span>
                    <div className="relative" ref={dropdownRef}>
                       <button
                         type="button"
                         onClick={() => setShowYearDropdown(!showYearDropdown)}
                         className="flex items-center gap-4 bg-surface-container-low px-6 py-2.5 rounded-2xl border border-outline-variant/5 hover:border-secondary transition-all shadow-sm group-hover/year:shadow-md"
                       >
                         <Calendar size={14} className="text-secondary" />
                         <span className="text-xs font-black text-primary tracking-widest">{data.previousApplicationYear || 'Select Year'}</span>
                         <ChevronDown size={14} className={`text-primary/20 transition-transform duration-300 ${showYearDropdown ? 'rotate-180 text-secondary' : ''}`} />
                       </button>

                       <AnimatePresence>
                         {showYearDropdown && (
                           <motion.div
                             initial={{ opacity: 0, y: 10, scale: 0.95 }}
                             animate={{ opacity: 1, y: 0, scale: 1 }}
                             exit={{ opacity: 0, y: 10, scale: 0.95 }}
                             className="absolute top-full mt-2 w-40 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-outline-variant/5 py-2 z-50 overflow-hidden"
                           >
                              {years.map(year => (
                                <button
                                  key={year}
                                  type="button"
                                  onClick={() => {
                                    updateData({ previousApplicationYear: year });
                                    setShowYearDropdown(false);
                                  }}
                                  className={`w-full px-6 py-2.5 text-left text-xs font-black tracking-widest transition-colors flex items-center justify-between hover:bg-secondary/10 ${data.previousApplicationYear === year ? 'text-secondary bg-secondary/5' : 'text-primary'}`}
                                >
                                  {year}
                                  {data.previousApplicationYear === year && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                                </button>
                              ))}
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
              <span className="tracking-[0.25em] uppercase text-[11px] relative z-10">Continue to Documents</span>
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

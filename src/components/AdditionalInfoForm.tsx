import { AdditionalInfo, Sibling } from '../types';
import { ArrowLeft, ArrowRight, Plus, Trash2, Users, ChevronDown, Calendar, MessageCircle } from 'lucide-react';
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
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

  const sourceOptions = [
    { label: 'Parent', value: 'Parent' },
    { label: "Through daughter's school", value: 'School' },
    { label: 'Relative / Friend', value: 'Friend' },
    { label: 'Kianda Website', value: 'Website' },
    { label: 'Social Media', value: 'SocialMedia' },
    { label: 'Other', value: 'Other' },
  ];
  const selectedSource = sourceOptions.find(o => o.value === data.source);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-transparent md:bg-surface-container-lowest p-0 md:p-12 rounded-none md:rounded-2xl shadow-none md:shadow-sm border-none md:border md:border-outline-variant/5"
    >
      <div className="relative z-10" ref={dropdownRef}>
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
              <h4 className="text-sm font-extrabold uppercase tracking-[0.3em] text-secondary">Siblings</h4>
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
                <p className="text-xs text-on-surface-variant italic opacity-60">No siblings listed.</p>
              )}
              {data.siblings.map((sibling, index) => (
                <div key={index} className="space-y-4 p-6 bg-surface-container-low rounded-3xl border border-primary/5 shadow-sm relative group">
                   <div className="flex justify-between items-center mb-2">
                     <h5 className="text-[11px] font-bold uppercase tracking-widest text-primary/60">Sibling {index + 1}</h5>
                     <button type="button" onClick={() => removeSibling(index)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 bg-white rounded-full shadow-sm">
                       <Trash2 size={14} />
                     </button>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <input 
                       placeholder="Full Name" 
                       value={sibling.name} 
                       onChange={(e) => updateSibling(index, 'name', e.target.value)} 
                       className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-bold focus:ring-2 focus:ring-primary/20 placeholder:text-primary/30" 
                     />
                     
                     <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(activeDropdown === `sib-${index}-rel` ? null : `sib-${index}-rel`)}
                          className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-bold flex justify-between items-center focus:ring-2 focus:ring-primary/20"
                        >
                          <span className={sibling.relationship ? 'text-primary' : 'text-primary/30'}>
                            {sibling.relationship || 'Relationship'}
                          </span>
                          <ChevronDown size={16} className={`text-primary/50 transition-transform ${activeDropdown === `sib-${index}-rel` ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {activeDropdown === `sib-${index}-rel` && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-primary/5 py-2 z-50 max-h-48 overflow-y-auto"
                            >
                              {['Brother', 'Sister', 'Relative', 'Friend'].map(rel => (
                                <button
                                  key={rel}
                                  type="button"
                                  onClick={() => { 
                                    const newSiblings = [...data.siblings];
                                    newSiblings[index] = { ...newSiblings[index], relationship: rel };
                                    if (rel === 'Relative' || rel === 'Friend') {
                                       newSiblings[index].schoolType = 'Kianda School';
                                    }
                                    updateData({ siblings: newSiblings });
                                    setActiveDropdown(null); 
                                  }}
                                  className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${sibling.relationship === rel ? 'bg-primary/5 text-primary' : 'text-on-surface hover:bg-surface-variant'}`}
                                >
                                  {rel}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(activeDropdown === `sib-${index}-grade` ? null : `sib-${index}-grade`)}
                          className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-bold flex justify-between items-center focus:ring-2 focus:ring-primary/20"
                        >
                          <span className={sibling.grade ? 'text-primary' : 'text-primary/30'}>
                            {sibling.grade || 'Class / Grade'}
                          </span>
                          <ChevronDown size={16} className={`text-primary/50 transition-transform ${activeDropdown === `sib-${index}-grade` ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {activeDropdown === `sib-${index}-grade` && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-primary/5 py-2 z-50 max-h-48 overflow-y-auto"
                            >
                              {['Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'].map(g => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => { updateSibling(index, 'grade', g); setActiveDropdown(null); }}
                                  className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${sibling.grade === g ? 'bg-primary/5 text-primary' : 'text-on-surface hover:bg-surface-variant'}`}
                                >
                                  {g}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                     
                     <div className="relative">
                        {sibling.relationship === 'Relative' || sibling.relationship === 'Friend' ? (
                          <div className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-bold text-primary flex justify-between items-center focus:ring-2 focus:ring-primary/20 cursor-default">
                             Kianda School
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setActiveDropdown(activeDropdown === `sib-${index}-sch` ? null : `sib-${index}-sch`)}
                              className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-bold flex justify-between items-center focus:ring-2 focus:ring-primary/20"
                            >
                              <span className={sibling.schoolType ? 'text-primary' : 'text-primary/30'}>
                                {sibling.schoolType || 'Select School'}
                              </span>
                              <ChevronDown size={16} className={`text-primary/50 transition-transform ${activeDropdown === `sib-${index}-sch` ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                              {activeDropdown === `sib-${index}-sch` && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-primary/5 py-2 z-50 max-h-48 overflow-y-auto"
                                >
                                  {['Kianda School', 'Other'].map(st => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => { updateSibling(index, 'schoolType', st); setActiveDropdown(null); }}
                                      className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${sibling.schoolType === st ? 'bg-primary/5 text-primary' : 'text-on-surface hover:bg-surface-variant'}`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                     </div>
                     
                     {sibling.schoolType === 'Other' && (
                        <input 
                          placeholder="School Name" 
                          value={sibling.schoolName || ''} 
                          onChange={(e) => updateSibling(index, 'schoolName', e.target.value)} 
                          className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-bold focus:ring-2 focus:ring-primary/20 placeholder:text-primary/30" 
                        />
                     )}
                     
                     {sibling.schoolType === 'Kianda School' && sibling.relationship !== 'Relative' && sibling.relationship !== 'Friend' && (
                       <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveDropdown(activeDropdown === `sib-${index}-ord` ? null : `sib-${index}-ord`)}
                            className="w-full bg-white border-none rounded-xl p-3.5 text-xs font-bold flex justify-between items-center focus:ring-2 focus:ring-primary/20"
                          >
                            <span className={sibling.kiandaOrder ? 'text-primary' : 'text-primary/30'}>
                              {[{label: '1st Born', value: '1st'},{label: '2nd Born', value: '2nd'},{label: '3rd Born', value: '3rd'},{label: '4th Born', value: '4th'},{label: '5th Born', value: '5th'}].find(o => o.value === sibling.kiandaOrder)?.label || 'Order in Kianda'}
                            </span>
                            <ChevronDown size={16} className={`text-primary/50 transition-transform ${activeDropdown === `sib-${index}-ord` ? 'rotate-180' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {activeDropdown === `sib-${index}-ord` && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-primary/5 py-2 z-50 max-h-48 overflow-y-auto"
                              >
                                {[{label: '1st Born', value: '1st'},{label: '2nd Born', value: '2nd'},{label: '3rd Born', value: '3rd'},{label: '4th Born', value: '4th'},{label: '5th Born', value: '5th'}].map(ko => (
                                  <button
                                    key={ko.value}
                                    type="button"
                                    onClick={() => { updateSibling(index, 'kiandaOrder', ko.value); setActiveDropdown(null); }}
                                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${sibling.kiandaOrder === ko.value ? 'bg-primary/5 text-primary' : 'text-on-surface hover:bg-surface-variant'}`}
                                  >
                                    {ko.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                       </div>
                     )}
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
                <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Reason for choosing Kianda <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  value={data.motivation}
                  onChange={(e) => updateData({ motivation: e.target.value })}
                  className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-primary transition-all text-sm font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 relative">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">How did you hear about us? <span className="text-red-500">*</span></label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'source' ? null : 'source')}
                    className={`w-full flex items-center justify-between bg-surface-container-low p-4 rounded-xl border-2 transition-all group ${activeDropdown === 'source' ? 'border-secondary shadow-lg shadow-secondary/10' : 'border-transparent hover:border-secondary/20'}`}
                  >
                    <div className="flex items-center gap-3">
                       <MessageCircle size={16} className={`${data.source ? 'text-secondary' : 'text-primary/20'}`} />
                       <span className={`text-sm font-black tracking-tight ${data.source ? 'text-primary' : 'text-primary/30'}`}>
                         {selectedSource ? selectedSource.label : 'Select Source'}
                       </span>
                    </div>
                    <ChevronDown size={14} className={`text-primary/20 transition-transform ${activeDropdown === 'source' ? 'rotate-180 text-secondary' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === 'source' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-outline-variant/5 py-3 z-[100]"
                      >
                        {sourceOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { updateData({ source: opt.value, sourceOther: (opt.value === 'Other' || opt.value === 'SocialMedia') ? data.sourceOther : '' }); setActiveDropdown(null); }}
                            className={`w-full px-6 py-3 text-left text-xs font-black tracking-widest hover:bg-secondary/10 transition-colors flex items-center justify-between ${data.source === opt.value ? 'bg-secondary/5 text-secondary' : 'text-primary'}`}
                          >
                            {opt.label}
                            {data.source === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence>
                  {data.source === 'SocialMedia' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-2 relative"
                    >
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Which platform?</label>
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(activeDropdown === 'platform' ? null : 'platform')}
                        className={`w-full flex items-center justify-between bg-surface-container-low p-4 rounded-xl border-2 transition-all group ${activeDropdown === 'platform' ? 'border-secondary shadow-lg shadow-secondary/10' : 'border-transparent hover:border-secondary/20'}`}
                      >
                         <span className={`text-sm font-black tracking-tight ${data.sourceOther ? 'text-primary' : 'text-primary/30'}`}>
                           {data.sourceOther || 'Select Platform'}
                         </span>
                         <ChevronDown size={14} className={`text-primary/20 transition-transform ${activeDropdown === 'platform' ? 'rotate-180 text-secondary' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === 'platform' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-outline-variant/5 py-3 z-[100]"
                          >
                            {['Instagram', 'Facebook', 'LinkedIn', 'TikTok'].map((platform) => (
                              <button
                                key={platform}
                                type="button"
                                onClick={() => { updateData({ sourceOther: platform }); setActiveDropdown(null); }}
                                className={`w-full px-6 py-3 text-left text-xs font-black tracking-widest hover:bg-secondary/10 transition-colors flex items-center justify-between ${data.sourceOther === platform ? 'bg-secondary/5 text-secondary' : 'text-primary'}`}
                              >
                                {platform}
                                {data.sourceOther === platform && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                  
                  {data.source === 'Other' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-2"
                    >
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Please specify</label>
                      <input
                        type="text"
                        placeholder="E.g. Billboard, Radio..."
                        value={data.sourceOther}
                        onChange={(e) => updateData({ sourceOther: e.target.value })}
                        className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-secondary transition-all text-sm font-medium shadow-inner"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Prior Applications */}
          <div className="space-y-6 pt-6">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.3em] text-secondary border-b border-outline-variant/10 pb-2">Prior Applications</h4>
            <div className="flex flex-wrap items-center gap-12">
              <div className="flex items-center gap-6">
                <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant opacity-80">Have you applied before? <span className="text-red-500">*</span></span>
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
                    <div className="relative">
                       <button
                         type="button"
                         onClick={() => setActiveDropdown(activeDropdown === 'year' ? null : 'year')}
                         className="flex items-center gap-4 bg-surface-container-low px-6 py-2.5 rounded-2xl border border-outline-variant/5 hover:border-secondary transition-all shadow-sm group-hover/year:shadow-md"
                       >
                         <Calendar size={14} className="text-secondary" />
                         <span className="text-xs font-black text-primary tracking-widest truncate max-w-[200px]">
                           {data.previousApplicationYears?.length ? data.previousApplicationYears.join(', ') : 'Select Years'}
                         </span>
                         <ChevronDown size={14} className={`text-primary/20 transition-transform duration-300 ${activeDropdown === 'year' ? 'rotate-180 text-secondary' : ''}`} />
                       </button>

                       <AnimatePresence>
                         {activeDropdown === 'year' && (
                           <motion.div
                             initial={{ opacity: 0, y: 10, scale: 0.95 }}
                             animate={{ opacity: 1, y: 0, scale: 1 }}
                             exit={{ opacity: 0, y: 10, scale: 0.95 }}
                             className="absolute top-full mt-2 w-40 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-outline-variant/5 py-2 z-[100] overflow-hidden max-h-60 overflow-y-auto"
                           >
                              {years.map(year => {
                                const isSelected = data.previousApplicationYears?.includes(year);
                                return (
                                <button
                                  key={year}
                                  type="button"
                                  onClick={() => {
                                    const current = data.previousApplicationYears || [];
                                    if (isSelected) {
                                      updateData({ previousApplicationYears: current.filter(y => y !== year) });
                                    } else {
                                      updateData({ previousApplicationYears: [...current, year] });
                                    }
                                  }}
                                  className={`w-full px-6 py-2.5 text-left text-xs font-black tracking-widest transition-colors flex items-center justify-between hover:bg-secondary/10 ${isSelected ? 'text-secondary bg-secondary/5' : 'text-primary'}`}
                                >
                                  {year}
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                                </button>
                                );
                              })}
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

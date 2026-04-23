import { CandidateInfo } from '../types';
import { Plus, X, Trash2, ListChecks, Calendar, Users, GraduationCap, PlusCircle, Pencil, AlertTriangle, Loader2, ChevronDown, BookCopy, Church, ArrowRight, School, Baby } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DatePicker from './DatePicker';


interface Props {
  data: CandidateInfo;
  updateData: (data: Partial<CandidateInfo>) => void;
  onNext: () => void;
  onCancel?: () => void;
}

export default function CandidateInfoForm({ data, updateData, onNext, onCancel }: Props) {
  const [activeDropdown, setActiveDropdown] = useState<'grade' | 'birthOrder' | 'religion' | 'denomination' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: availableGrades = [], isLoading: loadingGrades } = useQuery({
    queryKey: ['availableGrades'],
    queryFn: async () => {
      const res = await fetch('/api/grades/available');
      if (!res.ok) throw new Error('Failed to fetch grades');
      return res.json();
    }
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateSchool = (type: keyof CandidateInfo['schools'], field: 'name' | 'years', value: string) => {
    updateData({
      schools: {
        ...data.schools,
        [type]: { ...data.schools[type], [field]: value }
      }
    });
  };

  const birthOrderOptions = [
    { label: 'First Born', value: '1st' },
    { label: 'Second Born', value: '2nd' },
    { label: 'Third Born', value: '3rd' },
    { label: 'Fourth or later', value: '4th+' },
    { label: 'Only Child', value: 'Only Child' },
  ];

  const religionOptions = ['Christian', 'Hindu', 'Muslim', 'Other'];
  const denominationOptions = ['Catholic', 'Anglican', 'PCEA', 'SDA', 'Other'];

  const isPredefinedReligion = religionOptions.includes(data.religion);
  const showSpecifyReligion = data.religion === 'Other' || (!isPredefinedReligion && data.religion !== '');

  const isPredefinedDenomination = denominationOptions.includes(data.denomination);
  const showSpecifyDenomination = data.denomination === 'Other' || (!isPredefinedDenomination && data.denomination !== '');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-surface-container-lowest p-8 md:p-12 rounded-2xl shadow-sm border border-outline-variant/5"
    >
      <div className="relative z-10" ref={dropdownRef}>
        <div className="mb-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-primary">
            <School size={20} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-primary">Candidate Information</h3>
            <p className="text-sm text-on-surface-variant font-medium">Please provide accurate details of the prospective student.</p>
          </div>
        </div>

        <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
          {/* Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-2 relative">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Applying for Grade</label>
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'grade' ? null : 'grade')}
                className={`w-full flex items-center justify-between bg-surface-container-low p-4 rounded-xl border-2 transition-all group ${activeDropdown === 'grade' ? 'border-secondary shadow-lg shadow-secondary/10' : 'border-transparent hover:border-secondary/20'}`}
              >
                <div className="flex items-center gap-3">
                   <GraduationCap size={16} className={`${data.grade ? 'text-secondary' : 'text-primary/20'}`} />
                   <span className={`text-sm font-black tracking-tight ${data.grade ? 'text-primary' : 'text-primary/30'}`}>
                     {loadingGrades ? 'Loading vacancies...' : data.grade || 'Select Grade'}
                   </span>
                </div>
                <ChevronDown size={14} className={`text-primary/20 transition-transform ${activeDropdown === 'grade' ? 'rotate-180 text-secondary' : ''}`} />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'grade' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-outline-variant/5 py-3 z-[100] max-h-60 overflow-y-auto"
                  >
                    {!loadingGrades && availableGrades.length === 0 ? (
                      <div className="px-6 py-4 text-xs italic text-on-surface-variant opacity-60">No vacancies available.</div>
                    ) : (
                      availableGrades.map((g) => (
                        <button
                          key={g.gradeName}
                          type="button"
                          onClick={() => { updateData({ grade: g.gradeName }); setActiveDropdown(null); }}
                          className={`w-full px-6 py-3 text-left text-xs font-black tracking-widest hover:bg-secondary/10 transition-colors flex items-center justify-between ${data.grade === g.gradeName ? 'bg-secondary/5 text-secondary' : 'text-primary'}`}
                        >
                          {g.gradeName}
                          {data.grade === g.gradeName && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Full Name (As per birth certificate)</label>
              <input
                type="text"
                placeholder="First Middle Surname"
                value={data.fullName}
                onChange={(e) => updateData({ fullName: e.target.value })}
                className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-secondary transition-all text-sm font-black text-primary tracking-tight placeholder:opacity-20 shadow-inner"
                required
              />
            </div>

            <div className="space-y-0">
               <DatePicker 
                 label="Date of Birth"
                 value={data.dob}
                 onChange={(val) => updateData({ dob: val })}
                 placeholder="Select Date of Birth"
               />
            </div>

            <div className="space-y-2 relative">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Birth Order</label>
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'birthOrder' ? null : 'birthOrder')}
                className={`w-full flex items-center justify-between bg-surface-container-low p-4 rounded-xl border-2 transition-all group ${activeDropdown === 'birthOrder' ? 'border-secondary shadow-lg shadow-secondary/10' : 'border-transparent hover:border-secondary/20'}`}
              >
                <div className="flex items-center gap-3">
                   <Baby size={16} className={`${data.birthOrder ? 'text-secondary' : 'text-primary/20'}`} />
                   <span className={`text-sm font-black tracking-tight ${data.birthOrder ? 'text-primary' : 'text-primary/30'}`}>
                     {birthOrderOptions.find(o => o.value === data.birthOrder)?.label || 'Select Position'}
                   </span>
                </div>
                <ChevronDown size={14} className={`text-primary/20 transition-transform ${activeDropdown === 'birthOrder' ? 'rotate-180 text-secondary' : ''}`} />
              </button>

              <AnimatePresence>
                {activeDropdown === 'birthOrder' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-outline-variant/5 py-3 z-[100]"
                  >
                    {birthOrderOptions.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => { updateData({ birthOrder: o.value }); setActiveDropdown(null); }}
                        className={`w-full px-6 py-3 text-left text-xs font-black tracking-widest hover:bg-secondary/10 transition-colors flex items-center justify-between ${data.birthOrder === o.value ? 'bg-secondary/5 text-secondary' : 'text-primary'}`}
                      >
                        {o.label}
                        {data.birthOrder === o.value && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Religion Dropdown */}
            <div className="space-y-2 relative">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Religion</label>
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'religion' ? null : 'religion')}
                className={`w-full flex items-center justify-between bg-surface-container-low p-4 rounded-xl border-2 transition-all group ${activeDropdown === 'religion' ? 'border-secondary shadow-lg shadow-secondary/10' : 'border-transparent hover:border-secondary/20'}`}
              >
                <div className="flex items-center gap-3">
                   <BookCopy size={16} className={`${data.religion ? 'text-secondary' : 'text-primary/20'}`} />
                   <span className={`text-sm font-black tracking-tight ${data.religion ? 'text-primary' : 'text-primary/30'}`}>
                     {isPredefinedReligion ? data.religion : (data.religion ? 'Other' : 'Select Religion')}
                   </span>
                </div>
                <ChevronDown size={14} className={`text-primary/20 transition-transform ${activeDropdown === 'religion' ? 'rotate-180 text-secondary' : ''}`} />
              </button>

              <AnimatePresence>
                {activeDropdown === 'religion' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-outline-variant/5 py-3 z-[100]"
                  >
                    {religionOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { 
                          updateData({ religion: opt, denomination: opt === 'Christian' ? data.denomination : '' }); 
                          setActiveDropdown(null); 
                        }}
                        className={`w-full px-6 py-3 text-left text-xs font-black tracking-widest hover:bg-secondary/10 transition-colors flex items-center justify-between ${data.religion === opt || (!isPredefinedReligion && opt === 'Other' && data.religion !== '') ? 'bg-secondary/5 text-secondary' : 'text-primary'}`}
                      >
                        {opt}
                        {(data.religion === opt || (!isPredefinedReligion && opt === 'Other' && data.religion !== '')) && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showSpecifyReligion && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3">
                      <input
                        type="text"
                        placeholder="Please specify religion"
                        value={isPredefinedReligion ? '' : data.religion}
                        onChange={(e) => updateData({ religion: e.target.value })}
                        className="w-full bg-secondary/[0.03] border-2 border-secondary/10 rounded-xl p-4 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all text-sm font-black text-primary tracking-tight"
                        required
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Denomination Dropdown - Only for Christians */}
            <AnimatePresence>
              {data.religion === 'Christian' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2 relative"
                >
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Denomination</label>
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'denomination' ? null : 'denomination')}
                    className={`w-full flex items-center justify-between bg-surface-container-low p-4 rounded-xl border-2 transition-all group ${activeDropdown === 'denomination' ? 'border-secondary shadow-lg shadow-secondary/10' : 'border-transparent hover:border-secondary/20'}`}
                  >
                    <div className="flex items-center gap-3">
                       <Church size={16} className={`${data.denomination ? 'text-secondary' : 'text-primary/20'}`} />
                       <span className={`text-sm font-black tracking-tight ${data.denomination ? 'text-primary' : 'text-primary/30'}`}>
                         {isPredefinedDenomination ? data.denomination : (data.denomination ? 'Other' : 'Select Denomination')}
                       </span>
                    </div>
                    <ChevronDown size={14} className={`text-primary/20 transition-transform ${activeDropdown === 'denomination' ? 'rotate-180 text-secondary' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === 'denomination' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-outline-variant/5 py-3 z-[100]"
                      >
                        {denominationOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => { updateData({ denomination: opt }); setActiveDropdown(null); }}
                            className={`w-full px-6 py-3 text-left text-xs font-black tracking-widest hover:bg-secondary/10 transition-colors flex items-center justify-between ${data.denomination === opt || (!isPredefinedDenomination && opt === 'Other' && data.denomination !== '') ? 'bg-secondary/5 text-secondary' : 'text-primary'}`}
                          >
                            {opt}
                            {(data.denomination === opt || (!isPredefinedDenomination && opt === 'Other' && data.denomination !== '')) && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showSpecifyDenomination && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3">
                          <input
                            type="text"
                            placeholder="Please specify denomination"
                            value={isPredefinedDenomination ? '' : data.denomination}
                            onChange={(e) => updateData({ denomination: e.target.value })}
                            className="w-full bg-secondary/[0.03] border-2 border-secondary/10 rounded-xl p-4 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all text-sm font-black text-primary tracking-tight"
                            required
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Schools History */}
          <div className="space-y-6 pt-6 border-t border-outline-variant/10">
            <h4 className="text-lg font-bold text-primary italic">Previous Education History</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(['kindergarten', 'primary', 'junior'] as const)
                .filter(type => {
                  if (type === 'kindergarten') return true;
                  if (!data.grade) return true; // Show all if no grade selected

                  const gradeNum = parseInt(data.grade.replace(/\D/g, ''));
                  const isNumeric = /\d/.test(data.grade);

                  if (type === 'primary') {
                    if (!isNumeric) return false;
                    return gradeNum > 1;
                  }
                  if (type === 'junior') {
                    if (!isNumeric) return false;
                    return gradeNum >= 8;
                  }
                  return true;
                })
                .map((type) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={type} 
                    className="space-y-3 p-6 bg-surface-container-low rounded-[24px] border border-outline-variant/5 shadow-sm"
                  >
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-1 capitalize italic text-nowrap">
                      {type === 'junior' ? 'Junior Secondary' : `${type} Stage`}
                    </span>
                    <input
                      type="text"
                      placeholder="Name of School"
                      value={data.schools[type].name}
                      onChange={(e) => updateSchool(type, 'name', e.target.value)}
                      className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-secondary shadow-inner"
                    />
                    <input
                      type="text"
                      placeholder="Years (e.g. 2020-2022)"
                      value={data.schools[type].years}
                      onChange={(e) => updateSchool(type, 'years', e.target.value)}
                      className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-secondary shadow-inner"
                    />
                  </motion.div>
                ))}
            </div>
            {data.grade === '' && (
              <p className="text-xs text-on-surface-variant/40 italic text-center py-4 bg-primary-light/30 rounded-2xl">Please select a grade to see relevant school history sections.</p>
            )}
          </div>

          <div className="space-y-2 pt-6">
            <label className="block text-[11px] font-extrabold uppercase tracking-[0.3em] text-primary/40 ml-1">Relevant Medical Information</label>
            <textarea
              rows={3}
              placeholder="Allergies, chronic conditions, regular medications..."
              value={data.medicalInfo}
              onChange={(e) => updateData({ medicalInfo: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-[24px] p-6 focus:ring-2 focus:ring-secondary transition-all text-sm font-semibold shadow-inner placeholder:opacity-20"
            />
          </div>

          <div className="flex justify-between items-center pt-8">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-4 text-on-surface-variant/30 font-black uppercase tracking-[0.3em] text-[10px] hover:text-primary transition-all hover:translate-x-[-4px]"
            >
              Cancel Application
            </button>
            <button
              type="submit"
              className="px-10 py-5 bg-secondary text-primary rounded-[28px] font-black shadow-[0_20px_40px_rgba(255,196,37,0.25)] hover:shadow-[0_25px_50px_rgba(255,196,37,0.35)] hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-4 group border border-white/20 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="tracking-[0.25em] uppercase text-[11px] relative z-10">Continue to Parent Details</span>
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


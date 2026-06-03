import { CandidateInfo } from '../types';
import { Plus, X, Trash2, ListChecks, Calendar, Users, GraduationCap, PlusCircle, Pencil, AlertTriangle, Loader2, ChevronDown, BookCopy, Church, ArrowRight, School, Baby } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useRef, useEffect } from 'react';
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

  const updateSchool = (index: number, field: keyof CandidateInfo['schools'][0], value: string) => {
    const schools = Array.isArray(data.schools) ? data.schools : [];
    const newSchools = [...schools];
    newSchools[index] = { ...newSchools[index], [field]: value };
    updateData({ schools: newSchools });
  };
  
  const addSchool = () => {
    const schools = Array.isArray(data.schools) ? data.schools : [];
    updateData({ schools: [...schools, { type: '', name: '', years: '' }] });
  };
  
  const removeSchool = (index: number) => {
    const schools = Array.isArray(data.schools) ? data.schools : [];
    updateData({ schools: schools.filter((_, i) => i !== index) });
  };

  const birthOrderOptions = [
    { label: 'Only Child', value: 'Only Child' },
    { label: 'First Born', value: '1st' },
    { label: 'Second Born', value: '2nd' },
    { label: 'Third Born', value: '3rd' },
    { label: 'Fourth Born', value: '4th' },
    { label: 'Fifth Born', value: '5th' },
    { label: 'Other', value: 'Other' },
  ];
  
  const isPredefinedBirthOrder = birthOrderOptions.some(o => o.value === data.birthOrder);
  const showSpecifyBirthOrder = data.birthOrder === 'Other' || (!isPredefinedBirthOrder && data.birthOrder !== '');

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!data.fullName) {
      alert('Please enter the candidate full name first.');
      return;
    }
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/upload?candidateName=${encodeURIComponent(data.fullName)}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error();
      const resData = await response.json();
      updateData({ passportPhoto: resData.fileUrl });
    } catch (error) {
      console.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const religionOptions = ['Christian', 'Hindu', 'Muslim', 'Other'];
  const denominationOptions = ['Catholic', 'Anglican', 'PCEA', 'SDA', 'Other'];

  const isPredefinedReligion = religionOptions.includes(data.religion);
  const showSpecifyReligion = data.religion === 'Other' || (!isPredefinedReligion && data.religion !== '');

  const isPredefinedDenomination = denominationOptions.includes(data.denomination);
  const showSpecifyDenomination = data.denomination === 'Other' || (!isPredefinedDenomination && data.denomination !== '');

  if (!loadingGrades && availableGrades.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-surface-container-lowest p-12 rounded-2xl shadow-sm border border-outline-variant/5 text-center flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar size={32} />
        </div>
        <h3 className="text-2xl font-bold text-primary mb-3">Applications Closed</h3>
        <p className="text-sm text-on-surface-variant font-medium leading-relaxed max-w-md mx-auto">
          We are not currently accepting new applications. Please check back later when the next admission cycle opens.
        </p>
      </motion.div>
    );
  }

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
              <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Applying for Grade <span className="text-red-500">*</span></label>
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
                    {availableGrades.map((g) => (
                      <button
                        key={g.gradeName}
                        type="button"
                        onClick={() => { updateData({ grade: g.gradeName }); setActiveDropdown(null); }}
                        className={`w-full px-6 py-3 text-left text-xs font-black tracking-widest hover:bg-secondary/10 transition-colors flex items-center justify-between ${data.grade === g.gradeName ? 'bg-secondary/5 text-secondary' : 'text-primary'}`}
                      >
                        {g.gradeName}
                        {data.grade === g.gradeName && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Full Name (As per birth certificate) <span className="text-red-500">*</span></label>
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
                 label={<>Date of Birth <span className="text-red-500">*</span></>}
                 value={data.dob}
                 onChange={(val) => updateData({ dob: val })}
                 placeholder="Select Date of Birth"
               />
            </div>

            <div className="space-y-2 relative">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Birth Order <span className="text-red-500">*</span></label>
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
              <AnimatePresence>
                {showSpecifyBirthOrder && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3">
                      <input
                        type="text"
                        placeholder="Please specify birth order"
                        value={isPredefinedBirthOrder ? '' : data.birthOrder}
                        onChange={(e) => updateData({ birthOrder: e.target.value })}
                        className="w-full bg-secondary/[0.03] border-2 border-secondary/10 rounded-xl p-4 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all text-sm font-black text-primary tracking-tight"
                        required
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Religion Dropdown */}
            <div className="space-y-2 relative">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Religion <span className="text-red-500">*</span></label>
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
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Denomination <span className="text-red-500">*</span></label>
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
          
          {/* Assessment No (Grades 4-9) & Passport Photo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-6 border-t border-outline-variant/10">
             {data.grade && parseInt(data.grade.replace(/\D/g, '')) >= 4 && parseInt(data.grade.replace(/\D/g, '')) <= 9 && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Assessment No. <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter Assessment Number"
                    value={data.assessmentNo || ''}
                    onChange={(e) => updateData({ assessmentNo: e.target.value })}
                    className="w-full bg-surface-container-low border-none rounded-xl p-4 focus:ring-2 focus:ring-secondary transition-all text-sm font-black text-primary tracking-tight placeholder:opacity-20 shadow-inner"
                  />
                </div>
             )}
             
             <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Passport Photo <span className="text-[9px] font-semibold text-primary/40 normal-case tracking-normal ml-1">(not older than 1 year)</span> <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-4">
                  {data.passportPhoto ? (
                    <img src={data.passportPhoto} alt="Passport" className="w-16 h-16 rounded-lg object-cover border border-outline-variant/20" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-surface-container-low flex items-center justify-center border border-dashed border-outline-variant/20">
                      <Baby size={24} className="text-primary/20" />
                    </div>
                  )}
                  <label className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${!data.fullName ? 'bg-surface-variant text-on-surface-variant/30' : 'bg-secondary text-primary hover:bg-secondary/90'}`}>
                     {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                     <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto || !data.fullName} />
                  </label>
                </div>
                {!data.fullName && <p className="text-[10px] text-red-400 mt-1">Please enter candidate full name first</p>}
             </div>
          </div>

          {/* Schools History */}
          <div className="space-y-8 pt-6 border-t border-outline-variant/10">
            <div className="flex justify-between items-center mb-1">
              <div>
                <h4 className="text-lg font-bold text-primary italic mb-1">Previous Education History</h4>
                <p className="text-xs text-on-surface-variant font-medium">Please add all schools attended.</p>
              </div>
              <button 
                type="button" 
                onClick={() => addSchool()}
                className="text-[10px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1 hover:text-primary transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm border border-black/5 shrink-0"
              >
                <Plus size={14} /> Add School
              </button>
            </div>

            {(() => {
              const g = (data.grade || '').toLowerCase();
              let stages: string[] = ['Pre-Primary'];

              if (!g.includes('pp') && !g.includes('playgroup') && !g.includes('nursery')) {
                 const match = g.match(/\d+/);
                 if (match) {
                    const num = parseInt(match[0], 10);
                    if (num >= 2) stages.push('Lower Primary');
                    if (num >= 5) stages.push('Upper Primary');
                    if (num >= 8) stages.push('Junior Secondary');
                 }
              }
              
              const stageOptions = [...stages, 'Multiple Stages'];
              const schools = Array.isArray(data.schools) ? data.schools : [];

              return (
                <div className="space-y-3 bg-surface-container-low/30 p-5 rounded-3xl border border-primary/5">
                  <div className="space-y-3">
                    {schools.map((school, index) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={index} 
                          className="flex flex-col sm:flex-row items-center gap-3 p-2 bg-white rounded-[20px] border border-primary/5 shadow-sm group hover:border-primary/20 transition-all"
                        >
                          <div className="flex-1 flex flex-col sm:flex-row w-full gap-3">
                            <input
                              type="text"
                              placeholder="Name of School"
                              value={school.name}
                              onChange={(e) => updateSchool(index, 'name', e.target.value)}
                              className="flex-1 bg-surface-container-low/50 border-none rounded-xl p-3.5 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:bg-primary/5 transition-colors placeholder:text-primary/30 text-primary"
                            />
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                              <select
                                value={school.type || ''}
                                onChange={(e) => updateSchool(index, 'type', e.target.value)}
                                className="w-full sm:w-[160px] bg-surface-container-low/50 border-none rounded-xl p-3.5 text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:bg-primary/5 transition-colors text-primary cursor-pointer"
                              >
                                <option value="" disabled hidden>Stage(s) Attended</option>
                                {stageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                              <input
                                type="text"
                                placeholder="Years (e.g. 2020-2022)"
                                value={school.years}
                                onChange={(e) => updateSchool(index, 'years', e.target.value)}
                                className="w-[120px] bg-surface-container-low/50 border-none rounded-xl p-3.5 text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:bg-primary/5 transition-colors placeholder:text-primary/30 text-primary"
                              />
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeSchool(index)}
                            className="w-full sm:w-12 h-12 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                            title="Remove School"
                          >
                            <Trash2 size={18} />
                          </button>
                        </motion.div>
                    ))}
                  </div>
                  {schools.length === 0 && (
                    <div className="text-[11px] font-medium text-primary/40 italic py-3 bg-white/50 border border-primary/5 rounded-2xl px-5 text-center">
                      No previous schools added.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>


          <div className="space-y-2 pt-6">
            <label className="block text-[11px] font-extrabold uppercase tracking-[0.3em] text-primary ml-1">Relevant Medical Information</label>
            <textarea
              rows={3}
              placeholder="Allergies, chronic conditions, regular medications..."
              value={data.medicalInfo}
              onChange={(e) => updateData({ medicalInfo: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-[24px] p-6 focus:ring-2 focus:ring-secondary transition-all text-sm font-semibold shadow-inner placeholder:opacity-20"
            />
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-between items-stretch md:items-center gap-6 md:gap-0 pt-8 w-full">
            <button
              type="button"
              onClick={onCancel}
              className="w-full md:w-auto text-center px-8 py-4 text-on-surface-variant/30 font-black uppercase tracking-[0.3em] text-[10px] hover:text-primary transition-all md:hover:translate-x-[-4px]"
            >
              Cancel Application
            </button>
            <button
              type="submit"
              className="w-full md:w-auto justify-center px-10 py-5 bg-secondary text-primary rounded-[28px] font-black shadow-[0_20px_40px_rgba(255,196,37,0.25)] hover:shadow-[0_25px_50px_rgba(255,196,37,0.35)] hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-4 group border border-white/20 relative overflow-hidden"
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


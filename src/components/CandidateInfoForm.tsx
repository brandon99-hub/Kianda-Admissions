import { CandidateInfo } from '../types';
import { Plus, X, Trash2, ListChecks, Calendar, Users, GraduationCap, PlusCircle, Pencil, AlertTriangle, Loader2, ChevronDown, BookCopy, Church, ArrowRight, School, Baby, CheckCircle2 } from 'lucide-react';
import AuthenticatedImage from './admin/AuthenticatedImage';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: availableGrades = [], isLoading: loadingGrades } = useQuery({
    queryKey: ['availableGrades'],
    queryFn: async () => {
      const res = await fetch('/api/grades/available');
      if (!res.ok) throw new Error('Failed to fetch grades');
      const grades = await res.json();
      return grades.sort((a: any, b: any) => {
        const numA = parseInt(a.gradeName.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.gradeName.replace(/\D/g, '')) || 0;
        if (numA !== numB) return numA - numB;
        return a.gradeName.localeCompare(b.gradeName);
      });
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

  useEffect(() => {
    if (!data.schools || data.schools.length === 0) {
      updateData({ schools: [{ type: '', name: '', years: '', category: '' }] });
    }
  }, []);

  const handleCategoryChange = (index: number, newCategory: 'Kianda School' | 'Other') => {
    const schools = Array.isArray(data.schools) ? [...data.schools] : [];
    const isKianda = newCategory === 'Kianda School';
    schools[index] = {
      ...schools[index],
      category: newCategory,
      name: isKianda ? 'Kianda School' : (schools[index]?.name === 'Kianda School' ? '' : (schools[index]?.name || ''))
    };
    const hasKianda = schools.some(s => s.name?.trim().toLowerCase() === 'kianda school' || s.category === 'Kianda School');
    updateData({ schools, isCurrentKiandaStudent: hasKianda, currentSchoolType: hasKianda ? 'Kianda School' : 'Other' });
  };

  const updateSchool = (index: number, field: keyof CandidateInfo['schools'][0], value: string) => {
    const schools = Array.isArray(data.schools) ? [...data.schools] : [];
    schools[index] = { ...schools[index], [field]: value };
    const hasKianda = schools.some(s => s.name?.trim().toLowerCase() === 'kianda school' || s.category === 'Kianda School');
    updateData({ schools, isCurrentKiandaStudent: hasKianda, currentSchoolType: hasKianda ? 'Kianda School' : 'Other' });
  };
  
  const addSchool = () => {
    const schools = Array.isArray(data.schools) ? data.schools : [];
    updateData({ schools: [...schools, { type: '', name: '', years: '', category: '' }] });
  };
  
  const removeSchool = (index: number) => {
    const schools = Array.isArray(data.schools) ? data.schools : [];
    const updated = schools.filter((_, i) => i !== index);
    const hasKianda = updated.some(s => s.name?.trim().toLowerCase() === 'kianda school' || s.category === 'Kianda School');
    updateData({ schools: updated, isCurrentKiandaStudent: hasKianda, currentSchoolType: hasKianda ? 'Kianda School' : (updated.length > 0 ? 'Other' : '') });
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
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!data.fullName) {
      toast.error('Please enter the Candidate\'s Full Name first.');
      return;
    }

    // Reset previous error
    setPhotoUploadError(null);

    // Format & HEIC validation
    const fileName = file.name.toLowerCase();
    const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';
    if (isHeic) {
      const errMsg = 'Apple HEIC format is not supported by web browsers. Please choose a JPG or PNG photo.';
      setPhotoUploadError(errMsg);
      toast.error(errMsg);
      return;
    }

    const validImageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExt = validImageExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExt && !file.type.startsWith('image/')) {
      const errMsg = 'Please upload a valid image file (JPG, PNG, or WebP).';
      setPhotoUploadError(errMsg);
      toast.error(errMsg);
      return;
    }

    // 10MB Limit Check
    if (file.size > 10 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const errMsg = `Photo size (${sizeMb}MB) exceeds the 10MB limit. Please upload a smaller image.`;
      setPhotoUploadError(errMsg);
      toast.error(errMsg);
      return;
    }

    // Create Base64 preview
    const reader = new FileReader();
    reader.onloadend = () => {
      updateData({ passportPhotoPreview: reader.result as string });
    };
    reader.readAsDataURL(file);

    setIsUploadingPhoto(true);
    const toastId = toast.loading(`Uploading photo...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/upload?candidateName=${encodeURIComponent(data.fullName)}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errMsg = 'Failed to upload photo.';
        try {
          const resData = await response.json();
          if (resData.error) errMsg = resData.error;
        } catch {
          if (response.status === 413) {
            errMsg = 'Photo file exceeds the 10MB limit.';
          } else if (response.status === 415) {
            errMsg = 'Unsupported photo format. Please upload JPG, PNG, or WebP.';
          }
        }
        throw new Error(errMsg);
      }

      const resData = await response.json();
      updateData({ passportPhoto: resData.fileUrl });
      setPhotoUploadError(null);
      toast.success('Photo uploaded successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      const errMsg = error?.message || 'Failed to upload photo. Please check your connection and try again.';
      setPhotoUploadError(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
      // Reset input value so re-selecting same file triggers onChange
      e.target.value = '';
    }
  };

  const religionOptions = ['Christian', 'Hindu', 'Muslim', 'Other'];
  const denominationOptions = ['Catholic', 'Anglican', 'PCEA', 'SDA'];

  const isPredefinedReligion = religionOptions.includes(data.religion);
  const showSpecifyReligion = data.religion === 'Other' || (!isPredefinedReligion && data.religion !== '');

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
        <div className="mb-8 md:mb-10 flex items-start md:items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary-container rounded-full flex items-center justify-center text-primary shrink-0">
            <School size={18} className="md:w-5 md:h-5" />
          </div>
          <div>
            <h3 className="text-lg md:text-2xl font-bold text-primary leading-tight mb-0.5">Candidate Information</h3>
            <p className="text-[11px] md:text-sm text-on-surface-variant font-medium leading-snug">Please provide accurate details of the prospective student.</p>
          </div>
        </div>

        <form className="space-y-10" onSubmit={(e) => { 
          e.preventDefault(); 
          if (!data.grade) return toast.error('Please select a Class / Grade.');
          if (!data.fullName) return toast.error('Please enter the Full Name.');
          if (!data.dob) return toast.error('Please select the Date of Birth.');
          if (!data.birthOrder) return toast.error('Please select the Birth Order.');
          
          if (data.grade) {
             const gradeNum = parseInt(data.grade.replace(/\D/g, ''));
             if (!isNaN(gradeNum) && gradeNum >= 4 && (!data.assessmentNo || data.assessmentNo.trim() === '')) {
                 return toast.error('Please enter the Assessment Number.');
             }
          }

          if (!data.religion) return toast.error('Please select a Religion.');
          if (data.religion === 'Other') return toast.error('Please specify your religion.');
          if (data.religion === 'Christian' && !data.denomination) return toast.error('Please select a Denomination.');
          
          if (Array.isArray(data.schools) && data.schools.length > 0) {
            for (let i = 0; i < data.schools.length; i++) {
              const s = data.schools[i];
              const cat = s.category || (s.name?.trim().toLowerCase() === 'kianda school' ? 'Kianda School' : s.name ? 'Other' : '');
              if (cat === 'Other' && (!s.name || !s.name.trim())) {
                return toast.error(`Please enter the School Name for ${i === 0 ? 'Current School' : `School ${i + 1}`}.`);
              }
            }
          }

          if (!data.passportPhoto) return toast.error('Please upload a Passport Photo.');
          onNext(); 
        }}>
          {/* Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-2 relative">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Applying for Grade <span className="text-red-500">*</span></label>
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'grade' ? null : 'grade')}
                className={`w-full flex items-center justify-between bg-white p-4 rounded-xl border-2 transition-all group ${activeDropdown === 'grade' ? 'border-secondary shadow-lg shadow-secondary/10' : 'border-outline-variant/40 hover:border-secondary/40'}`}
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
                className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-4 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all text-sm font-black text-primary tracking-tight placeholder:opacity-40 shadow-sm"
                required
              />
            </div>

            <div className="space-y-0">
               <DatePicker 
                 label={<>Date of Birth <span className="text-red-500">*</span></>}
                 value={data.dob}
                 onChange={(val) => updateData({ dob: val })}
                 placeholder="Select Date of Birth"
                 maxDate={new Date()}
               />
            </div>

            <div className="space-y-2 relative">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Birth Order <span className="text-red-500">*</span></label>
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'birthOrder' ? null : 'birthOrder')}
                className={`w-full flex items-center justify-between bg-white p-4 rounded-xl border-2 transition-all group ${activeDropdown === 'birthOrder' ? 'border-secondary shadow-lg shadow-secondary/10' : 'border-outline-variant/40 hover:border-secondary/40'}`}
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
                className={`w-full flex items-center justify-between bg-white p-4 rounded-xl border-2 transition-all group ${activeDropdown === 'religion' ? 'border-secondary shadow-lg shadow-secondary/10' : 'border-outline-variant/40 hover:border-secondary/40'}`}
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
                    className={`w-full flex items-center justify-between bg-white p-4 rounded-xl border-2 transition-all group ${activeDropdown === 'denomination' ? 'border-secondary shadow-lg shadow-secondary/10' : 'border-outline-variant/40 hover:border-secondary/40'}`}
                  >
                    <div className="flex items-center gap-3">
                       <Church size={16} className={`${data.denomination ? 'text-secondary' : 'text-primary/20'}`} />
                       <span className={`text-sm font-black tracking-tight ${data.denomination ? 'text-primary' : 'text-primary/30'}`}>
                         {data.denomination || 'Select Denomination'}
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
                            className={`w-full px-6 py-3 text-left text-xs font-black tracking-widest hover:bg-secondary/10 transition-colors flex items-center justify-between ${data.denomination === opt ? 'bg-secondary/5 text-secondary' : 'text-primary'}`}
                          >
                            {opt}
                            {data.denomination === opt && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Assessment No (Grades 4+) & Passport Photo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-6 border-t border-outline-variant/10">
             {data.grade && !isNaN(parseInt(data.grade.replace(/\D/g, ''))) && parseInt(data.grade.replace(/\D/g, '')) >= 4 && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Assessment No. <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter Assessment Number"
                    value={data.assessmentNo || ''}
                    onChange={(e) => updateData({ assessmentNo: e.target.value })}
                    className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-4 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all text-sm font-black text-primary tracking-tight placeholder:opacity-40 shadow-sm"
                  />
                </div>
             )}
             
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-primary">Passport Photo <span className="text-[9px] font-semibold text-primary/40 normal-case tracking-normal ml-1">(not older than 1 year • Max 10MB • JPG, PNG, WebP)</span> <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-4 flex-wrap">
                  {data.passportPhotoPreview ? (
                    <img src={data.passportPhotoPreview} alt="Passport" className="w-16 h-16 rounded-lg object-cover border border-outline-variant/40 shrink-0" />
                  ) : data.passportPhoto ? (
                    <AuthenticatedImage src={data.passportPhoto} alt="Passport" className="w-16 h-16 rounded-lg object-cover border border-outline-variant/40 shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-surface-container-low flex items-center justify-center border border-dashed border-outline-variant/40 shrink-0">
                      <Baby size={24} className="text-primary/20" />
                    </div>
                  )}
                  <label className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${!data.fullName ? 'bg-surface-variant text-on-surface-variant/30 cursor-not-allowed' : 'bg-secondary text-primary hover:bg-secondary/90'}`}>
                     {isUploadingPhoto ? 'Uploading...' : data.passportPhoto ? 'Change Photo' : 'Upload Photo'}
                     <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} disabled={isUploadingPhoto || !data.fullName} />
                  </label>
                  {(data.passportPhoto || data.passportPhotoPreview) && !isUploadingPhoto && (
                    <button
                      type="button"
                      onClick={() => updateData({ passportPhoto: '', passportPhotoPreview: '' })}
                      className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
                      title="Remove uploaded photo"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>
                {!data.fullName && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0" /> Please enter Candidate's Full Name above before uploading photo.
                  </p>
                )}
                {photoUploadError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-600 text-[11px] font-medium leading-tight">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>{photoUploadError}</span>
                    </div>
                  </div>
                )}
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
                <div className="space-y-4 bg-surface-container-low/30 p-4 sm:p-6 rounded-3xl border border-primary/5">
                  <div className="space-y-4">
                    {schools.map((school, index) => {
                      const category = school.category || (school.name?.trim().toLowerCase() === 'kianda school' ? 'Kianda School' : school.name ? 'Other' : '');

                      return (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={index} 
                          className="p-5 sm:p-6 bg-white rounded-2xl border border-primary/10 shadow-sm hover:border-primary/20 transition-all space-y-4"
                        >
                          <div className="flex items-center justify-between pb-3 border-b border-primary/5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-[10px] font-black">
                                {index + 1}
                              </div>
                              <span className="text-xs font-black uppercase tracking-wider text-primary">
                                {index === 0 ? 'Current / Most Recent School' : `Previous School ${index + 1}`}
                              </span>
                              {category === 'Kianda School' && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-secondary bg-secondary/15 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <School size={12} /> Kianda School
                                </span>
                              )}
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeSchool(index)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                              title="Remove School"
                            >
                              <Trash2 size={15} />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          </div>

                          <div className={`grid grid-cols-1 ${category === 'Other' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'} gap-4 items-start`}>
                            {/* Field 1: School Selector (Kianda School / Other) */}
                            <div className="space-y-1.5 relative">
                              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-primary">
                                School <span className="text-red-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === `school-${index}-cat` ? null : `school-${index}-cat`)}
                                className={`w-full flex items-center justify-between bg-white p-3.5 rounded-xl border-2 transition-all group ${
                                  activeDropdown === `school-${index}-cat` 
                                    ? 'border-secondary shadow-lg shadow-secondary/10' 
                                    : 'border-outline-variant/40 hover:border-secondary/40'
                                }`}
                              >
                                <span className={`text-xs font-bold tracking-tight ${category ? 'text-primary' : 'text-primary/30'}`}>
                                  {category || 'Select School'}
                                </span>
                                <ChevronDown 
                                  size={14} 
                                  className={`text-primary/20 transition-transform ${activeDropdown === `school-${index}-cat` ? 'rotate-180 text-secondary' : ''}`} 
                                />
                              </button>

                              <AnimatePresence>
                                {activeDropdown === `school-${index}-cat` && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-outline-variant/5 py-3 z-[100]"
                                  >
                                    {['Kianda School', 'Other'].map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                          handleCategoryChange(index, opt as 'Kianda School' | 'Other');
                                          setActiveDropdown(null);
                                        }}
                                        className={`w-full px-5 py-2.5 text-left text-xs font-bold tracking-wider hover:bg-secondary/10 transition-colors flex items-center justify-between ${
                                          category === opt ? 'bg-secondary/5 text-secondary' : 'text-primary'
                                        }`}
                                      >
                                        {opt}
                                        {category === opt && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Field 2: School Name (Only if Other) */}
                            {category === 'Other' && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-1.5"
                              >
                                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-primary">
                                  School Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="Enter School Name"
                                  value={school.name === 'Kianda School' ? '' : (school.name || '')}
                                  onChange={(e) => updateSchool(index, 'name', e.target.value)}
                                  className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-3.5 text-xs font-bold focus:ring-2 focus:ring-secondary focus:border-secondary transition-all placeholder:text-primary/30 text-primary shadow-sm"
                                  required
                                />
                              </motion.div>
                            )}

                            {/* Field 3: Stage(s) Attended */}
                            <div className="space-y-1.5 relative">
                              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-primary">
                                Stage(s) Attended
                              </label>
                              <button
                                type="button"
                                onClick={() => setActiveDropdown(activeDropdown === `school-${index}-stage` ? null : `school-${index}-stage`)}
                                className={`w-full flex items-center justify-between bg-white p-3.5 rounded-xl border-2 transition-all group ${
                                  activeDropdown === `school-${index}-stage` 
                                    ? 'border-secondary shadow-lg shadow-secondary/10' 
                                    : 'border-outline-variant/40 hover:border-secondary/40'
                                }`}
                              >
                                <span className={`text-xs font-bold tracking-tight ${school.type ? 'text-primary' : 'text-primary/30'}`}>
                                  {school.type || 'Select Stage'}
                                </span>
                                <ChevronDown 
                                  size={14} 
                                  className={`text-primary/20 transition-transform ${activeDropdown === `school-${index}-stage` ? 'rotate-180 text-secondary' : ''}`} 
                                />
                              </button>

                              <AnimatePresence>
                                {activeDropdown === `school-${index}-stage` && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-outline-variant/5 py-3 z-[100] max-h-56 overflow-y-auto"
                                  >
                                    {stageOptions.map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                          updateSchool(index, 'type', opt);
                                          setActiveDropdown(null);
                                        }}
                                        className={`w-full px-5 py-2.5 text-left text-xs font-bold tracking-wider hover:bg-secondary/10 transition-colors flex items-center justify-between ${
                                          school.type === opt ? 'bg-secondary/5 text-secondary' : 'text-primary'
                                        }`}
                                      >
                                        {opt}
                                        {school.type === opt && <div className="w-1.5 h-1.5 rounded-full bg-secondary" />}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Field 4: Years Attended */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-primary">
                                Years Attended
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. 2020-2022"
                                value={school.years || ''}
                                onChange={(e) => updateSchool(index, 'years', e.target.value)}
                                className="w-full bg-white border-2 border-outline-variant/40 rounded-xl p-3.5 text-xs font-bold focus:ring-2 focus:ring-secondary focus:border-secondary transition-all placeholder:text-primary/30 text-primary shadow-sm"
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  {schools.length === 0 && (
                    <div className="text-xs font-medium text-primary/50 italic py-6 bg-white/60 border-2 border-dashed border-outline-variant/30 rounded-2xl px-5 text-center flex flex-col items-center gap-2">
                      <span>No previous schools added.</span>
                      <button 
                        type="button" 
                        onClick={addSchool}
                        className="text-xs font-bold text-secondary hover:underline"
                      >
                        + Add School
                      </button>
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
              className="w-full bg-white border-2 border-outline-variant/40 rounded-[24px] p-6 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all text-sm font-semibold shadow-sm placeholder:opacity-40"
            />
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-between items-stretch md:items-center gap-6 md:gap-0 pt-8 w-full">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full md:w-auto text-center px-8 py-4 text-on-surface-variant/30 font-black uppercase tracking-[0.3em] text-[10px] hover:text-primary transition-all md:hover:translate-x-[-4px]"
              >
                Cancel Application
              </button>
            )}
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


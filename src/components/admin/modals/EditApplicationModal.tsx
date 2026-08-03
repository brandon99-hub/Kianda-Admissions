import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { authFetch } from '../../../utils/auth';

interface EditApplicationModalProps {
  app: any;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditApplicationModal({ app, onClose, onUpdate }: EditApplicationModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [availableGrades, setAvailableGrades] = useState<{gradeName: string}[]>([]);

  // Initialize state with application data
  const [candidate, setCandidate] = useState(app.candidate || {});
  const [parentDetails, setParentDetails] = useState(app.parentDetails || {});
  const [additionalInfo, setAdditionalInfo] = useState(app.additionalInfo || {});

  useEffect(() => {
    fetch('/api/grades/available')
      .then(res => res.json())
      .then(data => setAvailableGrades(data || []))
      .catch(() => setAvailableGrades([]));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCandidateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setCandidate({ ...candidate, [e.target.name]: e.target.value });
  };

  const handleParentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setParentDetails({ ...parentDetails, [e.target.name]: e.target.value });
  };

  const handleAdditionalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setAdditionalInfo({ ...additionalInfo, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving application details...');
    try {
      const payload = {
        candidate,
        parentDetails,
        additionalInfo,
      };

      const res = await authFetch(`/api/admin/applications/${app.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to update application');
      
      toast.success('Application updated successfully!', { id: toastId });
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update application', { id: toastId });
    } finally {
      setIsSaving(false);
    }
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

  const religionOptions = ['Christian', 'Hindu', 'Muslim', 'Other'];
  const denominationOptions = ['Catholic', 'Anglican', 'PCEA', 'SDA', 'Other'];
  
  const sourceOptions = [
    { label: "Through daughter's school", value: 'School' },
    { label: 'Kianda Website', value: 'Website' },
    { label: 'Relative / Friend', value: 'Friend' },
    { label: 'Current Parent', value: 'Parent' },
    { label: 'Social Media', value: 'SocialMedia' },
    { label: 'Other', value: 'Other' },
  ];

  let sourceOtherLabel = "Please specify";
  if (additionalInfo.source === "SocialMedia") sourceOtherLabel = "Which platform?";
  else if (additionalInfo.source === "Friend") sourceOtherLabel = "Relative/Friend's Name";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest shrink-0 z-20">
          <div>
            <h2 className="text-xl font-black text-primary">Edit Application Details</h2>
            <p className="text-xs font-bold text-primary/40">APP-{app.id.toString().padStart(4, '0')} - {candidate.fullName || 'Candidate'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-primary/5 text-primary/40 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content (Continuous Scroll) */}
        <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar" ref={dropdownRef}>
          
          {/* CANDIDATE SECTION */}
          <div className="space-y-6 mb-12">
            <h3 className="text-sm font-black uppercase tracking-widest text-secondary border-b border-outline-variant/10 pb-2">Candidate Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Full Name</label>
                <input name="fullName" value={candidate.fullName || ''} onChange={handleCandidateChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
              </div>
              
              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Grade</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'grade' ? null : 'grade')}
                  className="w-full flex items-center justify-between bg-white px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold"
                >
                  <span className={candidate.grade ? 'text-primary' : 'text-primary/30'}>
                    {candidate.grade || 'Select Grade'}
                  </span>
                  <ChevronDown size={14} className={`text-primary/40 transition-transform ${activeDropdown === 'grade' ? 'rotate-180 text-secondary' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'grade' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-outline-variant/5 py-2 z-50 max-h-48 overflow-y-auto"
                    >
                      {availableGrades.map((g) => (
                        <button
                          key={g.gradeName}
                          type="button"
                          onClick={() => { setCandidate({...candidate, grade: g.gradeName}); setActiveDropdown(null); }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${candidate.grade === g.gradeName ? 'bg-secondary/5 text-secondary' : 'text-primary hover:bg-surface-variant'}`}
                        >
                          {g.gradeName}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Assessment No</label>
                <input name="assessmentNo" value={candidate.assessmentNo || ''} onChange={handleCandidateChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Date of Birth</label>
                <input type="date" name="dob" value={candidate.dob ? new Date(candidate.dob).toISOString().split('T')[0] : ''} onChange={handleCandidateChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Birth Order</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'birthOrder' ? null : 'birthOrder')}
                  className="w-full flex items-center justify-between bg-white px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold"
                >
                  <span className={candidate.birthOrder ? 'text-primary' : 'text-primary/30'}>
                    {birthOrderOptions.find(o => o.value === candidate.birthOrder)?.label || candidate.birthOrder || 'Select Position'}
                  </span>
                  <ChevronDown size={14} className={`text-primary/40 transition-transform ${activeDropdown === 'birthOrder' ? 'rotate-180 text-secondary' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'birthOrder' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-outline-variant/5 py-2 z-50 max-h-48 overflow-y-auto"
                    >
                      {birthOrderOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setCandidate({...candidate, birthOrder: opt.value}); setActiveDropdown(null); }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${candidate.birthOrder === opt.value ? 'bg-secondary/5 text-secondary' : 'text-primary hover:bg-surface-variant'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Religion</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'religion' ? null : 'religion')}
                  className="w-full flex items-center justify-between bg-white px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold"
                >
                  <span className={candidate.religion ? 'text-primary' : 'text-primary/30'}>
                    {candidate.religion || 'Select Religion'}
                  </span>
                  <ChevronDown size={14} className={`text-primary/40 transition-transform ${activeDropdown === 'religion' ? 'rotate-180 text-secondary' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'religion' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-outline-variant/5 py-2 z-50 max-h-48 overflow-y-auto"
                    >
                      {religionOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setCandidate({...candidate, religion: opt}); setActiveDropdown(null); }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${candidate.religion === opt ? 'bg-secondary/5 text-secondary' : 'text-primary hover:bg-surface-variant'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Denomination</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'denomination' ? null : 'denomination')}
                  className="w-full flex items-center justify-between bg-white px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold"
                >
                  <span className={candidate.denomination ? 'text-primary' : 'text-primary/30'}>
                    {candidate.denomination || 'Select Denomination'}
                  </span>
                  <ChevronDown size={14} className={`text-primary/40 transition-transform ${activeDropdown === 'denomination' ? 'rotate-180 text-secondary' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'denomination' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-outline-variant/5 py-2 z-50 max-h-48 overflow-y-auto"
                    >
                      {denominationOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => { setCandidate({...candidate, denomination: opt}); setActiveDropdown(null); }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${candidate.denomination === opt ? 'bg-secondary/5 text-secondary' : 'text-primary hover:bg-surface-variant'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Medical Info</label>
                <textarea name="medicalInfo" value={candidate.medicalInfo || ''} onChange={handleCandidateChange} rows={3} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
              </div>
            </div>
          </div>

          {/* PARENTS SECTION */}
          <div className="space-y-8 mb-12">
            <h3 className="text-sm font-black uppercase tracking-widest text-secondary border-b border-outline-variant/10 pb-2">Parents Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Father */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary opacity-80">Father's Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Name</label>
                    <input name="fatherName" value={parentDetails.fatherName || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Phone</label>
                    <input name="fatherPhone" value={parentDetails.fatherPhone || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Email</label>
                    <input name="fatherEmail" value={parentDetails.fatherEmail || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Profession</label>
                    <input name="fatherProfession" value={parentDetails.fatherProfession || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Work</label>
                    <input name="fatherWork" value={parentDetails.fatherWork || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Residency / Address</label>
                    <input name="fatherResidency" value={parentDetails.fatherResidency || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                  </div>
                  
                  <div className="pt-2 border-t border-primary/5">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Alt Contact (If Father not available)</h5>
                    <div className="space-y-2">
                      <input name="fatherAltContactName" placeholder="Name" value={parentDetails.fatherAltContactName || ''} onChange={handleParentChange} className="w-full px-3 py-2 rounded-lg border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-xs font-bold text-primary" />
                      <input name="fatherAltContactPhone" placeholder="Phone" value={parentDetails.fatherAltContactPhone || ''} onChange={handleParentChange} className="w-full px-3 py-2 rounded-lg border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-xs font-bold text-primary" />
                      <input name="fatherAltContactRelation" placeholder="Relation" value={parentDetails.fatherAltContactRelation || ''} onChange={handleParentChange} className="w-full px-3 py-2 rounded-lg border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-xs font-bold text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mother */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary opacity-80">Mother's Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Name</label>
                    <input name="motherName" value={parentDetails.motherName || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Phone</label>
                    <input name="motherPhone" value={parentDetails.motherPhone || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Email</label>
                    <input name="motherEmail" value={parentDetails.motherEmail || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Profession</label>
                    <input name="motherProfession" value={parentDetails.motherProfession || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Work</label>
                    <input name="motherWork" value={parentDetails.motherWork || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Residency / Address</label>
                    <input name="motherResidency" value={parentDetails.motherResidency || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                  </div>
                  
                  <div className="pt-2 border-t border-primary/5">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Alt Contact (If Mother not available)</h5>
                    <div className="space-y-2">
                      <input name="motherAltContactName" placeholder="Name" value={parentDetails.motherAltContactName || ''} onChange={handleParentChange} className="w-full px-3 py-2 rounded-lg border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-xs font-bold text-primary" />
                      <input name="motherAltContactPhone" placeholder="Phone" value={parentDetails.motherAltContactPhone || ''} onChange={handleParentChange} className="w-full px-3 py-2 rounded-lg border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-xs font-bold text-primary" />
                      <input name="motherAltContactRelation" placeholder="Relation" value={parentDetails.motherAltContactRelation || ''} onChange={handleParentChange} className="w-full px-3 py-2 rounded-lg border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-xs font-bold text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {parentDetails.residency && (!parentDetails.fatherResidency && !parentDetails.motherResidency) && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Legacy Family Residency</label>
                <input name="residency" value={parentDetails.residency || ''} onChange={handleParentChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
              </div>
            )}
          </div>

          {/* ADDITIONAL SECTION */}
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-secondary border-b border-outline-variant/10 pb-2">Additional Information</h3>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">Motivation</label>
              <textarea name="motivation" value={additionalInfo.motivation || ''} onChange={handleAdditionalChange} rows={4} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">How did you hear about us?</label>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'source' ? null : 'source')}
                  className="w-full flex items-center justify-between bg-white px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold"
                >
                  <span className={additionalInfo.source ? 'text-primary' : 'text-primary/30'}>
                    {sourceOptions.find(o => o.value === additionalInfo.source)?.label || additionalInfo.source || 'Select Source'}
                  </span>
                  <ChevronDown size={14} className={`text-primary/40 transition-transform ${activeDropdown === 'source' ? 'rotate-180 text-secondary' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'source' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-outline-variant/5 py-2 z-50 max-h-48 overflow-y-auto"
                    >
                      {sourceOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setAdditionalInfo({...additionalInfo, source: opt.value}); setActiveDropdown(null); }}
                          className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${additionalInfo.source === opt.value ? 'bg-secondary/5 text-secondary' : 'text-primary hover:bg-surface-variant'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {(additionalInfo.source === 'Other' || additionalInfo.source === 'SocialMedia' || additionalInfo.source === 'Friend') && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-2">{sourceOtherLabel}</label>
                  <input name="sourceOther" value={additionalInfo.sourceOther || ''} onChange={handleAdditionalChange} className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant/40 shadow-sm focus:ring-2 focus:ring-secondary/50 text-sm font-bold text-primary" />
                </motion.div>
              )}
            </div>

            {/* Sibling Info (Read Only Display) */}
            <div className="pt-4 mt-6 border-t border-outline-variant/10">
              <label className="block text-[10px] font-black uppercase tracking-widest text-primary/60 mb-4">Input Sibling Information (Read Only)</label>
              {app.siblings && app.siblings.length > 0 ? (
                <div className="space-y-3">
                  {app.siblings.map((sib: any, idx: number) => (
                    <div key={idx} className="bg-surface-container-lowest p-4 rounded-xl border-2 border-outline-variant/40 shadow-sm flex flex-wrap gap-x-6 gap-y-2 items-center">
                      <div><span className="text-[10px] text-primary/40 uppercase font-bold">Name:</span> <span className="text-xs font-bold text-primary">{sib.name}</span></div>
                      <div><span className="text-[10px] text-primary/40 uppercase font-bold">Grade:</span> <span className="text-xs font-bold text-primary">{sib.grade}</span></div>
                      <div><span className="text-[10px] text-primary/40 uppercase font-bold">Rel:</span> <span className="text-xs font-bold text-primary">{sib.relationship}</span></div>
                      <div><span className="text-[10px] text-primary/40 uppercase font-bold">School:</span> <span className="text-xs font-bold text-primary">{sib.schoolType === 'Kianda School' ? 'Kianda' : sib.schoolName}</span></div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-bold text-primary/40 italic">No sibling information provided.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant/10 bg-surface-container-lowest shrink-0 z-20 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-secondary text-primary rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

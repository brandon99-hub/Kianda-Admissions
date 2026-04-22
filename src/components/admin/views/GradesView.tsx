import React, { useState } from 'react';
import { Plus, X, Trash2, ListChecks, Calendar, Users, GraduationCap, PlusCircle, Pencil, AlertTriangle, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminPageHeader from '../AdminPageHeader';
import { useGrades, useAssessments, useCreateGrade, useDeleteGrade, useCreateAssessment, useDeleteAssessment } from '../../../hooks/useAdminData';

interface Props {
  onGoToAssessments?: () => void;
}

export default function GradesView({ onGoToAssessments }: Props) {
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: assessments = [], isLoading: assessmentsLoading } = useAssessments();
  
  const createGradeMutation = useCreateGrade();
  const deleteGradeMutation = useDeleteGrade();
  const createAssessmentMutation = useCreateAssessment();
  const deleteAssessmentMutation = useDeleteAssessment();

  const [showModal, setShowModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [expandedGrade, setExpandedGrade] = useState<number | null>(null);
  
  const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => 2026 + i);
  
  const [newGrade, setNewGrade] = useState({ 
    gradeName: 'Grade 1', 
    vacantSpots: 0, 
    assessmentDate: '', 
    academicYear: YEAR_OPTIONS[0] 
  });
  const [targetGradeId, setTargetGradeId] = useState<number | null>(null);
  const [editingAssessment, setEditingAssessment] = useState<any | null>(null);
  const [assessmentData, setAssessmentData] = useState({ title: '', maxMarks: 100 });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'grade' | 'assessment';
    id: number | null;
    title: string;
  }>({ isOpen: false, type: 'grade', id: null, title: '' });

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGradeMutation.mutate(newGrade, {
      onSuccess: () => {
        setShowModal(false);
        setNewGrade({ 
          gradeName: 'Grade 1', 
          vacantSpots: 0, 
          assessmentDate: '', 
          academicYear: YEAR_OPTIONS[0] 
        });
      }
    });
  };

  const handleAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentData.title) return;
    createAssessmentMutation.mutate({ ...assessmentData, gradeId: targetGradeId, id: editingAssessment?.id }, {
      onSuccess: () => {
        setShowAssessmentModal(false);
        setAssessmentData({ title: '', maxMarks: 100 });
        setEditingAssessment(null);
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.id) return;
    if (deleteModal.type === 'grade') {
      deleteGradeMutation.mutate(deleteModal.id, {
        onSuccess: () => setDeleteModal({ ...deleteModal, isOpen: false })
      });
    } else {
      deleteAssessmentMutation.mutate(deleteModal.id, {
        onSuccess: () => setDeleteModal({ ...deleteModal, isOpen: false })
      });
    }
  };

  const openAssessmentModal = (gradeId: number, assessment?: any) => {
    setTargetGradeId(gradeId);
    if (assessment) {
      setEditingAssessment(assessment);
      setAssessmentData({
        title: assessment.title,
        maxMarks: assessment.maxMarks
      });
    } else {
      setEditingAssessment(null);
      setAssessmentData({ title: '', maxMarks: 100 });
    }
    setShowAssessmentModal(true);
  };

  const isLoading = gradesLoading || assessmentsLoading;
  const isSubmitting = createGradeMutation.isPending || deleteGradeMutation.isPending || createAssessmentMutation.isPending || deleteAssessmentMutation.isPending;

  return (
    <div className="space-y-12 pb-20 relative">
      <AdminPageHeader 
        title="Grade Management" 
        description="Configure enrollment targets and assessment structures." 
        icon={GraduationCap}
      >
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-8 py-4 bg-primary text-secondary rounded-[20px] font-black uppercase tracking-widest text-xs hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-primary/20"
        >
          <Plus size={18} />
          New Grade
        </button>
      </AdminPageHeader>

      <div className="grid grid-cols-1 gap-8 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[2px] rounded-[48px]">
             <Loader2 size={48} className="animate-spin text-primary/20" />
          </div>
        )}
        {grades.map((grade: any) => {
          const isExpanded = expandedGrade === grade.id;
          const gradeAssessments = assessments.filter((a: any) => a.gradeId === grade.id);
          
          return (
            <motion.div 
              key={grade.id} 
              layout
              className={`bg-white rounded-[48px] shadow-2xl shadow-primary/5 border transition-all overflow-hidden group mb-4 ${isExpanded ? 'border-primary/20 ring-1 ring-primary/10' : 'border-outline-variant/10 hover:border-primary/10'}`}
            >
               <div 
                 onClick={() => setExpandedGrade(isExpanded ? null : grade.id)}
                 className="p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 relative cursor-pointer"
               >
                  {/* Left Indicator Decor */}
                  <div className={`absolute left-0 top-0 bottom-0 w-2 transition-all duration-500 ${isExpanded ? 'bg-secondary' : 'bg-primary/10 group-hover:bg-primary/30'}`} />

                  <div className="flex items-center gap-10">
                     <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-primary text-secondary' : 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-secondary'}`}>
                        <GraduationCap size={36} className="relative z-10 transition-transform group-hover:scale-110" />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-3xl font-black text-primary italic tracking-tight">{grade.gradeName}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${grade.vacantSpots > 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {grade.vacantSpots > 0 ? 'Accepting' : 'Waitlist Only'}
                          </span>
                        </div>
                         <div className="flex items-center gap-5 text-[9px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">
                            <span className="flex items-center gap-1.5 text-primary/60"><Calendar size={10} className="text-secondary" /> {grade.academicYear} Cycle</span>
                            <span className="w-1 h-1 rounded-full bg-outline-variant/30" />
                            <span className="flex items-center gap-1.5 text-secondary"><Users size={10} /> {grade.vacantSpots} Vacancies</span>
                            <span className="w-1 h-1 rounded-full bg-outline-variant/30" />
                            <span className="flex items-center gap-1.5"><ListChecks size={10} className="text-secondary" /> {gradeAssessments.length} Evaluations</span>
                         </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 relative z-10">
                     <button 
                       onClick={(e) => { e.stopPropagation(); onGoToAssessments && onGoToAssessments(); }}
                       className="px-6 py-3.5 bg-primary/5 text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-secondary hover:text-primary transition-all shadow-sm"
                     >
                        Results
                     </button>
                     
                     <div className="h-10 w-px bg-outline-variant/10 mx-2" />

                     <button 
                       onClick={(e) => { e.stopPropagation(); openAssessmentModal(grade.id); }}
                       className="w-12 h-12 flex items-center justify-center rounded-2xl bg-secondary/10 text-primary hover:bg-secondary transition-all shadow-sm"
                       title="Add Assessment"
                     >
                        <PlusCircle size={20} />
                     </button>

                     <button 
                       onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'grade', id: grade.id, title: grade.gradeName }); }}
                       className="w-12 h-12 flex items-center justify-center rounded-2xl text-red-200 hover:text-white hover:bg-red-500 transition-all opacity-40 hover:opacity-100"
                     >
                        <Trash2 size={20} />
                     </button>
                  </div>
               </div>

               <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      onClick={(e) => e.stopPropagation()}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-outline-variant/5 bg-primary/[0.01] cursor-default"
                    >
                       <div className="p-8 md:p-10">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left: Vacancy Settings */}
                            <div className="space-y-6">
                               <div className="bg-white p-6 md:p-8 rounded-[32px] border border-outline-variant/10 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.03)] focus-within:border-primary/20 transition-all">
                                  <div className="flex items-center gap-4 mb-6">
                                    <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                      <Users size={16} />
                                    </div>
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Logistics Configuration</h5>
                                  </div>
                                  
                                  <div className="space-y-4">
                                      <div className="group/field">
                                         <label className="block text-[9px] font-black text-primary/40 uppercase tracking-widest mb-3 ml-1 group-focus-within/field:text-secondary transition-colors">Vacant Enrollment Spots</label>
                                         <div className="relative">
                                           <input 
                                             type="number"
                                             value={grade.vacantSpots}
                                             onChange={(e) => createGradeMutation.mutate({ id: grade.id, vacantSpots: parseInt(e.target.value) || 0, assessmentDate: grade.assessmentDate, academicYear: grade.academicYear })}
                                             className="w-full bg-primary/[0.03] border border-outline-variant/5 rounded-xl p-3 text-lg font-black text-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                           />
                                           <Users className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/10" size={24} />
                                         </div>
                                      </div>
                                      <div className="group/field">
                                         <label className="block text-[9px] font-black text-primary/40 uppercase tracking-widest mb-3 ml-1 group-focus-within/field:text-secondary transition-colors">Institutional Assessment Date</label>
                                         <div className="relative">
                                           <input 
                                             type="date"
                                             value={grade.assessmentDate ? new Date(grade.assessmentDate).toISOString().split('T')[0] : ''}
                                             onChange={(e) => createGradeMutation.mutate({ id: grade.id, vacantSpots: grade.vacantSpots, assessmentDate: e.target.value, academicYear: grade.academicYear })}
                                             className="w-full bg-primary/[0.03] border border-outline-variant/5 rounded-xl p-3 text-sm font-black text-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                           />
                                           <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/10" size={24} />
                                         </div>
                                      </div>
                                      <div className="group/field">
                                         <label className="block text-[9px] font-black text-primary/40 uppercase tracking-widest mb-3 ml-1 group-focus-within/field:text-secondary transition-colors">Academic Offering Year</label>
                                         <div className="relative">
                                           <select 
                                             value={grade.academicYear}
                                             onChange={(e) => createGradeMutation.mutate({ id: grade.id, vacantSpots: grade.vacantSpots, assessmentDate: grade.assessmentDate, academicYear: parseInt(e.target.value) })}
                                             className="w-full bg-primary/[0.03] border border-outline-variant/5 rounded-xl p-3 text-sm font-black text-primary hover:bg-primary/5 transition-all appearance-none cursor-pointer"
                                           >
                                             {YEAR_OPTIONS.map(y => (
                                               <option key={y} value={y}>Cycle Year {y}</option>
                                             ))}
                                           </select>
                                           <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/10" size={20} />
                                         </div>
                                      </div>
                                  </div>
                               </div>
                            </div>

                            {/* Right: Assessment Management */}
                            <div className="space-y-6">
                               <div className="bg-white p-6 md:p-8 rounded-[32px] border border-outline-variant/10 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.03)] focus-within:border-secondary/10 transition-all">
                                  <div className="flex items-center gap-4 mb-6">
                                    <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                      <ListChecks size={16} />
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Evaluation Matrix</h5>
                                      <p className="text-[8px] font-bold text-primary/30 uppercase tracking-widest mt-1">Synced with teacher dashboards</p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-3">
                                     {gradeAssessments.map((ass: any) => (
                                       <div key={ass.id} className="flex items-center justify-between p-5 bg-primary/[0.02] rounded-3xl border border-outline-variant/5 hover:border-secondary/30 transition-all group/item">
                                          <div className="flex items-center gap-4">
                                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm group-hover/item:text-secondary transition-all">
                                                <ListChecks size={18} />
                                             </div>
                                             <div>
                                               <div className="text-sm font-black text-primary tracking-tight">{ass.title}</div>
                                               <div className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{ass.maxMarks} marks capacity</div>
                                             </div>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                                             <button 
                                                onClick={() => openAssessmentModal(grade.id, ass)}
                                                className="p-2.5 text-primary/30 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                title="Edit Evaluation"
                                             >
                                                <Pencil size={14} />
                                             </button>
                                             <button 
                                                onClick={() => setDeleteModal({ isOpen: true, type: 'assessment', id: ass.id, title: ass.title })}
                                                className="p-2.5 text-red-100 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Evaluation"
                                             >
                                                <X size={16} />
                                             </button>
                                          </div>
                                       </div>
                                     ))}
                                     {gradeAssessments.length === 0 && (
                                       <div className="py-12 px-6 border-2 border-dashed border-outline-variant/10 rounded-[32px] text-center bg-primary/[0.01]">
                                           <p className="text-[10px] text-on-surface-variant/30 font-black uppercase tracking-widest leading-loose">No dynamic evaluations<br/>configured for this level</p>
                                       </div>
                                     )}
                                  </div>
                               </div>
                            </div>
                          </div>
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Grade Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSubmitting && setShowModal(false)} className="absolute inset-0 bg-primary/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-lg rounded-[48px] p-12 shadow-[0_40px_80px_rgba(0,0,0,0.15)] relative z-10 border border-outline-variant/10">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-black text-primary italic tracking-tight">Grade Design</h3>
                  <button onClick={() => !isSubmitting && setShowModal(false)} className="p-2 hover:bg-primary/5 rounded-full transition-colors"><X size={24} className="text-primary/20" /></button>
               </div>
               
               <form onSubmit={handleGradeSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 ml-1">Grade Designation</label>
                    <select 
                      required
                      value={newGrade.gradeName}
                      disabled={isSubmitting}
                      onChange={e => setNewGrade({...newGrade, gradeName: e.target.value})}
                      className="w-full bg-surface-container-low p-5 rounded-3xl border-none font-black text-primary appearance-none focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {Array.from({ length: 10 }, (_, i) => `Grade ${i + 1}`).map(label => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 ml-1">Academic Year</label>
                      <select 
                        disabled={isSubmitting}
                        value={newGrade.academicYear}
                        onChange={e => setNewGrade({...newGrade, academicYear: parseInt(e.target.value)})}
                        className="w-full bg-surface-container-low p-5 rounded-3xl border-none font-black text-primary appearance-none focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {YEAR_OPTIONS.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 ml-1">Vacant Spots</label>
                      <input 
                        type="number" min="0" disabled={isSubmitting}
                        value={newGrade.vacantSpots}
                        onChange={e => setNewGrade({...newGrade, vacantSpots: parseInt(e.target.value) || 0})}
                        className="w-full bg-surface-container-low p-5 rounded-3xl border-none font-black text-primary focus:ring-4 focus:ring-primary/5 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 ml-1">Global Assessment Date</label>
                    <input 
                      type="date" required disabled={isSubmitting}
                      value={newGrade.assessmentDate}
                      onChange={e => setNewGrade({...newGrade, assessmentDate: e.target.value})}
                      className="w-full bg-surface-container-low p-5 rounded-3xl border-none font-black text-primary focus:ring-4 focus:ring-primary/5 transition-all disabled:opacity-50"
                    />
                  </div>

                  <button type="submit" disabled={isSubmitting} className={`w-full py-6 bg-primary text-secondary rounded-[24px] font-black uppercase tracking-widest text-[12px] transition-all shadow-xl shadow-primary/20 mt-6 relative overflow-hidden group ${isSubmitting ? 'cursor-not-allowed' : 'hover:scale-[1.03] active:scale-[0.98]'}`}>
                    {isSubmitting ? (<div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Processing...</div>) : 'Commit Designation'}
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assessment Creation/Edit Modal */}
      <AnimatePresence>
        {showAssessmentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSubmitting && setShowAssessmentModal(false)} className="absolute inset-0 bg-primary/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-lg rounded-[48px] p-12 shadow-[0_40px_80px_rgba(0,0,0,0.15)] relative z-10 border border-outline-variant/10">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-black text-primary italic tracking-tight">{editingAssessment ? 'Refine Element' : 'Add Test Level'}</h3>
                  <button onClick={() => !isSubmitting && setShowAssessmentModal(false)} className="p-2 hover:bg-primary/5 rounded-full transition-colors"><X size={24} className="text-primary/20" /></button>
               </div>
               
               <form onSubmit={handleAssessmentSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 ml-1">Test Title</label>
                    <input 
                      required placeholder="e.g. English"
                      value={assessmentData.title}
                      disabled={isSubmitting}
                      onChange={e => setAssessmentData({...assessmentData, title: e.target.value})}
                      className="w-full bg-surface-container-low p-5 rounded-3xl border-none font-black text-primary focus:ring-4 focus:ring-primary/5 transition-all disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 ml-1">Total Marks</label>
                      <input 
                        type="number" min="1" disabled={isSubmitting}
                        value={assessmentData.maxMarks}
                        onChange={e => setAssessmentData({...assessmentData, maxMarks: parseInt(e.target.value) || 0})}
                        className="w-full bg-surface-container-low p-5 rounded-3xl border-none font-black text-primary focus:ring-4 focus:ring-primary/5 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmitting} className={`w-full py-6 bg-primary text-secondary rounded-[24px] font-black uppercase tracking-widest text-[12px] transition-all shadow-xl shadow-primary/20 mt-6 relative overflow-hidden group ${isSubmitting ? 'cursor-not-allowed' : 'hover:scale-[1.03] active:scale-[0.98]'}`}>
                    {isSubmitting ? (<div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Processing...</div>) : (editingAssessment ? 'Update Curricula' : 'Create Test')}
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSubmitting && setDeleteModal({...deleteModal, isOpen: false})} className="absolute inset-0 bg-primary/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-[0_40px_80px_rgba(0,0,0,0.15)] relative z-10 border border-outline-variant/10 text-center">
               <div className="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center text-red-500 mx-auto mb-8 animate-pulse">
                  <AlertTriangle size={40} />
               </div>
               
               <h3 className="text-2xl font-black text-primary italic mb-4">Confirm Deletion</h3>
               <p className="text-sm font-medium text-on-surface-variant opacity-60 leading-relaxed mb-10">
                  Are you sure you want to delete <span className="text-primary font-black underline decoration-red-500/30 underline-offset-4">{deleteModal.title}</span>? This action is irreversible.
               </p>
               
               <div className="flex gap-4">
                  <button 
                    onClick={() => setDeleteModal({...deleteModal, isOpen: false})}
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-primary/5 text-primary rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmDelete}
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                  >
                    {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

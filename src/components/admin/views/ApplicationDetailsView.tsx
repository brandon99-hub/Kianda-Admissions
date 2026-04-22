import React, { useState } from 'react';
import { ArrowLeft, User, MapPin, Phone, Mail, Hash, BookOpen, Clock, HeartPulse, GraduationCap, Download, FileText, CheckCircle, Users, X, Loader2 } from 'lucide-react';
import { authFetch } from '../../../utils/auth';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { buildApplicationPDF } from '../../../utils/buildApplicationPDF';

interface Props {
  app: any;
  onBack: () => void;
  onUpdate?: () => void;
  showResults?: boolean;
}

export default function ApplicationDetailsView({ app, onBack, onUpdate, showResults }: Props) {
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentAppStatus, setCurrentAppStatus] = useState(app.status);

  const candidate = app.candidate || {};
  const parent = app.parentDetails || {};
  const documents = app.documents || [];
  const additional = app.additionalInfo || {};
  const schools = app.schoolsAttended || [];
  const siblings = app.siblings || [];
  // Handle both possible relation names (assessmentResults from server, results as common alias)
  const results = app.assessmentResults || app.results || [];
  
  const formattedDob = candidate.dob ? new Date(candidate.dob).toLocaleDateString('en-GB') : 'N/A';

  const handleUpdateStatus = async (status: string, reason?: string) => {
    setIsProcessing(true);
    const toastId = toast.loading(`Updating status to ${status.replace('_', ' ')}...`);
    try {
      const res = await authFetch('/api/admin/applications/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: app.id, status, reason })
      });
      if (!res.ok) throw new Error('Failed to update');
      
      setCurrentAppStatus(status);
      toast.success(status === 'rejected' ? 'Application formally rejected.' : 'Application accepted & emails sent!', { id: toastId });
      setIsRejectModalOpen(false);
      setRejectReason('');
      if (onUpdate) onUpdate();
    } catch(e) {
      toast.error('Network Error. Could not update.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Generating official report...');
    try {
      const doc = await buildApplicationPDF(app);
      doc.save(`Kianda_Report_${app.id}_${(candidate.fullName || 'Candidate').replace(/\s+/g, '_')}.pdf`);
      toast.success('Report downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to export report. Please try again.', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >

      <div className="bg-surface-container-lowest p-1 rounded-[32px]">

        {/* Header Banner - Candidate Profile */}
        <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_40px_-20px_rgba(24,33,109,0.1)] border border-outline-variant/10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
           <button 
             onClick={onBack}
             className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-surface-container-low rounded-2xl border border-outline-variant/10 hover:bg-primary/5 hover:text-primary transition-all group shadow-sm"
           >
             <ArrowLeft className="text-primary/60 group-hover:-translate-x-1 transition-transform" />
           </button>
           <div>
             <div className="flex items-center gap-4 mb-3">
               <h2 className="text-3xl font-extrabold text-primary font-headline tracking-tight">Application Details</h2>
               <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${
                  currentAppStatus === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' :
                  ['passed_assessment', 'interview_scheduled'].includes(currentAppStatus) ? 'bg-green-50 text-green-600 border-green-100' :
                  currentAppStatus === 'waitlisted' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  currentAppStatus === 'assessment_scheduled' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  currentAppStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                  currentAppStatus === 'pending' ? 'bg-secondary/10 text-primary border-secondary/20' :
                  'bg-primary/5 text-primary border-primary/10'
               }`}>
                 {['passed_assessment', 'interview_scheduled'].includes(currentAppStatus) ? 'Passed' : currentAppStatus.replace('_', ' ')}
               </span>
             </div>
             <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-on-surface-variant/70">
                <span className="font-mono text-[10px] uppercase font-black tracking-widest text-primary/40 bg-primary/5 px-3 py-1 rounded border border-primary/5">Application ID: APP-{app.id.toString().padStart(4, '0')}</span>
             </div>
           </div>
        </div>

        {/* Transaction Focus area right aligned in header */}
        <div className="md:border-l border-outline-variant/10 md:pl-8 relative z-10 w-full md:w-auto">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-40 text-primary flex items-center gap-2">
               <Hash size={12} /> Transaction Code
            </h3>
            <div className="text-2xl font-mono font-black tracking-widest text-primary flex items-center gap-3">
              {app.mpesaCode || 'PENDING'} 
              <CheckCircle size={20} className="text-green-500" />
            </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={handleExportPDF}
             disabled={isExporting}
             className="px-6 py-3.5 bg-primary text-secondary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 disabled:hover:scale-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
           >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
              {isExporting ? 'Exporting...' : 'Export PDF'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         
         {/* Left & Center Column (Main details) */}
         <div className="xl:col-span-2 space-y-6">
            
            {/* Candidate Information Module */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-outline-variant/10">
               <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/50 mb-8 border-b border-primary/5 pb-4 flex items-center gap-3 w-fit pr-12">
                 <User size={14} className="text-secondary" /> Candidate Information
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                 {/* Left Column: Personal Info */}
                 <div className="space-y-4 relative">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary/50 rounded-full" />
                   <div className="pl-4">
                     <h4 className="text-sm font-bold text-primary mb-5 opacity-80 uppercase tracking-widest">Personal Details</h4>
                     <div className="space-y-5">
                       <DetailItem inline label="Full Name" value={candidate.fullName} />
                       <DetailItem inline label="Applying Grade" value={candidate.grade} />
                       <DetailItem inline label="Date of Birth" value={formattedDob} />
                       <DetailItem inline label="Gender" value={candidate.gender} />
                       <DetailItem inline label="Birth Order" value={candidate.birthOrder} />
                       <DetailItem inline label="Religion" value={`${candidate.religion || ''} ${candidate.denomination ? `(${candidate.denomination})` : ''}`} />
                     </div>
                   </div>
                 </div>

                 {/* Right Column: Educational History */}
                 <div className="space-y-4 relative">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/30 rounded-full" />
                   <div className="pl-4">
                     <h4 className="text-sm font-bold text-primary mb-5 opacity-80 uppercase tracking-widest">Educational History</h4>
                     <div className="space-y-5">
                       
                       <div className="border-b border-outline-variant/5 pb-4">
                         <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/40 flex items-center gap-2 mb-3">
                           <GraduationCap size={14} /> Schools Attended
                         </div>
                         <div className="space-y-3">
                           {schools.length > 0 ? schools.map((s: any, i: number) => (
                             <div key={i} className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                               <div className="flex justify-between items-start mb-1.5">
                                 <span className="text-xs font-bold text-primary">{s.schoolName}</span>
                                 <span className="text-[8px] font-black uppercase tracking-widest text-primary/40 bg-white px-1.5 py-0.5 rounded shadow-sm">{s.schoolType}</span>
                               </div>
                               <div className="text-[10px] font-semibold text-secondary flex items-center gap-1.5"><Clock size={10}/> {s.yearsRange || 'Dates not specified'}</div>
                             </div>
                           )) : <div className="text-xs italic opacity-50 px-2">None registered</div>}
                         </div>
                       </div>

                       <div>
                         <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/40 flex items-center gap-2 mb-3">
                           <Users size={14} /> Siblings at Kianda
                         </div>
                         <div className="space-y-3">
                           {siblings.length > 0 ? siblings.map((s: any, i: number) => (
                             <div key={i} className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                               <div className="flex justify-between items-start mb-1.5">
                                 <span className="text-xs font-bold text-primary">{s.name}</span>
                                 <span className="text-[10px] font-bold text-secondary bg-white px-1.5 py-0.5 rounded shadow-sm">{s.grade}</span>
                               </div>
                               <div className="text-[9px] font-black uppercase tracking-widest text-primary/50">Relationship: <span className="text-primary">{s.relationship || 'Unspecified'}</span></div>
                             </div>
                           )) : <div className="text-xs italic opacity-50 px-2">None registered</div>}
                         </div>
                       </div>

                     </div>
                   </div>
                 </div>
               </div>
            </div>

            {/* Parent Details Module */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-outline-variant/10">
               <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/50 mb-8 border-b border-primary/5 pb-4 flex items-center gap-3 w-fit pr-12">
                 <Users size={14} className="text-secondary" /> Parent & Guardian Information
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                 {/* Mother Block */}
                 <div className="space-y-4 relative">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary/50 rounded-full" />
                   <div className="pl-4">
                     <h4 className="text-sm font-bold text-primary mb-5 opacity-80 uppercase tracking-widest">Mother's Details</h4>
                     <div className="space-y-5">
                       <DetailItem inline label="Name" value={parent.motherName} />
                       <DetailItem inline icon={<Phone size={14}/>} label="Phone" value={parent.motherPhone} />
                       <DetailItem inline icon={<Mail size={14}/>} label="Email" value={parent.motherEmail} />
                       <DetailItem inline label="Profession" value={parent.motherProfession} />
                       <DetailItem inline label="Workplace" value={parent.motherWork} />
                     </div>
                   </div>
                 </div>

                 {/* Father Block */}
                 <div className="space-y-4 relative">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/30 rounded-full" />
                   <div className="pl-4">
                     <h4 className="text-sm font-bold text-primary mb-5 opacity-80 uppercase tracking-widest">Father's Details</h4>
                     <div className="space-y-5">
                       <DetailItem inline label="Name" value={parent.fatherName} />
                       <DetailItem inline icon={<Phone size={14}/>} label="Phone" value={parent.fatherPhone} />
                       <DetailItem inline icon={<Mail size={14}/>} label="Email" value={parent.fatherEmail} />
                       <DetailItem inline label="Profession" value={parent.fatherProfession} />
                       <DetailItem inline label="Workplace" value={parent.fatherWork} />
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            {/* Application & Medical Context */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-outline-variant/10">
               <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/50 mb-8 border-b border-primary/5 pb-4 flex items-center gap-3 w-fit pr-12">
                 <HeartPulse size={14} className="text-red-400" /> Additional Context
               </h3>

               <div className="space-y-8 pl-4">
                 {/* Full-width block for large narratives */}
                 <DetailItem fullBlock label="Medical Information" value={candidate.medicalInfo} fallback="No specific medical information provided." />
                 <DetailItem fullBlock label="Motivation to join Kianda" value={additional.motivation} fallback="No motivation narrative provided." />
                 
                 {/* Smaller context flags */}
                 <div className="grid grid-cols-1 gap-8 pt-4 border-t border-primary/5">
                   <div className="space-y-5">
                      <DetailItem inline label="Source" value={additional.source} />
                      <DetailItem inline label="Applied Before?" value={additional.hasAppliedBefore ? `Yes, in ${additional.previousApplicationYear}` : 'No'} />
                   </div>
                 </div>
               </div>
            </div>

            {/* Rejection / Administrative Record */}
            {app.rejectionRemarks && (
              <div className="bg-red-50/30 rounded-[32px] p-8 shadow-sm border border-red-100/50 animate-in fade-in slide-in-from-top-4 duration-500">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500 mb-6 border-b border-red-500/10 pb-4 flex items-center gap-3 w-fit pr-12">
                   <X size={14} strokeWidth={3} /> Rejection Remarks
                 </h3>
                 <div className="pl-4">
                    <div className="text-[13px] leading-relaxed font-bold text-primary italic bg-white/50 p-6 rounded-2xl border border-red-100 shadow-inner">
                      "{app.rejectionRemarks}"
                    </div>
                    {app.rejectionDate && (
                      <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary/30 flex items-center gap-2">
                        <Clock size={12} /> Recorded on {new Date(app.rejectionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                 </div>
              </div>
            )}

         </div>

         {/* Right Column (Actions & Documents) */}
         <div className="space-y-6">
            
            {/* Quick Actions at Top */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-outline-variant/10">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 mb-6">Administrative Actions</h3>
               <div className="space-y-3">
                 {/* Accepted State */}
                 {currentAppStatus === 'accepted' ? (
                   <>
                     <div className="w-full py-4 bg-green-50 text-green-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-green-100">
                       <CheckCircle size={14} /> Accepted Student
                     </div>
                     <button 
                        onClick={() => setIsRejectModalOpen(true)}
                        disabled={isProcessing}
                        className="w-full py-4 text-xs font-bold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                       <X size={14} /> Revoke & Reject
                     </button>
                   </>
                 ) : currentAppStatus === 'rejected' ? (
                   <>
                     <div className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-red-100">
                       <X size={14} strokeWidth={3} /> Rejected Candidate
                     </div>
                     <button 
                        onClick={() => handleUpdateStatus('assessment_scheduled')} 
                        disabled={isProcessing}
                        className="w-full py-4 text-xs font-bold bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2 border border-green-100/50"
                      >
                       <CheckCircle size={14} /> Grant Admission
                     </button>
                   </>
                 ) : (
                   <>
                     <button 
                        onClick={() => handleUpdateStatus('assessment_scheduled')} 
                        disabled={isProcessing}
                        className="w-full py-4 text-xs font-bold bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2 border border-green-100/50"
                      >
                       <CheckCircle size={14} /> Accept Application
                     </button>
                     <button 
                        onClick={() => setIsRejectModalOpen(true)}
                        disabled={isProcessing}
                        className="w-full py-4 text-xs font-bold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                       <X size={14} /> Reject Application
                     </button>
                   </>
                 )}
               </div>
            </div>

            {/* Documents Module shifted below Actions */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_15px_30px_-10px_rgba(24,33,109,0.05)] border border-primary/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none" />
               <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-6 flex items-center gap-2 relative z-10">
                 <FileText size={14} className="text-secondary" /> Uploaded Documents
               </h3>
               
               <div className="space-y-3 relative z-10">
                 {documents.length > 0 ? documents.map((doc: any, i: number) => (
                   <a 
                     key={i} 
                     href={doc.fileUrl || '#'} 
                     download 
                     target="_blank"
                     rel="noreferrer"
                     className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all group"
                   >
                     <div className="flex items-center gap-3 truncate">
                       <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-primary shadow-sm">
                         <FileText size={14} />
                       </div>
                       <span className="text-xs font-bold text-primary truncate">{doc.documentType || 'Uploaded File'}</span>
                     </div>
                     <Download size={16} className="text-secondary opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 transition-all" />
                   </a>
                 )) : (
                   <p className="text-xs font-medium italic text-on-surface-variant/50 p-4 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/20">No documents found.</p>
                 )}
               </div>
            </div>

             {/* Assessment Results Card - Optional */}
             {showResults && (
               <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_40px_-20px_rgba(24,33,109,0.1)] border border-outline-variant/10 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-secondary/10 transition-colors" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 opacity-40 text-primary flex items-center gap-2 relative z-10">
                    <CheckCircle size={12} className="text-secondary" /> Assessment Scores
                  </h3>

                  <div className="space-y-3 relative z-10">
                    {results.length > 0 ? (
                      results.map((res: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/5 hover:border-primary/10 transition-all">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-outline-variant/10 flex items-center justify-center text-primary/60">
                                 <GraduationCap size={16} />
                              </div>
                              <div>
                                 <div className="text-[10px] font-black text-primary uppercase tracking-wider">{res.assessment?.title || 'Unknown Assessment'}</div>
                                 <div className="text-[8px] font-bold text-on-surface-variant/60">Marks Awarded</div>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-lg font-mono font-black text-secondary">{res.marksObtained} <span className="text-[10px] opacity-30 text-primary">/ {res.assessment?.maxMarks || 100}</span></div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/20">
                         <div className="text-[10px] font-bold text-on-surface-variant/40 italic">No assessment scores found</div>
                      </div>
                    )}
                  </div>
               </div>
             )}

         </div>
      </div>

      {/* Rejection Modal Overlay */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => !isProcessing && setIsRejectModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white max-w-lg w-full rounded-[32px] p-8 relative z-10 shadow-2xl border border-outline-variant/10">
              <button disabled={isProcessing} onClick={() => setIsRejectModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-primary/5 text-primary/40 hover:text-primary transition-colors disabled:opacity-50">
                <X size={20} />
              </button>
              
              <div className="mb-6 pr-8">
                 <h3 className="text-2xl font-black text-primary font-headline mb-2">Reject Application</h3>
                 <p className="text-sm font-medium text-on-surface-variant/70 leading-relaxed">Please provide a clear reason for rejecting <span className="font-bold text-primary">{candidate.fullName}</span>. This reason will be automatically included in the regret email dispatched to the parents.</p>
              </div>

              <textarea 
                 value={rejectReason}
                 onChange={e => setRejectReason(e.target.value)}
                 disabled={isProcessing}
                 placeholder="e.g., The candidate did not meet the required cutoff marks for the entrance examination..."
                 className="w-full h-32 p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium text-primary text-sm mb-6"
              ></textarea>

              <div className="flex gap-4">
                 <button disabled={isProcessing} onClick={() => setIsRejectModalOpen(false)} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-primary/60 hover:bg-primary/5 rounded-xl disabled:opacity-50 transition-colors">Cancel</button>
                 <button 
                  disabled={!rejectReason.trim() || isProcessing} 
                  onClick={() => handleUpdateStatus('rejected', rejectReason)} 
                  className="flex-[2] py-4 bg-red-500 text-white shadow-lg shadow-red-500/20 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2"
                 >
                   {isProcessing ? <><Loader2 size={14} className="animate-spin" /> Processing</> : 'Confirm & Send Email'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </div>
    </motion.div>
  );
}


function DetailItem({ label, value, icon, inline=false, fullBlock=false, fallback='Not provided' }: { label: string, value: any, icon?: React.ReactNode, inline?: boolean, fullBlock?: boolean, fallback?: string }) {
  if (fullBlock) {
    return (
      <div className="mb-6 last:mb-0">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/40 mb-2 flex items-center gap-1.5">
          {icon} {label}
        </div>
        <div className={`text-[13px] leading-relaxed font-bold text-primary bg-primary/5 p-4 rounded-xl border border-primary/5 whitespace-pre-wrap ${!value ? 'opacity-50 italic text-center' : ''}`}>
          {value || fallback}
        </div>
      </div>
    );
  }

  if (inline) {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-outline-variant/5 pb-2">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/40 flex items-center gap-2 shrink-0">
          {icon} {label}
        </div>
        <div className={`text-sm font-bold text-primary text-right break-words ${!value ? 'opacity-40 italic' : ''}`}>
          {value || fallback}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/40 mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className={`text-[15px] font-bold text-primary ${!value ? 'opacity-40 italic' : ''}`}>
        {value || fallback}
      </div>
    </div>
  );
}

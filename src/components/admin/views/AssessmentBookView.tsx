import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Upload, CheckCircle2, XCircle, AlertCircle, ChevronDown, Table as TableIcon, Mail, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { getRejectionEmail, getAssessmentPassEmail } from '../../../utils/emailTemplates';
import AdminPageHeader from '../AdminPageHeader';
import { useGrades, useAssessments, useApplications, useResults, useBulkSync } from '../../../hooks/useAdminData';

export default function AssessmentBookView() {
  const { data: grades = [] } = useGrades();
  const { data: assessments = [] } = useAssessments();
  const { data: applications = [] } = useApplications();
  const { data: results = [] } = useResults();
  const bulkSyncMutation = useBulkSync();

  const [activeGradeId, setActiveGradeId] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ qualified: number, rejected: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default to first grade when data arrives
  React.useEffect(() => {
    if (grades.length > 0 && !activeGradeId) {
      setActiveGradeId(grades[0].id);
    }
  }, [grades, activeGradeId]);

  const activeGrade = grades.find((g: any) => g.id === activeGradeId);
  const gradeAssessments = assessments.filter((a: any) => a.gradeId === activeGradeId);
  const gradeApps = applications.filter((app: any) => app.candidate?.grade === activeGrade?.gradeName);

  const handleExport = () => {
    if (!activeGrade) return;
    
    // Header Generation
    const headers = ['No.', 'Candidate Name', ...gradeAssessments.map(a => `${a.title} (Max: ${a.maxMarks})`), 'Qualified (Y/N)'];
    
    // Data Generation
    const rows = gradeApps.map(app => {
      const appResults = gradeAssessments.map(ass => {
        const res = results.find((r: any) => r.applicationId === app.id && r.assessmentId === ass.id);
        return res?.marksObtained ?? '';
      });
      const isQualified = gradeAssessments.every(ass => {
         const res = results.find((r: any) => r.applicationId === app.id && r.assessmentId === ass.id);
         return res?.passed;
      }) && gradeAssessments.length > 0;
      
      return [app.id, app.candidate?.fullName, ...appResults, isQualified ? 'Y' : 'N'];
    });

    const worksheetData = [headers, ...rows];
    
    // XLSX Generation
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Auto-size columns to be actually readable
    const wscols = [
        { wch: 10 }, // No.
        { wch: 30 }, // Name
        ...gradeAssessments.map(() => ({ wch: 25 })), // Assessments
        { wch: 15 }  // Qualified
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Mark Sheet");
    XLSX.writeFile(wb, `${activeGrade.gradeName}_Mark_Sheet.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[];
        
        const dataRows = rows.slice(1);

        const syncResults: any[] = [];
        let qualCount = 0;
        let rejCount = 0;
        let hasMaxMarkViolation = false;

        dataRows.forEach(row => {
          if (!row || row.length === 0) return;
          const appId = parseInt(row[0]);
          if (isNaN(appId)) return;

          const isQualified = String(row[row.length - 1]).trim().toUpperCase() === 'Y';
          if (isQualified) qualCount++; else rejCount++;

          gradeAssessments.forEach((ass, idx) => {
            const rawMarks = row[idx + 2];
            const marks = parseInt(rawMarks);
            const finalMarks = isNaN(marks) ? 0 : marks;

            if (finalMarks > ass.maxMarks) {
              hasMaxMarkViolation = true;
            }

            syncResults.push({
              applicationId: appId,
              assessmentId: ass.id,
              marksObtained: finalMarks,
              passed: isQualified
            });
          });
        });

        if (hasMaxMarkViolation) {
          toast.error("Validation Error: Imported marks mathematically exceed the assessment's maximum configuration limit.", { duration: 6000 });
          if(fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        setSyncStatus({ qualified: qualCount, rejected: rejCount });
        (window as any).pendingSync = syncResults;
      } catch (err) {
        toast.error("Failed to parse the Excel file. Please ensure it wasn't corrupted.", { duration: 4000 });
      }
      if(fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const commitSync = async () => {
    const pending = (window as any).pendingSync;
    if (!pending) return;

    bulkSyncMutation.mutate(pending, {
      onSuccess: async () => {
        // Handle Automated Emails in the background/sequential
        // Note: Ideally the backend should handle bulk email, but we keep the current pattern for UI logic
        
        const rejectedApps = gradeApps.filter(app => {
          const syncRes = pending.find((p: any) => p.applicationId === app.id);
          return syncRes && !syncRes.passed && app.status !== 'rejected' && app.status !== 'failed';
        });

        for (const app of rejectedApps) {
          const emailData = getRejectionEmail(app.candidate?.fullName, "The candidate did not achieve the required benchmark scores during the assessment examination.");
          await fetch('/api/admin/send-status-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: app.parentDetails?.fatherEmail || app.parentDetails?.motherEmail,
              candidateName: app.candidate?.fullName,
              subject: emailData.subject,
              content: emailData.body
            })
          });
        }

        const passedApps = gradeApps.filter(app => {
          const syncRes = pending.find((p: any) => p.applicationId === app.id);
          return syncRes && syncRes.passed && app.status !== 'passed_assessment';
        });

        for (const app of passedApps) {
          const emailData = getAssessmentPassEmail(app.candidate?.fullName);
          await fetch('/api/admin/send-status-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: app.parentDetails?.fatherEmail || app.parentDetails?.motherEmail,
              candidateName: app.candidate?.fullName,
              subject: emailData.subject,
              content: emailData.body
            })
          });
        }
        
        setSyncStatus(null);
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <AdminPageHeader 
        title="Assessment Book" 
        description="Track scores and sync teacher results across cohorts." 
        icon={TableIcon}
      >
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative group">
            <select 
              value={activeGradeId || ''}
              onChange={(e) => setActiveGradeId(parseInt(e.target.value))}
              className="appearance-none bg-white px-6 py-3 rounded-xl font-bold text-primary min-w-[200px] border border-outline-variant/10 focus:ring-4 focus:ring-primary/5 cursor-pointer transition-all pr-12 shadow-sm text-xs"
            >
              {grades.map((g: any) => <option key={g.id} value={g.id}>{g.gradeName}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none group-hover:text-primary transition-colors" size={14} />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-secondary/10 text-primary rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-secondary hover:text-white transition-all shadow-sm"
            >
              <Download size={14} /> Export XLSX
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx,.xls" 
              onChange={handleImport} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-secondary rounded-xl font-black uppercase tracking-widest text-[9px] hover:scale-105 transition-all shadow-lg shadow-primary/10"
            >
              <Upload size={14} /> Sync
            </button>
          </div>
        </div>
      </AdminPageHeader>

      {/* Master Table */}
      <div className="bg-white rounded-[40px] shadow-2xl shadow-primary/5 overflow-hidden border border-outline-variant/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/10">
                 <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Student Dossier</th>
                 {gradeAssessments.map(ass => (
                   <th key={ass.id} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 whitespace-nowrap">
                      {ass.title} <span className="opacity-30 ml-1">/{ass.maxMarks}</span>
                   </th>
                 ))}
                 <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">Final Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {gradeApps.map(app => {
                 const isPassed = gradeAssessments.every(ass => results.find((r: any) => r.applicationId === app.id && r.assessmentId === ass.id)?.passed);

                 return (
                   <tr key={app.id} className="hover:bg-primary/[0.02] transition-colors group">
                     <td className="px-8 py-6">
                        <div className="font-bold text-primary text-sm flex items-center gap-2">
                           {app.candidate?.fullName}
                           {app.status === 'rejected' && <Mail size={12} className="text-red-400" title="Rejection Sent" />}
                        </div>
                        <div className="text-[10px] font-medium text-on-surface-variant/40 uppercase tracking-widest">APP-{app.id.toString().padStart(4, '0')}</div>
                     </td>
                     {gradeAssessments.map(ass => {
                        const res = results.find((r: any) => r.applicationId === app.id && r.assessmentId === ass.id);
                        return (
                          <td key={ass.id} className="px-8 py-6">
                             <div className={`text-sm font-black ${res ? 'text-primary' : 'text-on-surface-variant/20'}`}>
                                {res?.marksObtained ?? '—'}
                             </div>
                          </td>
                        );
                     })}
                     <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          isPassed
                          ? 'bg-green-50 text-green-600 border-green-100' 
                          : 'bg-red-50 text-red-500 border-red-100'
                        }`}>
                           {isPassed ? <><CheckCircle2 size={12} /> Passed</> : 
                            <><XCircle size={12} /> Failed</>}
                        </div>
                     </td>
                   </tr>
                 );
              })}
              {gradeApps.length === 0 && (
                <tr>
                  <td colSpan={gradeAssessments.length + 2} className="px-8 py-24 text-center">
                     <div className="flex flex-col items-center gap-3 opacity-20">
                        <TableIcon size={48} />
                        <p className="font-bold text-primary italic">No active applications for this grade level.</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Verification Modal */}
      <AnimatePresence>
        {syncStatus && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative z-10 border border-outline-variant/10">
               <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-primary/5 rounded-[20px] flex items-center justify-center text-primary mx-auto mb-4">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-primary italic mb-1">Verify Data Sync</h3>
                  <p className="text-xs text-on-surface-variant font-medium opacity-60">Results from teacher sheet mapped successfully.</p>
               </div>

               <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100 text-center">
                     <div className="text-xl font-black text-green-600 mb-0.5">{syncStatus.qualified}</div>
                     <div className="text-[8px] font-black uppercase tracking-widest text-green-600/60">Pass / Qualify</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                     <div className="text-xl font-black text-red-400 mb-0.5">{syncStatus.rejected}</div>
                     <div className="text-[8px] font-black uppercase tracking-widest text-red-400/60">Fail / Reject</div>
                  </div>
               </div>

               <div className="p-3 bg-primary/5 rounded-xl mb-6 flex items-start gap-2.5">
                  <Mail size={14} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-[9px] font-bold text-primary leading-tight">
                    <span className="opacity-60 italic font-black uppercase block mb-0.5">Automation Active</span>
                    Confirming this sync will automatically dispatch results notification emails to all {syncStatus.qualified + syncStatus.rejected} candidates.
                  </p>
               </div>

               <div className="flex gap-3">
                  <button 
                    onClick={() => setSyncStatus(null)}
                    disabled={bulkSyncMutation.isPending}
                    className="flex-1 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest text-primary/40 hover:bg-primary/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={commitSync}
                    disabled={bulkSyncMutation.isPending}
                    className="flex-[2] py-3.5 bg-primary text-secondary rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden"
                  >
                    {bulkSyncMutation.isPending ? <><Loader2 size={14} className="animate-spin inline mr-2" /> Syncing...</> : 'Finalize & Send Emails'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

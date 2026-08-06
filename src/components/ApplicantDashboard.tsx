import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, LogOut, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, Edit3, Eye, RotateCcw, Save, ArrowLeft, GraduationCap, Download, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicantLogout } from '../utils/auth';
import CandidateInfoForm from './CandidateInfoForm';
import ParentInfoForm from './ParentInfoForm';
import AdditionalInfoForm from './AdditionalInfoForm';
import DocumentUploadForm from './DocumentUploadForm';
import Stepper from './Stepper';
import AuthenticatedImage from './admin/AuthenticatedImage';
import ApplicationPreview from './ApplicationPreview';
import { buildApplicationPDF } from '../utils/buildApplicationPDF';
import { ApplicationState, Step, CandidateInfo, ParentDetails, AdditionalInfo } from '../types';

interface Props {
  onLogout: () => void;
  onNewApplication: () => void;
}

type EditStep = 'candidate' | 'parent' | 'additional' | 'documents' | null;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  pending: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <Clock size={16} /> },
  assessment_scheduled: { label: 'Assessment Scheduled', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <AlertCircle size={16} /> },
  passed_assessment: { label: 'Passed Assessment', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: <CheckCircle size={16} /> },
  interview_scheduled: { label: 'Interview Scheduled', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: <AlertCircle size={16} /> },
  accepted: { label: 'Accepted', color: 'text-green-800', bg: 'bg-green-50 border-green-300', icon: <CheckCircle size={16} /> },
  rejected: { label: 'Unsuccessful', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: <XCircle size={16} /> },
  waitlisted: { label: 'Waitlisted', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: <Clock size={16} /> },
  failed: { label: 'Not Proceeding', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: <XCircle size={16} /> },
};

function mapAppToState(app: any): Partial<ApplicationState> {
  const c = app.candidate || {};
  const p = app.parentDetails || {};
  const a = app.additionalInfo || {};
  const docs = app.documents || [];

  return {
    candidate: {
      grade: c.grade || '',
      fullName: c.fullName || '',
      dob: c.dob || '',
      religion: c.religion || '',
      denomination: c.denomination || '',
      birthOrder: c.birthOrder || '',
      medicalInfo: c.medicalInfo || '',
      assessmentNo: c.assessmentNo || '',
      passportPhoto: c.passportPhotoUrl || '',
      schools: (app.schoolsAttended || []).map((s: any) => ({ type: s.schoolType, name: s.schoolName, years: s.yearsRange })),
    },
    parent: {
      fatherName: p.fatherName || '', fatherPhone: p.fatherPhone || '', fatherEmail: p.fatherEmail || '',
      fatherProfession: p.fatherProfession || '', fatherWork: p.fatherWork || '',
      fatherAltContactName: p.fatherAltContactName || '', fatherAltContactPhone: p.fatherAltContactPhone || '', fatherAltContactRelation: p.fatherAltContactRelation || '',
      motherName: p.motherName || '', motherPhone: p.motherPhone || '', motherEmail: p.motherEmail || '',
      motherProfession: p.motherProfession || '', motherWork: p.motherWork || '',
      motherAltContactName: p.motherAltContactName || '', motherAltContactPhone: p.motherAltContactPhone || '', motherAltContactRelation: p.motherAltContactRelation || '',
      residency: p.residency || '', fatherResidency: p.fatherResidency || '', motherResidency: p.motherResidency || '',
    },
    additional: {
      siblings: (app.siblings || []).map((s: any) => ({ name: s.name, grade: s.grade, relationship: s.relationship, schoolType: s.schoolType, schoolName: s.schoolName, kiandaOrder: s.kiandaOrder })),
      motivation: a.motivation || '',
      source: a.source || '',
      sourceOther: a.sourceOther || '',
      hasAppliedBefore: a.hasAppliedBefore || false,
      previousApplicationYears: a.previousApplicationYears || [],
    },
    documents: {
      letter: docs.find((d: any) => d.documentType === 'Application Letter')?.fileUrl || '',
      birthCert: docs.find((d: any) => d.documentType === "Candidate's Birth Certificate")?.fileUrl || '',
      report: docs.find((d: any) => d.documentType === 'Latest School Report')?.fileUrl || '',
    },
  };
}

export default function ApplicantDashboard({ onLogout, onNewApplication }: Props) {
  const queryClient = useQueryClient();
  const [editingAppId, setEditingAppId] = useState<number | null>(null);
  const [editStep, setEditStep] = useState<EditStep>(null);
  const [editState, setEditState] = useState<Partial<ApplicationState>>({});
  const [previewApp, setPreviewApp] = useState<any | null>(null);


  const { data: applications = [], isLoading, isError, error } = useQuery({
    queryKey: ['myApplications'],
    staleTime: 0, // Always fetch fresh data on mount
    queryFn: async () => {
      const res = await fetch(`/api/applicants/my-applications?t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (res.status === 401) {
        await applicantLogout();
        onLogout();
        throw new Error('Session expired');
      }
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to fetch applications');
      }
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await fetch(`/api/applicants/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Application updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      setEditingAppId(null);
      setEditStep(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleStartEdit = (app: any) => {
    setEditingAppId(app.id);
    setEditState(mapAppToState(app));
    setEditStep('candidate');
  };

  const handleSave = () => {
    if (!editingAppId) return;
    const { candidate, parent, additional, documents } = editState;
    saveMutation.mutate({
      id: editingAppId,
      payload: { candidate, parent, additional, documents },
    });
  };

  const handleExportPDF = async (app: any) => {
    try {
      const doc = await buildApplicationPDF(app);
      doc.save(`Application_${(app.candidate?.fullName || 'Unknown').replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const updateEditState = (key: keyof ApplicationState, data: any) => {
    setEditState(prev => ({
      ...prev,
      [key]: typeof data === 'object' && data !== null && !Array.isArray(data)
        ? { ...(prev[key] as object || {}), ...data }
        : data,
    }));
  };

  const handleLogout = async () => {
    await applicantLogout();
    queryClient.clear();
    onLogout();
  };

  // ---- EDIT MODE ----
  if (editingAppId && editStep) {
    const steps: EditStep[] = ['candidate', 'parent', 'additional', 'documents'];
    const stepIdx = steps.indexOf(editStep);

    return (
      <div className="min-h-screen flex flex-col bg-surface">
        {/* Edit mode header */}
        <div className="sticky top-0 z-50 bg-white border-b border-outline-variant/10 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditingAppId(null); setEditStep(null); }} className="p-2 hover:bg-surface-container rounded-lg text-primary/40 hover:text-primary transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-primary/40">Editing Application</div>
              <div className="text-sm font-bold text-primary">{(editState.candidate as CandidateInfo)?.fullName || '...'}</div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-primary rounded-xl font-black text-[11px] uppercase tracking-widest hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Save size={15} />
            {saveMutation.isPending ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        <main className="flex-grow max-w-5xl mx-auto px-4 md:px-8 mt-10 w-full pb-20">
          <Stepper
            currentStep={editStep as Step}
            highestStepIdx={3}
            onStepClick={(s) => setEditStep(s as EditStep)}
            excludePayment={true}
          />
          <div className="mt-10">
            <AnimatePresence mode="wait">
              {editStep === 'candidate' && (
                <motion.div key="candidate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <CandidateInfoForm
                    data={editState.candidate as CandidateInfo}
                    updateData={(d) => updateEditState('candidate', d)}
                    onNext={() => setEditStep('parent')}
                  />
                </motion.div>
              )}
              {editStep === 'parent' && (
                <motion.div key="parent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <ParentInfoForm
                    data={editState.parent as ParentDetails}
                    updateData={(d) => updateEditState('parent', d)}
                    onNext={() => setEditStep('additional')}
                    onBack={() => setEditStep('candidate')}
                  />
                </motion.div>
              )}
              {editStep === 'additional' && (
                <motion.div key="additional" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <AdditionalInfoForm
                    data={editState.additional as AdditionalInfo}
                    updateData={(d) => updateEditState('additional', d)}
                    onNext={() => setEditStep('documents')}
                    onBack={() => setEditStep('parent')}
                  />
                </motion.div>
              )}
              {editStep === 'documents' && (
                <motion.div key="documents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <DocumentUploadForm
                    onNext={handleSave}
                    onBack={() => setEditStep('additional')}
                    candidateName={(editState.candidate as CandidateInfo)?.fullName || ''}
                    consentGiven={true}
                    onConsentChange={() => { }}
                    uploads={editState.documents as Record<string, string>}
                    onUploadChange={(v) => updateEditState('documents', v)}
                    isEditing={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    );
  }

  // ---- DASHBOARD VIEW ----
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-outline-variant/10 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/kianda-school-logo-removebg-preview.png" alt="Kianda" className="w-9 h-9 object-contain" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-primary/40">Kianda School</div>
            <div className="text-sm font-black text-primary">Applicant Dashboard</div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-on-surface-variant/40 hover:text-red-600 hover:bg-red-50 transition-all font-bold text-[11px] uppercase tracking-wider">
          <LogOut size={15} />
          Sign Out
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight mb-2">My Applications</h1>
            <p className="text-sm text-on-surface-variant font-medium">Track the status of your submitted applications. Pending applications can be edited.</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onNewApplication}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={16} />
            Start New Application
          </motion.button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="text-center py-20 bg-red-50 text-red-600 rounded-3xl border border-red-200 shadow-sm">
            <h3 className="text-xl font-bold mb-2">Error Loading Applications</h3>
            <p className="text-sm font-medium">{error?.message}</p>
          </div>
        )}

        {!isLoading && !isError && applications.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-3xl border border-outline-variant/10 shadow-sm">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">No Applications Found</h3>
            <p className="text-sm text-on-surface-variant font-medium">No applications are linked to this account yet.</p>
          </motion.div>
        )}

        <div className="space-y-6">
          {applications.map((app: any, i: number) => {
            const candidate = app.candidate;
            const status = app.status || 'pending';
            const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG['pending'];
            const isPending = status === 'pending';

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[28px] border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Card header */}
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-grow">
                    {candidate?.passportPhotoUrl ? (
                      <AuthenticatedImage src={candidate.passportPhotoUrl} alt={candidate.fullName} className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/20 shadow-sm shrink-0" />
                    ) : (
                      <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center shrink-0">
                        <GraduationCap size={24} className="text-primary/30" />
                      </div>
                    )}
                    <div className="flex-grow min-w-0">
                      <div className="text-lg font-black text-primary truncate">{candidate?.fullName || 'Unknown'}</div>
                      <div className="text-sm font-medium text-on-surface-variant">{candidate?.grade} &bull; Academic Year {app.academicYear}</div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => handleExportPDF(app)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/20 text-[11px] font-bold text-primary hover:bg-surface-variant/30 hover:border-outline-variant/40 hover:shadow-sm hover:scale-[1.05] active:scale-95 transition-all cursor-pointer group"
                    >
                      <Download size={14} className="group-hover:text-secondary transition-colors" /> Export PDF
                    </button>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[12px] font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </div>
                  </div>
                </div>

                {/* Application details summary */}
                <div className="px-6 md:px-8 pb-4 grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-outline-variant/5 pt-4">
                  {[
                    { label: 'Submitted', value: new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
                    { label: 'Last Updated', value: new Date(app.updatedAt || app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
                    { label: 'Transaction Code', value: app.mpesaCode || 'N/A' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="text-[9px] font-black uppercase tracking-widest text-primary/30 mb-0.5">{item.label}</div>
                      <div className="text-[13px] font-bold text-primary">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="px-6 md:px-8 pb-6 pt-2 flex flex-col sm:flex-row gap-3">
                  {isPending ? (
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <button
                        onClick={() => handleStartEdit(app)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-primary rounded-xl font-black text-[11px] uppercase tracking-widest hover:shadow-[0_10px_20px_rgba(255,196,37,0.25)] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Edit3 size={15} />
                        Edit Application
                      </button>
                      <button
                        onClick={() => setPreviewApp(app)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-outline-variant/30 text-primary rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-surface-variant/30 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                      >
                        <Eye size={15} className="group-hover:text-secondary transition-colors" />
                        Preview
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-low text-on-surface-variant/40 rounded-xl font-bold text-[11px] uppercase tracking-widest border border-outline-variant/10">
                      <Eye size={14} />
                      Read-only — application is being processed
                    </div>
                  )}
                </div>

                {/* Pending edit hint */}
                {isPending && (
                  <div className="mx-6 md:mx-8 mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                    <RotateCcw size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 font-semibold">
                      This application is still pending. You can edit all details until we begin reviewing it.
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </main>

      <AnimatePresence>
        {previewApp && (
          <ApplicationPreview
            data={mapAppToState(previewApp) as ApplicationState}
            onClose={() => setPreviewApp(null)}
            onEdit={(step) => {
              setPreviewApp(null);
              setEditingAppId(previewApp.id);
              setEditState(mapAppToState(previewApp));
              setEditStep(step as EditStep);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

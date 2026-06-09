import React from 'react';
import { ApplicationState, Step } from '../types';
import { motion } from 'motion/react';
import { X, Edit2, CheckCircle2, User, Users, FileText, FileBadge, Download } from 'lucide-react';
import { buildApplicationPDF } from '../utils/buildApplicationPDF';

interface Props {
  data: ApplicationState;
  onClose: () => void;
  onEdit: (step: Step) => void;
}

export default function ApplicationPreview({ data, onClose, onEdit }: Props) {
  const handleDownload = async () => {
    const appData = {
      // Use the in-memory base64 preview for the PDF — the server URL at
      // /uploads/... requires an admin token which the parent doesn't have.
      // The base64 is in RAM from when they uploaded the photo moments ago.
      candidate: { ...data.candidate, passportPhotoUrl: data.candidate.passportPhotoPreview || data.candidate.passportPhoto },
      parentDetails: data.parent,
      additionalInfo: data.additional,
      schoolsAttended: data.candidate.schools.map((s: any) => ({ schoolName: s.name, schoolType: s.type, yearsRange: s.years })),
      siblings: data.additional.siblings,
    };
    try {
      const doc = await buildApplicationPDF(appData);
      doc.save(`Application_${data.candidate.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch(e) {
      console.error(e);
    }
  };

  const Section = ({ title, icon: Icon, step, children }: any) => (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/10 relative group">
      <div className="flex justify-between items-start mb-6 border-b border-outline-variant/5 pb-4">
        <div className="flex items-center gap-3 text-primary">
          <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
            <Icon size={20} />
          </div>
          <h3 className="font-bold uppercase tracking-widest text-sm">{title}</h3>
        </div>
        <button
          onClick={() => onEdit(step)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary hover:text-primary transition-colors bg-secondary/10 hover:bg-secondary/20 px-4 py-2 rounded-full"
        >
          <Edit2 size={12} /> Edit
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 border-b border-outline-variant/5 pb-2 last:border-0 last:pb-0">
      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 md:py-1">
        {label}
      </div>
      <div className="col-span-2 text-sm font-semibold text-primary">
        {value || <span className="text-primary/30 italic">Not provided</span>}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-primary/20 backdrop-blur-sm"
    >
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <motion.div
          initial={{ y: 50, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 50, scale: 0.95 }}
          className="bg-surface-container-lowest w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-white my-auto"
        >
          <div className="flex items-center justify-between p-6 md:p-8 border-b border-outline-variant/10 bg-white/50 backdrop-blur-md">
            <div>
              <h2 className="text-2xl font-bold font-headline tracking-tight text-primary">Application Preview</h2>
              <p className="text-xs font-semibold text-on-surface-variant mt-1 uppercase tracking-widest">Review your details before submission</p>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-primary/5 text-primary flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-8 bg-surface-container-lowest/50">
            
            <Section title="Candidate Profile" icon={User} step="candidate">
              <div className="flex flex-col-reverse md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <Field label="Full Name" value={data.candidate.fullName} />
                  <Field label="Applying For" value={data.candidate.grade} />
                  <Field label="Date of Birth" value={data.candidate.dob} />
                  <Field label="Religion" value={`${data.candidate.religion} ${data.candidate.denomination ? `(${data.candidate.denomination})` : ''}`} />
                  <Field label="Birth Order" value={data.candidate.birthOrder} />
                  {data.candidate.assessmentNo && <Field label="Assessment No." value={data.candidate.assessmentNo} />}
                  <Field label="Medical Info" value={data.candidate.medicalInfo} />
                </div>
                {(data.candidate.passportPhotoPreview || data.candidate.passportPhoto) && (
                  <div className="md:w-32 flex flex-col items-center gap-2">
                    <img 
                      src={data.candidate.passportPhotoPreview || data.candidate.passportPhoto} 
                      alt="Passport" 
                      className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-lg bg-surface-variant/20"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Passport Photo</span>
                  </div>
                )}
              </div>
            
            {data.candidate.schools.length > 0 && (
              <div className="mt-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-3">Previous Education</h4>
                <div className="space-y-2">
                  {data.candidate.schools.map((school, i) => (
                    <div key={i} className="flex justify-between items-center bg-primary/5 p-3 rounded-xl">
                      <div>
                        <div className="text-xs font-bold text-primary">{school.name}</div>
                        <div className="text-[10px] font-semibold text-primary/60">{school.type}</div>
                      </div>
                      <div className="text-[10px] font-bold tracking-widest text-primary/60">{school.years}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title="Parent / Guardian Info" icon={Users} step="parent">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-4">Father's Details</h4>
                <div className="space-y-2">
                  <Field label="Name" value={data.parent.fatherName} />
                  <Field label="Phone" value={data.parent.fatherPhone} />
                  <Field label="Email" value={data.parent.fatherEmail} />
                  <Field label="Profession" value={data.parent.fatherProfession} />
                  <Field label="Work" value={data.parent.fatherWork} />
                  {(data.parent.fatherAltContactName) && (
                    <div className="mt-4 pt-4 border-t border-outline-variant/5">
                      <h5 className="text-[9px] font-bold uppercase tracking-widest text-primary/40 mb-2">Alternative Contact</h5>
                      <Field label="Name" value={data.parent.fatherAltContactName} />
                      <Field label="Phone" value={data.parent.fatherAltContactPhone} />
                      <Field label="Relation" value={data.parent.fatherAltContactRelation} />
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-4">Mother's Details</h4>
                <div className="space-y-2">
                  <Field label="Name" value={data.parent.motherName} />
                  <Field label="Phone" value={data.parent.motherPhone} />
                  <Field label="Email" value={data.parent.motherEmail} />
                  <Field label="Profession" value={data.parent.motherProfession} />
                  <Field label="Work" value={data.parent.motherWork} />
                  {(data.parent.motherAltContactName) && (
                    <div className="mt-4 pt-4 border-t border-outline-variant/5">
                      <h5 className="text-[9px] font-bold uppercase tracking-widest text-primary/40 mb-2">Alternative Contact</h5>
                      <Field label="Name" value={data.parent.motherAltContactName} />
                      <Field label="Phone" value={data.parent.motherAltContactPhone} />
                      <Field label="Relation" value={data.parent.motherAltContactRelation} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {data.parent.residency && (
               <div className="mt-6 pt-4 border-t border-outline-variant/5">
                  <Field label="Family Residency" value={data.parent.residency} />
               </div>
            )}
          </Section>

          <Section title="Additional Info" icon={FileText} step="additional">
             <Field label="Motivation" value={data.additional.motivation} />
             <Field label="Discovery Source" value={data.additional.source === 'Other' ? data.additional.sourceOther : data.additional.source} />
             <Field label="Previously Applied?" value={data.additional.hasAppliedBefore ? `Yes (${data.additional.previousApplicationYears.join(', ')})` : 'No'} />
             
             {data.additional.siblings.length > 0 && (
              <div className="mt-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mb-3">Siblings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.additional.siblings.map((sibling, i) => (
                    <div key={i} className="bg-primary/5 p-4 rounded-xl">
                      <div className="text-xs font-bold text-primary">{sibling.name}</div>
                      <div className="text-[10px] font-semibold text-primary/60 mt-1">
                        {sibling.relationship} • {sibling.grade}
                      </div>
                      {sibling.schoolType && (
                        <div className="text-[9px] font-bold uppercase tracking-widest text-secondary mt-2">
                           {sibling.schoolType === 'Kianda School' ? `Kianda School (${sibling.kiandaOrder})` : sibling.schoolName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title="Uploaded Documents" icon={FileBadge} step="documents">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: 'letter', label: 'Application Letter' },
                  { id: 'birthCert', label: 'Candidate\'s Birth Certificate' },
                  { id: 'report', label: 'Latest School Report' }
                ].map(doc => {
                   const file = data.documents[doc.id];
                   return (
                     <div key={doc.id} className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${file ? 'bg-green-100 text-green-600' : 'bg-surface-variant text-on-surface-variant/40'}`}>
                           {file ? <CheckCircle2 size={14} /> : <X size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="text-[10px] font-bold uppercase tracking-widest text-primary/80 truncate">{doc.label}</div>
                           <div className="text-xs font-medium text-primary mt-0.5 truncate">{file ? 'Uploaded' : 'Missing'}</div>
                        </div>
                     </div>
                   );
                })}
             </div>
          </Section>
          
        </div>

        <div className="p-6 md:p-8 bg-white border-t border-outline-variant/10 flex justify-end shrink-0 gap-4">
          <button
            onClick={handleDownload}
            className="px-8 py-4 bg-primary/5 text-primary rounded-full font-black uppercase tracking-[0.2em] text-[11px] hover:bg-primary/10 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Download PDF
          </button>
          <button
            onClick={onClose}
            className="px-10 py-4 bg-secondary text-primary rounded-full font-black uppercase tracking-[0.2em] text-[11px] hover:-translate-y-1 hover:shadow-lg transition-all"
          >
            Looks Good, Continue
          </button>
        </div>
      </motion.div>
      </div>
    </motion.div>
  );
}

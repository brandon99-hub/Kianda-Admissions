import { ArrowLeft, ArrowRight, FileText, Upload, CheckCircle2, RefreshCw, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
  consentGiven: boolean;
  onConsentChange: (val: boolean) => void;
  uploads: Record<string, string>;
  onUploadChange: (uploads: Record<string, string>) => void;
  candidateName: string;
}

export default function DocumentUploadForm({ onNext, onBack, onCancel, consentGiven, onConsentChange, uploads, onUploadChange, candidateName }: Props) {
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  const documents = [
    { id: 'letter', label: 'Application Letter', description: 'Personal letter expressing interest' },
    { id: 'birthCert', label: 'Candidate\'s Birth Certificate', description: 'Scanned copy of the official document' },
    { id: 'report', label: 'Latest School Report', description: 'Most recent assessment or report card' },
  ];

  const handleUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Quick validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    setUploadingState(prev => ({ ...prev, [id]: true }));
    const toastId = toast.loading(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`http://localhost:5000/api/upload?candidateName=${encodeURIComponent(candidateName || 'Unknown')}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      onUploadChange({ ...uploads, [id]: data.fileUrl });
      toast.success('File uploaded safely!', { id: toastId });
    } catch (err) {
      toast.error('Network error during upload. Please try again.', { id: toastId });
    } finally {
      setUploadingState(prev => ({ ...prev, [id]: false }));
    }
  };

  const allUploaded = Object.values(uploads).every(v => v !== '');
  const canProceed = allUploaded && consentGiven;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-surface-container-lowest p-8 md:p-12 rounded-2xl shadow-sm border border-outline-variant/5"
    >
      <div className="relative z-10">
        <div className="mb-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-primary">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-primary">Document Uploads</h3>
            <p className="text-sm text-on-surface-variant font-medium">Please provide the required documentation for the application processing.</p>
          </div>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="p-6 bg-surface-container-low rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-primary/10">
              <div className="flex gap-4 items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${uploads[doc.id] ? 'bg-green-100 text-green-600' : 'bg-primary/5 text-primary'}`}>
                  {uploads[doc.id] ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-primary">{doc.label}</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{doc.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {uploadingState[doc.id] ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Uploading...</span>
                  </div>
                ) : uploads[doc.id] ? (
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600">Attached</span>
                    <label className="cursor-pointer p-2 hover:bg-primary/5 rounded-full text-primary/40 hover:text-primary transition-all group/change">
                      <RefreshCw size={14} className="group-hover/change:rotate-180 transition-transform duration-500" />
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleUpload(doc.id, e)} />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer px-10 py-3 bg-white text-primary rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-outline-variant/10 shadow-sm hover:bg-secondary hover:border-secondary hover:shadow-lg hover:shadow-secondary/20 hover:-translate-y-1 active:translate-y-0 active:scale-95 group/upload">
                    <span className="group-hover/upload:scale-110 block transition-transform">Upload</span>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleUpload(doc.id, e)} />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 p-6 rounded-2xl mt-8 flex gap-4 items-start border border-primary/5">
          <div className="text-primary mt-1"><Upload size={18} /></div>
          <p className="text-[10px] text-on-surface-variant leading-relaxed font-medium uppercase tracking-tight">
            Accepted formats: **PDF, JPG, PNG**. Max file size: **5MB**. Please ensure all documents are legible and officially stamped where required.
          </p>
        </div>

        {/* Custom Data Consent Section */}
        <div className="mt-12 p-8 bg-surface-container-low rounded-[32px] border border-outline-variant/10 relative overflow-hidden group/consent">
           <div className="flex items-start gap-6 relative z-10">
              <div 
                onClick={() => onConsentChange(!consentGiven)}
                className={`mt-1 cursor-pointer w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${consentGiven ? 'bg-primary border-primary shadow-lg shadow-primary/20 scale-110' : 'border-primary/20 bg-white hover:border-primary/40'}`}
              >
                  {consentGiven && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><ShieldCheck size={16} className="text-white" /></motion.div>}
              </div>
              <div className="flex-1">
                 <h4 className="text-sm font-black text-primary tracking-tight mb-2 italic">Data Usage Acknowledgement</h4>
                 <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed opacity-60">
                    I hereby acknowledge and consent to the use of the data shared in this application for the sole purpose of admission processing at Kianda School. I understand that this information will be handled in accordance with the school's privacy policy and data protection guidelines.
                 </p>
              </div>
           </div>
           <div className={`absolute inset-0 bg-primary/5 transition-opacity duration-500 ${consentGiven ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        <div className="flex justify-between items-center pt-12">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-8 py-4 text-on-surface-variant font-bold uppercase tracking-[0.2em] text-[10px] hover:text-primary transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-4 text-on-surface-variant/30 font-black uppercase tracking-[0.3em] text-[10px] hover:text-primary transition-all hover:translate-x-[-4px]"
            >
              Cancel Application
            </button>
          </div>
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className={`px-10 py-5 rounded-[28px] font-black transition-all flex items-center gap-4 group border border-white/20 relative overflow-hidden ${canProceed ? 'bg-secondary text-primary shadow-[0_20px_40px_rgba(255,196,37,0.25)] hover:shadow-[0_25px_50px_rgba(255,196,37,0.35)] hover:-translate-y-1 active:scale-95' : 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="tracking-[0.25em] uppercase text-[11px] relative z-10">Continue to Payment</span>
            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all relative z-10 shadow-inner">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

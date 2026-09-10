import { ArrowLeft, ArrowRight, FileText, Upload, CheckCircle2, RefreshCw, ShieldCheck, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';

interface Props {
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
  consentGiven: boolean;
  onConsentChange: (val: boolean) => void;
  uploads: Record<string, string>;
  onUploadChange: (uploads: Record<string, string>) => void;
  candidateName: string;
  isEditing?: boolean;
}

export default function DocumentUploadForm({ onNext, onBack, onCancel, consentGiven, onConsentChange, uploads, onUploadChange, candidateName, isEditing }: Props) {
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleRemove = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (fileInputRefs.current[id]) {
      fileInputRefs.current[id]!.value = '';
    }
    const updated = { ...uploads };
    delete updated[id];
    onUploadChange(updated);
    setUploadErrors(prev => ({ ...prev, [id]: null }));
  };

  const documents = [
    { id: 'letter', label: 'Application Letter', description: 'Personal letter expressing interest' },
    { id: 'birthCert', label: 'Candidate\'s Birth Certificate', description: 'Scanned copy of the official document' },
    { id: 'report', label: 'Latest School Report', description: 'Most recent assessment or report card' },
  ];

  const handleUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset prior error
    setUploadErrors(prev => ({ ...prev, [id]: null }));

    // File format & HEIC validation
    const allowedDocExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const fileName = file.name.toLowerCase();
    const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';
    if (isHeic) {
      const errMsg = 'Apple HEIC files are not supported. Please upload a PDF, JPG, PNG, or DOCX document.';
      setUploadErrors(prev => ({ ...prev, [id]: errMsg }));
      toast.error(errMsg);
      e.target.value = '';
      return;
    }

    const hasValidExt = allowedDocExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExt) {
      const errMsg = 'Unsupported format. Please upload PDF, JPG, PNG, DOC, or DOCX files.';
      setUploadErrors(prev => ({ ...prev, [id]: errMsg }));
      toast.error(errMsg);
      e.target.value = '';
      return;
    }

    // 15MB Limit Validation
    if (file.size > 15 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const errMsg = `File size (${sizeMb}MB) exceeds the 15MB limit. Please select a smaller file.`;
      setUploadErrors(prev => ({ ...prev, [id]: errMsg }));
      toast.error(errMsg);
      e.target.value = '';
      return;
    }

    setUploadingState(prev => ({ ...prev, [id]: true }));
    const toastId = toast.loading(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/upload?candidateName=${encodeURIComponent(candidateName || 'Unknown')}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errMsg = 'Upload failed';
        try {
          const resData = await response.json();
          if (resData.error) errMsg = resData.error;
        } catch {
          if (response.status === 413) {
            errMsg = 'File size exceeds the 15MB server limit.';
          } else if (response.status === 415) {
            errMsg = 'Unsupported file format. Please upload PDF, JPG, PNG, DOC, or DOCX.';
          } else if (response.status >= 500) {
            errMsg = 'Server encountered an issue saving the file. Please retry.';
          }
        }
        throw new Error(errMsg);
      }
      
      const data = await response.json();
      onUploadChange({ ...uploads, [id]: data.fileUrl });
      setUploadErrors(prev => ({ ...prev, [id]: null }));
      toast.success(`${file.name} uploaded safely!`, { id: toastId });
    } catch (err: any) {
      const isNetworkError = err?.name === 'TypeError' && err?.message?.includes('fetch');
      const message = isNetworkError 
        ? 'Connection lost during upload. Please check your internet and try again.'
        : (err?.message || 'Failed to upload document. Please try again.');
      setUploadErrors(prev => ({ ...prev, [id]: message }));
      toast.error(message, { id: toastId });
    } finally {
      setUploadingState(prev => ({ ...prev, [id]: false }));
      e.target.value = '';
    }
  };

  const allUploaded = Object.values(uploads).every(v => v !== '');
  const canProceed = allUploaded && consentGiven;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-transparent md:bg-surface-container-lowest p-0 md:p-12 rounded-none md:rounded-2xl shadow-none md:shadow-sm border-none md:border md:border-outline-variant/5"
    >
      <div className="relative z-10">
        <div className="mb-8 md:mb-10 flex items-start md:items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-primary shrink-0">
            <FileText size={18} className="md:w-5 md:h-5" />
          </div>
          <div>
            <h3 className="text-lg md:text-2xl font-bold text-primary leading-tight mb-0.5">Document Uploads</h3>
            <p className="text-[11px] md:text-sm text-on-surface-variant font-medium leading-snug">Please provide the required documentation for the application processing.</p>
          </div>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => {
            const isUploaded = !!uploads[doc.id];
            const isUploading = !!uploadingState[doc.id];

            let displayName = 'Uploaded';
            if (isUploaded) {
              const filePart = uploads[doc.id].split('/').pop() || '';
              const dashIdx = filePart.indexOf('-');
              displayName = dashIdx !== -1 ? filePart.substring(dashIdx + 1) : filePart;
              try { displayName = decodeURIComponent(displayName); } catch (e) {}
            }

            const hasError = !!uploadErrors[doc.id];

            return (
              <div key={doc.id} className="space-y-1">
                <div 
                  onClick={() => {
                    if (!isUploaded && !isUploading) {
                      fileInputRefs.current[doc.id]?.click();
                    }
                  }}
                  className={`relative block p-5 md:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between group transition-all duration-300 border ${
                    !isUploaded ? 'cursor-pointer active:scale-[0.98]' : ''
                  } ${
                    hasError
                      ? 'bg-red-50/40 border-red-300 hover:border-red-400'
                      : isUploaded 
                        ? 'bg-green-50/50 border-green-500/20 hover:bg-green-50 hover:shadow-xl hover:-translate-y-1' 
                        : 'bg-surface-container-low border-transparent hover:border-primary/10 hover:bg-white hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  <input 
                    ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
                    onChange={(e) => handleUpload(doc.id, e)} 
                    disabled={isUploading} 
                  />
                  
                  <div className="flex gap-4 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      hasError 
                        ? 'bg-red-100 text-red-600'
                        : isUploaded 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-primary/5 text-primary'
                    }`}>
                      {hasError ? <AlertTriangle size={20} /> : isUploaded ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                    </div>
                    <div className="flex-1 pr-2 overflow-hidden">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-primary">{doc.label}</h4>
                      <p className={`text-[10px] font-medium mt-0.5 ${hasError ? 'text-red-500' : isUploaded ? 'text-green-700/60' : 'text-on-surface-variant'}`}>
                        {hasError ? 'Upload failed. Tap to retry.' : doc.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex items-center justify-end md:justify-center gap-4 w-full md:w-auto">
                    {isUploading ? (
                      <div className="flex items-center gap-2 px-4 py-3 md:py-2 bg-primary/5 rounded-full w-full justify-center md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-outline-variant/10 md:border-transparent mt-2 md:mt-0">
                        <Loader2 size={14} className="animate-spin text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Uploading...</span>
                      </div>
                    ) : isUploaded ? (
                      <div className="flex items-center gap-2 w-full justify-between md:justify-end md:max-w-[280px] lg:md:max-w-[340px] border-t md:border-t-0 pt-4 md:pt-0 border-green-500/10 md:border-transparent mt-2 md:mt-0">
                        <span className="text-[10px] font-black tracking-[0.1em] text-green-600 bg-green-100 px-3 py-1.5 rounded-lg md:bg-transparent md:px-0 md:py-0 truncate flex-1 min-w-0 text-left md:text-right" title={displayName}>{displayName}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              fileInputRefs.current[doc.id]?.click();
                            }}
                            className="p-2 hover:bg-green-100 rounded-full text-green-600/60 hover:text-green-700 transition-all hover:rotate-180" 
                            title="Replace file"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleRemove(doc.id, e)}
                            className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-full transition-colors cursor-pointer"
                            title="Remove uploaded file"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="hidden md:flex px-10 py-3 bg-white text-primary rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-outline-variant/10 shadow-sm group-hover:bg-secondary group-hover:border-secondary group-hover:shadow-lg group-hover:shadow-secondary/20">
                          <span className="group-hover:scale-110 block transition-transform">{hasError ? 'Retry' : 'Upload'}</span>
                        </div>
                        <div className="md:hidden w-full flex items-center justify-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] bg-primary/5 py-3.5 rounded-xl border-t border-outline-variant/10 mt-2">
                          <Upload size={14} /> {hasError ? 'Tap to Retry' : 'Tap to Upload'}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {hasError && (
                  <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-[11px] font-medium animate-in fade-in duration-300">
                    <AlertTriangle size={13} className="shrink-0 text-red-500" />
                    <span className="flex-1">{uploadErrors[doc.id]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-primary/5 p-6 rounded-2xl mt-8 flex gap-4 items-start border border-primary/5">
          <div className="text-primary mt-1"><Upload size={18} /></div>
          <p className="text-[10px] text-on-surface-variant leading-relaxed font-medium uppercase tracking-tight">
            Accepted formats: **PDF, JPG, PNG, DOC, DOCX**. Max file size: **15MB per document**. Please ensure all documents are legible and officially stamped where required.
          </p>
        </div>

        {/* Custom Data Consent Section */}
        <div className={`mt-12 p-8 bg-surface-container-low rounded-[32px] border border-outline-variant/10 relative overflow-hidden group/consent ${isEditing ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
           <div className="flex items-start gap-6 relative z-10">
              <div 
                onClick={() => { if (!isEditing) onConsentChange(!consentGiven); }}
                className={`mt-1 cursor-pointer w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${consentGiven ? 'bg-primary border-primary shadow-lg shadow-primary/20 scale-110' : 'border-primary/20 bg-white hover:border-primary/40'}`}
              >
                  {consentGiven && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><ShieldCheck size={16} className="text-white" /></motion.div>}
              </div>
              <div className="flex-1">
                 <h4 className="text-sm font-black text-primary tracking-tight mb-2 italic">Data Usage Acknowledgement</h4>
                 <p className="text-[11px] font-medium text-primary/70 leading-relaxed">
                    I consent to Kianda School using my data for this application as described in the{" "}
                    <a 
                      href="/data-protection-policy-kianda-school.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary font-black underline underline-offset-4 decoration-secondary/30 hover:decoration-secondary transition-all"
                    >
                      Data Protection Policy
                    </a>. 
                    I understand I can withdraw this consent at any time.
                 </p>
              </div>
           </div>
           <div className={`absolute inset-0 bg-primary/5 transition-opacity duration-500 ${consentGiven ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        <div className="flex flex-col-reverse md:flex-row justify-between items-stretch md:items-center gap-6 md:gap-0 pt-12 w-full">
            <div className="flex flex-row gap-2 md:gap-4 w-full md:w-auto">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 md:flex-none justify-center px-4 md:px-8 py-4 text-on-surface-variant font-bold uppercase tracking-[0.2em] text-[10px] hover:text-primary transition-colors flex items-center gap-1 md:gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 md:flex-none text-center px-4 md:px-8 py-4 text-on-surface-variant/30 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] hover:text-primary transition-all md:hover:translate-x-[-4px]"
              >
                Cancel
              </button>
            )}
            </div>
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed || isEditing}
            className={`w-full md:w-auto justify-center px-10 py-5 rounded-[28px] font-black transition-all flex items-center gap-4 group border border-white/20 relative overflow-hidden ${(!canProceed || isEditing) ? 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed' : 'bg-secondary text-primary shadow-[0_20px_40px_rgba(255,196,37,0.25)] hover:shadow-[0_25px_50px_rgba(255,196,37,0.35)] hover:-translate-y-1 active:scale-95'}`}
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

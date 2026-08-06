import React, { useState } from 'react';
import { Plus, X, Trash2, FileText, Upload, Loader2, Link } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminPageHeader from '../AdminPageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function ProcessDocumentsView() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ gradeName: '', title: '', fileUrl: '', fileName: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [docToDelete, setDocToDelete] = useState<number | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['adminProcessDocuments'],
    queryFn: async () => {
      const res = await fetch('/api/admin/process-documents', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    }
  });

  const createDocMutation = useMutation({
    mutationFn: async (docData: any) => {
      const res = await fetch('/api/admin/process-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(docData)
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProcessDocuments'] });
      toast.success('Document uploaded');
      setShowModal(false);
      setNewDoc({ gradeName: '', title: '', fileUrl: '', fileName: '' });
    },
    onError: () => toast.error('Failed to upload document')
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/process-documents/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProcessDocuments'] });
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document')
  });

  const handleSecureView = async (url: string) => {
    if (!url) return;
    const toastId = toast.loading('Opening document...');
    try {
      let fetchUrl = url;
      if (fetchUrl.startsWith('/uploads/')) {
        fetchUrl = `/api${fetchUrl}`;
      }
      const res = await fetch(fetchUrl, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to load document');
      
      // Ensure the blob is treated as PDF (most process docs are PDFs)
      // so the browser opens its PDF viewer instead of just downloading
      let blob = await res.blob();
      if (url.toLowerCase().endsWith('.pdf')) {
        blob = new Blob([blob], { type: 'application/pdf' });
      }

      const objectUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Document opened', { id: toastId });
      
      // Give the new tab time to load the Blob before revoking
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    } catch (error) {
      console.error('Secure View Error:', error);
      toast.error('Failed to open document', { id: toastId });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/upload?candidateName=Admin_Process_Docs`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error();
      const resData = await response.json();
      setNewDoc(prev => ({ ...prev, fileUrl: resData.fileUrl, fileName: file.name }));
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.fileUrl) {
      toast.error('Please upload a file first');
      return;
    }
    createDocMutation.mutate(newDoc);
  };

  return (
    <div className="space-y-12 pb-20 relative">
      <AdminPageHeader 
        title="Admission Process Documents" 
        description="Upload joining instructions and procedure documents for each grade." 
        icon={FileText}
      >
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-8 py-4 bg-primary text-secondary rounded-[20px] font-black uppercase tracking-widest text-xs hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-primary/20"
        >
          <Plus size={18} />
          New Document
        </button>
      </AdminPageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[2px] rounded-[48px]">
             <Loader2 size={48} className="animate-spin text-primary/20" />
          </div>
        )}
        {documents.map((doc: any) => (
          <motion.div 
            key={doc.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-8 shadow-xl shadow-primary/5 border border-outline-variant/10 group relative hover:-translate-y-1 transition-all"
          >
             <div className="w-14 h-14 bg-primary/5 rounded-[20px] flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-secondary transition-colors">
                <FileText size={24} />
             </div>
             
             <h4 className="text-xl font-black text-primary mb-1">{doc.title}</h4>
             <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest mb-6">
               {doc.gradeName || 'General Document'}
             </span>
             
             <div className="flex gap-3">
                <button 
                  onClick={() => handleSecureView(doc.fileUrl)}
                  className="flex-1 flex justify-center items-center gap-2 py-3 bg-primary/5 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-colors"
                >
                  <Link size={14} /> View
                </button>
                <button 

                  onClick={() => setDocToDelete(doc.id)}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 size={16} />
                </button>
             </div>
          </motion.div>
        ))}
        {documents.length === 0 && !isLoading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-on-surface-variant/40 border-2 border-dashed border-outline-variant/10 rounded-[48px] bg-white/50">
             <FileText size={48} className="mb-4 opacity-50" />
             <p className="text-xs font-black uppercase tracking-widest">No documents uploaded yet</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !createDocMutation.isPending && setShowModal(false)} className="absolute inset-0 bg-primary/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-lg rounded-[48px] p-12 shadow-[0_40px_80px_rgba(0,0,0,0.15)] relative z-10 border border-outline-variant/10">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-black text-primary italic tracking-tight">Upload Document</h3>
                  <button onClick={() => !createDocMutation.isPending && setShowModal(false)} className="p-2 hover:bg-primary/5 rounded-full transition-colors"><X size={24} className="text-primary/20" /></button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 ml-1">Grade</label>
                    <select 
                      value={newDoc.gradeName}
                      disabled={createDocMutation.isPending}
                      onChange={e => setNewDoc({...newDoc, gradeName: e.target.value})}
                      className="w-full bg-surface-container-low p-4 rounded-2xl border-none font-bold text-primary appearance-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <option value="">None (General Document)</option>
                      {Array.from({ length: 10 }, (_, i) => `Grade ${i + 1}`).map(label => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 ml-1">Document Title</label>
                    <input 
                      required placeholder="e.g. Joining Instructions 2026"
                      value={newDoc.title}
                      disabled={createDocMutation.isPending}
                      onChange={e => setNewDoc({...newDoc, title: e.target.value})}
                      className="w-full bg-surface-container-low p-4 rounded-2xl border-none font-bold text-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2 pt-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 ml-1">File Attachment</label>
                     <div className="flex items-center gap-4">
                        <label className={`flex-1 flex justify-center items-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-pointer transition-all ${newDoc.fileUrl ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}>
                           {isUploading ? (
                              <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                           ) : newDoc.fileUrl ? (
                              <div className="flex flex-col items-center">
                                <span className="flex items-center gap-2"><FileText size={16} /> {newDoc.fileName}</span>
                                <span className="text-[8px] opacity-60">Click to change</span>
                              </div>
                           ) : (
                              <><Upload size={16} /> Select PDF</>
                           )}
                           <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </label>
                     </div>
                  </div>

                  <button type="submit" disabled={createDocMutation.isPending || isUploading} className={`w-full py-5 bg-primary text-secondary rounded-[20px] font-black uppercase tracking-widest text-[12px] transition-all shadow-xl shadow-primary/20 mt-8 relative overflow-hidden group ${(createDocMutation.isPending || isUploading) ? 'cursor-not-allowed opacity-70' : 'hover:scale-[1.03] active:scale-[0.98]'}`}>
                    {createDocMutation.isPending ? (<div className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Saving...</div>) : 'Publish Document'}
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {docToDelete !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !deleteDocMutation.isPending && setDocToDelete(null)} className="absolute inset-0 bg-primary/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative z-10 border border-outline-variant/10 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-black text-primary mb-2">Delete Document</h3>
              <p className="text-xs font-medium text-on-surface-variant opacity-60 mb-8">Are you sure you want to permanently delete this document? This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setDocToDelete(null)}
                  disabled={deleteDocMutation.isPending}
                  className="flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-primary/60 hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    deleteDocMutation.mutate(docToDelete);
                    setDocToDelete(null);
                  }}
                  disabled={deleteDocMutation.isPending}
                  className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteDocMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, User, Mail, ChevronRight, Loader2, ChevronDown, Archive, CheckSquare, Square, X, Filter, FileDown } from 'lucide-react';
import AdminPageHeader from '../AdminPageHeader';
import ApplicationDetailsView from './ApplicationDetailsView';
import TablePagination from '../TablePagination';
import SchoolSwitcher from '../SchoolSwitcher';
import { useApplications, useUpdateApplicationStatus } from '../../../hooks/useAdminData';
import { buildApplicationPDF } from '../../../utils/buildApplicationPDF';
import JSZip from 'jszip';

// ── Application Row ───────────────────────────────────────────────────────────

const ApplicationRow: React.FC<{
  app: any;
  onViewDetails: () => void;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
}> = ({ app, onViewDetails, isSelectMode, isSelected, onToggleSelect }) => {
  const [parentToggle, setParentToggle] = useState<'mother' | 'father'>('mother');

  return (
    <tr
      className={`hover:bg-primary/5 transition-colors group cursor-pointer ${isSelected ? 'bg-secondary/5' : ''}`}
      onClick={isSelectMode ? onToggleSelect : onViewDetails}
    >
      {/* Checkbox cell */}
      <td className="pl-6 pr-2 py-6 w-10" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence>
          {isSelectMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              onClick={onToggleSelect}
              className="text-primary transition-colors"
            >
              {isSelected
                ? <CheckSquare size={18} className="text-secondary" />
                : <Square size={18} className="text-primary/30 hover:text-primary/60" />}
            </motion.button>
          )}
        </AnimatePresence>
      </td>

      <td className="px-6 py-6">
        <div className="font-bold text-primary text-sm">{app.candidate?.fullName}</div>
        <div className="text-[10px] text-on-surface-variant font-medium opacity-40">APP-{app.id.toString().padStart(4, '0')}</div>
      </td>
      <td className="px-6 py-6">
        <div className="flex flex-col">
            <div className="font-bold text-primary text-sm whitespace-nowrap">
                {app.candidate?.dob ? new Date(app.candidate.dob).toLocaleDateString('en-GB') : 'N/A'}
            </div>
            <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                ({(() => {
                    if (!app.candidate?.dob) return '0';
                    const birth = new Date(app.candidate.dob);
                    const now = new Date();
                    let age = now.getFullYear() - birth.getFullYear();
                    const m = now.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                    return age;
                })()} yrs)
            </div>
        </div>
      </td>
      <td className="px-6 py-6 text-sm font-bold text-on-surface-variant/60 italic">
        {app.candidate?.religion || 'N/A'} 
        {app.candidate?.denomination && <span className="text-secondary ml-1">({app.candidate.denomination})</span>}
      </td>
      <td className="px-6 py-6 text-sm font-black text-secondary">{app.candidate?.grade}</td>
      <td className="px-6 py-6">
        <div className="flex flex-col gap-2">
          <div className="flex bg-primary/5 rounded-full p-0.5 border border-primary/10 w-fit">
            <button
              onClick={(e) => { e.stopPropagation(); setParentToggle('mother'); }}
              className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${parentToggle === 'mother' ? 'bg-primary text-white' : 'text-primary/40 hover:text-primary'}`}
            >Mother</button>
            <button
              onClick={(e) => { e.stopPropagation(); setParentToggle('father'); }}
              className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${parentToggle === 'father' ? 'bg-primary text-white' : 'text-primary/40 hover:text-primary'}`}
            >Father</button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={parentToggle} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <User size={12} className="text-secondary" />
                {app.parentDetails?.[`${parentToggle}Name`] || 'Not provided'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium text-on-surface-variant opacity-60">
                <Mail size={10} />
                {app.parentDetails?.[`${parentToggle}Email`] || '—'}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </td>
      <td className="px-6 py-6">
          <SchoolSwitcher schools={app.schoolsAttended || []} />
      </td>
      <td className="px-6 py-6">
          <div className="relative group/motivation cursor-help">
            <div className="text-[10px] font-bold text-primary/60 line-clamp-2 max-w-[150px] leading-relaxed">
              {app.additionalInfo?.motivation || 'No motivation provided.'}
            </div>
            {app.additionalInfo?.motivation && (
              <div className="absolute bottom-full left-0 mb-4 opacity-0 group-hover/motivation:opacity-100 transition-all pointer-events-none z-[60] w-64">
                <div className="bg-white p-4 rounded-2xl shadow-2xl border border-secondary/20 shadow-primary/20">
                  <div className="text-[9px] font-black uppercase tracking-widest text-secondary mb-2">Motivation Statement</div>
                  <p className="text-[11px] leading-relaxed font-medium text-primary italic whitespace-normal break-words">"{app.additionalInfo.motivation}"</p>
                </div>
                <div className="w-3 h-3 bg-white rotate-45 border-r border-b border-secondary/20 -mt-1.5 ml-6 shadow-sm" />
              </div>
            )}
          </div>
      </td>
      <td className="px-6 py-6">
        <div className="text-xs font-mono font-black tracking-[0.2em] text-primary/80 bg-primary/5 px-3 py-1 rounded-md border border-primary/10 w-fit">
          {app.mpesaCode || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-6">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md border w-fit ${
          app.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' :
          ['passed_assessment', 'interview_scheduled'].includes(app.status) ? 'bg-green-50 text-green-600 border-green-100' :
          app.status === 'waitlisted' ? 'bg-amber-50 text-amber-600 border-amber-100' :
          app.status === 'assessment_scheduled' ? 'bg-secondary/10 text-primary border-secondary/20' :
          app.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
          app.status === 'failed' ? 'bg-orange-50 text-orange-600 border-orange-100' :
          app.status === 'pending' ? 'bg-secondary/10 text-primary border-secondary/20' :
          'bg-primary/5 text-primary border-primary/10'
        }`}>
          {['passed_assessment', 'interview_scheduled'].includes(app.status) ? 'Passed' :
           app.status === 'assessment_scheduled' ? 'Pending' :
           app.status === 'waitlisted' ? 'Waitlist' :
           app.status.replace('_', ' ')}
        </div>
      </td>
      <td className="px-6 py-6">
        <div className="flex flex-col">
          <div className="text-[11px] font-bold text-primary">
            {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
          </div>
          <div className="text-[8px] font-black uppercase tracking-widest text-primary/30">Applied On</div>
        </div>
      </td>
      <td className="px-6 py-6 text-right">
        {!isSelectMode && (
          <div className="w-8 h-8 inline-flex items-center justify-center bg-primary/5 rounded-full text-primary hover:bg-secondary hover:text-primary transition-all shadow-inner group-hover:-translate-x-1">
            <ChevronRight size={16} />
          </div>
        )}
      </td>
    </tr>
  );
};

// ── Bulk Export Filter Modal ──────────────────────────────────────────────────

const BulkExportModal: React.FC<{
  apps: any[];
  onClose: () => void;
  onExport: (filtered: any[]) => void;
  isBulkExporting: boolean;
}> = ({ apps, onClose, onExport, isBulkExporting }) => {
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');

  const uniqueGrades = Array.from(new Set(apps.map((a: any) => a.candidate?.grade).filter(Boolean))) as string[];
  const uniqueYears = Array.from(new Set(apps.map((a: any) => a.academicYear).filter(Boolean))).sort() as number[];

  const filtered = apps.filter((a: any) => {
    const y = filterYear === 'all' || a.academicYear === filterYear;
    const g = filterGrade === 'all' || a.candidate?.grade === filterGrade;
    
    let matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    if (filterStatus === 'pending') matchesStatus = ['pending', 'assessment_scheduled'].includes(a.status);
    if (filterStatus === 'passed_assessment') matchesStatus = ['passed_assessment', 'interview_scheduled'].includes(a.status);
    
    return y && g && matchesStatus;
  });

  const statusOptions = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'passed_assessment', label: 'Passed' },
    { id: 'waitlisted', label: 'Waitlist' },
    { id: 'failed', label: 'Failed' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-primary/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white max-w-lg w-full rounded-[32px] p-8 relative z-10 shadow-2xl border border-outline-variant/10"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-primary/5 text-primary/40 hover:text-primary transition-colors">
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center">
              <Archive size={18} className="text-secondary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-primary">Bulk Export ZIP</h3>
              <p className="text-xs font-bold text-primary/40">Apply filters or export all applications</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Year filter */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 block mb-2">Academic Year</label>
            <div className="relative">
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/10 rounded-2xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 pr-10"
              >
                <option value="all">All Years</option>
                {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 pointer-events-none" />
            </div>
          </div>

          {/* Grade filter */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 block mb-2">Grade</label>
            <div className="relative">
              <select
                value={filterGrade}
                onChange={e => setFilterGrade(e.target.value)}
                className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/10 rounded-2xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 pr-10"
              >
                <option value="all">All Grades</option>
                {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 pointer-events-none" />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 block mb-2">Application Status</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilterStatus(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    filterStatus === opt.id
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-container-lowest text-primary/50 border-outline-variant/10 hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview count */}
        <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
          <span className="text-xs font-bold text-primary/60">Applications to export</span>
          <span className="text-xl font-black text-primary">{filtered.length}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-primary/60 hover:bg-primary/5 rounded-2xl transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onExport(filtered)}
            disabled={filtered.length === 0 || isBulkExporting}
            className="flex-[2] py-4 bg-primary text-secondary font-black text-[11px] uppercase tracking-widest rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            {isBulkExporting
              ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
              : <><FileDown size={14} /> Export {filtered.length} PDF{filtered.length !== 1 ? 's' : ''}</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Main ApplicationsView ─────────────────────────────────────────────────────

export default function ApplicationsView() {
  const { data: apps = [], isLoading, refetch } = useApplications();
  const updateStatusMutation = useUpdateApplicationStatus();

  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Bulk select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkExporting, setIsBulkExporting] = useState(false);

  // Reset pagination on filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, statusFilter, searchQuery]);

  if (selectedApp) {
    return <ApplicationDetailsView app={selectedApp} onBack={() => { setSelectedApp(null); refetch(); }} onUpdate={refetch} />;
  }

  const statusMetrics: Record<string, number> = {
    all: apps.filter((a: any) => a.academicYear === selectedYear).length,
    pending: apps.filter((a: any) => ['pending', 'assessment_scheduled'].includes(a.status) && a.academicYear === selectedYear).length,
    passed_assessment: apps.filter((a: any) => ['passed_assessment', 'interview_scheduled'].includes(a.status) && a.academicYear === selectedYear).length,
    accepted: apps.filter((a: any) => a.status === 'accepted' && a.academicYear === selectedYear).length,
    rejected: apps.filter((a: any) => a.status === 'rejected' && a.academicYear === selectedYear).length,
    failed: apps.filter((a: any) => a.status === 'failed' && a.academicYear === selectedYear).length,
    waitlisted: apps.filter((a: any) => a.status === 'waitlisted' && a.academicYear === selectedYear).length,
  };

  const filteredApps = apps.filter((app: any) => {
    const matchesYear = app.academicYear === selectedYear;
    let matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    if (statusFilter === 'pending') matchesStatus = ['pending', 'assessment_scheduled'].includes(app.status);
    if (statusFilter === 'passed_assessment') matchesStatus = ['passed_assessment', 'interview_scheduled'].includes(app.status);
    const matchesSearch = !searchQuery || app.candidate?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || app.id.toString().includes(searchQuery);
    return matchesYear && matchesStatus && matchesSearch;
  }).sort((a: any, b: any) => b.id - a.id);

  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const allVisibleSelected = paginatedApps.length > 0 && paginatedApps.every((a: any) => selectedIds.has(a.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedApps.map((a: any) => a.id)));
    }
  };

  const toggleSelectApp = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleExportZIPClick = () => {
    if (selectedIds.size > 0) {
      // Has selections — skip modal, export immediately
      const toExport = apps.filter((a: any) => selectedIds.has(a.id));
      runBulkExport(toExport);
    } else {
      // No selections — open filter modal
      setIsBulkModalOpen(true);
    }
  };

  const runBulkExport = async (appsToExport: any[]) => {
    if (appsToExport.length === 0) return;
    setIsBulkExporting(true);
    setIsBulkModalOpen(false);
    const toastId = (window as any).__toast?.loading?.('Generating ZIP archive...') ?? null;

    try {
      const zip = new JSZip();
      for (const app of appsToExport) {
        const doc = await buildApplicationPDF(app);
        const name = app.candidate?.fullName?.replace(/\s+/g, '_') || `APP_${app.id}`;
        const pdfBlob = doc.output('arraybuffer');
        zip.file(`APP-${app.id.toString().padStart(4, '0')}_${name}.pdf`, pdfBlob);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Kianda_Applications_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      // Reset selection
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } catch (err) {
      console.error('Bulk export failed', err);
    } finally {
      setIsBulkExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader
        title="Applications"
        description="Manage and review student submissions."
        icon={Users}
      >
        <div className="flex flex-col gap-4 w-full lg:w-auto">
          {/* Row 1: Year, Search, Bulk controls */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            {/* Year selector */}
            <div className="relative group/year w-full md:w-48">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="appearance-none w-full bg-white px-5 py-4 rounded-2xl font-black text-primary border border-outline-variant/10 focus:ring-4 focus:ring-primary/5 cursor-pointer transition-all pr-10 shadow-sm text-xs"
              >
                {Array.from({ length: 5 }, (_, i) => 2026 + i).map(year => (
                  <option key={year} value={year}>Academic Year {year}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none" />
            </div>

            {/* Search */}
            <div className="relative group/search flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within/search:text-primary transition-colors" size={16} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-outline-variant/10 rounded-2xl text-xs font-black placeholder:text-primary/20 focus:ring-4 focus:ring-primary/5 transition-all w-full shadow-sm"
                placeholder="Find a student by name or Application ID..."
              />
            </div>

            {/* Select toggle */}
            <button
              onClick={() => { setIsSelectMode(v => !v); setSelectedIds(new Set()); }}
              className={`flex items-center gap-2 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-sm ${
                isSelectMode
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-primary/60 border-outline-variant/10 hover:border-primary/30 hover:text-primary'
              }`}
            >
              <CheckSquare size={14} />
              {isSelectMode ? `${selectedIds.size} Selected` : 'Select'}
            </button>

            {/* Export ZIP */}
            <button
              onClick={handleExportZIPClick}
              disabled={isBulkExporting}
              className="flex items-center gap-2 px-5 py-4 bg-primary text-secondary rounded-2xl text-[10px] font-black uppercase tracking-widest border border-transparent hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
            >
              {isBulkExporting
                ? <Loader2 size={14} className="animate-spin" />
                : <Archive size={14} />}
              Export ZIP
            </button>
          </div>

          {/* Row 2: Status filter pills */}
          <div className="flex items-center gap-2 bg-primary/5 p-1.5 rounded-2xl border border-primary/10 overflow-x-auto max-w-full hide-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'passed_assessment', label: 'Passed' },
              { id: 'waitlisted', label: 'Waitlist' },
              { id: 'failed', label: 'Failed' },
              { id: 'accepted', label: 'Accepted' },
              { id: 'rejected', label: 'Rejected' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-white shadow-lg text-primary scale-105'
                    : 'text-primary/40 hover:text-primary hover:bg-white/50'
                }`}
              >
                {f.label}
                {statusMetrics[f.id] > 0 && (
                  <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[8px] font-black ${statusFilter === f.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary/40'}`}>
                    {statusMetrics[f.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </AdminPageHeader>

      <div className="bg-white rounded-[32px] shadow-2xl shadow-primary/5 overflow-hidden border border-outline-variant/5 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-primary/20" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[1600px]">
            <thead className="bg-surface-container-low/50 border-b border-outline-variant/10">
              <tr>
                <th className="pl-6 pr-2 py-5 w-10">
                  <AnimatePresence>
                    {isSelectMode && (
                      <motion.button
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={toggleSelectAll}
                        className="text-primary/40 hover:text-primary transition-colors whitespace-normal"
                        title={allVisibleSelected ? 'Deselect all' : 'Select all visible'}
                      >
                        {allVisibleSelected
                          ? <CheckSquare size={16} className="text-secondary" />
                          : <Square size={16} />}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40">Candidate</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40">DOB (Age)</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40">Religion</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40">Grade</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40">Parent Info</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40">Prev. Schools</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40">Motivation</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40">Code</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40">Status</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40">Date</th>
                <th className="px-6 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {paginatedApps.map((app: any) => (
                <ApplicationRow
                  key={app.id}
                  app={app}
                  isSelectMode={isSelectMode}
                  isSelected={selectedIds.has(app.id)}
                  onToggleSelect={(e) => { e.stopPropagation(); toggleSelectApp(app.id); }}
                  onViewDetails={() => setSelectedApp(app)}
                />
              ))}
              {!isLoading && filteredApps.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center text-sm font-bold text-primary opacity-20 italic">
                    No applications match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <TablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredApps.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Bulk Export Modal */}
      <AnimatePresence>
        {isBulkModalOpen && (
          <BulkExportModal
            apps={apps}
            onClose={() => setIsBulkModalOpen(false)}
            onExport={runBulkExport}
            isBulkExporting={isBulkExporting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Users, GraduationCap, Calendar, LogOut, ListChecks, FileText, CreditCard, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import DashboardView from './admin/views/DashboardView';
import ApplicationsView from './admin/views/ApplicationsView';
import GradesView from './admin/views/GradesView';
import InterviewsView from './admin/views/InterviewsView';
import AssessmentBookView from './admin/views/AssessmentBookView';
import ProcessDocumentsView from './admin/views/ProcessDocumentsView';
import PaymentsView from './admin/views/PaymentsView';
import { AdminProvider, useAdminContext, AdminTab } from '../context/AdminContext';
import { adminLogout } from '../utils/auth';
import { useCycles } from '../hooks/useAdminData';

// ── Sidebar nav items ─────────────────────────────────────────────────────────

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',    label: 'Dashboard',         icon: LayoutDashboard },
  { id: 'applications', label: 'Applications',       icon: Users },
  { id: 'grades',       label: 'Grade Management',   icon: GraduationCap },
  { id: 'assessments',  label: 'Assessments',        icon: ListChecks },
  { id: 'interviews',   label: 'Interviews',         icon: Calendar },
  { id: 'payments',     label: 'Payments',           icon: CreditCard },
  { id: 'documents',    label: 'Process Documents',  icon: FileText },
];

// ── Inner layout (must be inside AdminProvider) ───────────────────────────────

function AdminLayout({ onLogout, onViewPortal }: { onLogout: () => void; onViewPortal?: () => void }) {
  const { state, setActiveTab, toggleSidebar, setPreSelectedGradeId } = useAdminContext();
  const { activeTab, isSidebarCollapsed } = state;
  const { data: cycles = [] } = useCycles();

  const activeAcademicYear = React.useMemo(() => {
    if (!cycles || cycles.length === 0) return new Date().getFullYear();
    const now = new Date();
    // Prioritize active cycle within current date range, then any active cycle, then most recent cycle
    const currentActive = cycles.find((c: any) => c.isActive && now >= new Date(c.startDate) && now <= new Date(c.endDate));
    if (currentActive) return currentActive.academicYear;
    const active = cycles.find((c: any) => c.isActive);
    if (active) return active.academicYear;
    const sorted = [...cycles].sort((a: any, b: any) => b.academicYear - a.academicYear);
    return sorted[0]?.academicYear || new Date().getFullYear();
  }, [cycles]);

  const handleLogout = async () => {
    await adminLogout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <motion.div
        animate={{ width: isSidebarCollapsed ? 80 : 300 }}
        className="sticky top-0 h-screen bg-white flex flex-col py-6 shadow-[10px_0_40px_rgba(0,0,0,0.02)] relative z-20 border-r border-outline-variant/5"
      >
        {/* Logo */}
        <div className={`flex items-center mb-8 px-6 ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <img
            src="/kianda-school-logo-removebg-preview.png"
            alt="Logo"
            className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-9 h-9' : 'w-10 h-10'}`}
          />
          {!isSidebarCollapsed && (
            <div className="font-headline font-black text-lg text-primary tracking-tight whitespace-nowrap">
              Admissions Portal
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-grow px-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <div key={item.id} className="relative group/tooltip">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 font-bold group cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-secondary text-primary shadow-lg shadow-secondary/20'
                    : 'text-primary/75 hover:bg-secondary-container/30 hover:text-primary'
                }`}
              >
                <div className="flex-shrink-0">
                  <item.icon size={20} className={activeTab === item.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 text-primary'} />
                </div>
                {!isSidebarCollapsed && (
                  <span className="text-[13px] tracking-wide whitespace-nowrap">{item.label}</span>
                )}
              </button>
              {isSidebarCollapsed && (
                <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-white text-primary text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-2xl border border-outline-variant/10 group-hover/tooltip:translate-x-1">
                  {item.label}
                </div>
              )}
            </div>
          ))}
        </nav>
      </motion.div>

      {/* Main column with persistent Top Navigation Bar */}
      <div className="flex-grow flex flex-col h-screen overflow-hidden">
        {/* Admin Top Navigation Bar */}
        <header className="h-16 px-6 md:px-8 bg-white/90 backdrop-blur-md border-b border-outline-variant/10 flex items-center justify-between shrink-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Collapse toggle button */}
            <button
              onClick={toggleSidebar}
              className="p-2.5 hover:bg-surface-container-low text-primary/70 hover:text-primary rounded-xl transition-all cursor-pointer flex items-center justify-center border border-outline-variant/10 hover:border-outline-variant/25 shadow-xs"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            {/* Academic Year display */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-primary/80 font-headline">
                Academic Year {activeAcademicYear}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Button 1: View Application Form */}
            {onViewPortal && (
              <button
                onClick={onViewPortal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 transition-all shadow-sm hover:shadow cursor-pointer group"
              >
                <FileText size={15} className="text-secondary flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span>View Application Form</span>
              </button>
            )}

            {/* Button 2: Sign Out */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-200/60 transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <LogOut size={15} className="flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content area — views are kept mounted with CSS visibility to preserve local state */}
        <div className="flex-grow p-8 md:p-12 overflow-y-auto bg-surface-container-lowest/30">
          <div style={{ display: activeTab === 'dashboard'    ? 'block' : 'none' }}><DashboardView /></div>
          <div style={{ display: activeTab === 'applications' ? 'block' : 'none' }}><ApplicationsView /></div>
          <div style={{ display: activeTab === 'grades'       ? 'block' : 'none' }}>
            <GradesView onGoToAssessments={(gradeId) => {
              setPreSelectedGradeId(gradeId);
              setActiveTab('assessments');
            }} />
          </div>
          <div style={{ display: activeTab === 'assessments'  ? 'block' : 'none' }}><AssessmentBookView initialGradeId={state.preSelectedGradeId} /></div>
          <div style={{ display: activeTab === 'interviews'   ? 'block' : 'none' }}><InterviewsView /></div>
          <div style={{ display: activeTab === 'documents'    ? 'block' : 'none' }}><ProcessDocumentsView /></div>
          <div style={{ display: activeTab === 'payments'     ? 'block' : 'none' }}><PaymentsView /></div>
        </div>
      </div>
    </div>
  );
}

// ── Public export — wraps with Provider ──────────────────────────────────────

export function AdminDashboard({ onLogout, onViewPortal }: { onLogout: () => void; onViewPortal?: () => void }) {
  return (
    <AdminProvider>
      <AdminLayout onLogout={onLogout} onViewPortal={onViewPortal} />
    </AdminProvider>
  );
}

// Keep old export for backward compat (not used after App.tsx is updated)
export function AdminContentView() {
  return null;
}

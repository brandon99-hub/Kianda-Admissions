import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Users, GraduationCap, Calendar, LogOut, ListChecks, FileText, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardView from './admin/views/DashboardView';
import ApplicationsView from './admin/views/ApplicationsView';
import GradesView from './admin/views/GradesView';
import InterviewsView from './admin/views/InterviewsView';
import AssessmentBookView from './admin/views/AssessmentBookView';
import ProcessDocumentsView from './admin/views/ProcessDocumentsView';
import PaymentsView from './admin/views/PaymentsView';
import { AdminProvider, useAdminContext, AdminTab } from '../context/AdminContext';
import { adminLogout } from '../utils/auth';

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

function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const { state, setActiveTab, toggleSidebar, setPreSelectedGradeId } = useAdminContext();
  const { activeTab, isSidebarCollapsed } = state;

  const handleLogout = async () => {
    await adminLogout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <motion.div
        animate={{ width: isSidebarCollapsed ? 80 : 300 }}
        className="sticky top-0 h-screen bg-white flex flex-col py-8 shadow-[10px_0_40px_rgba(0,0,0,0.02)] relative z-20 border-r border-outline-variant/5"
      >
        {/* Logo + collapse button */}
        <div className={`flex items-center justify-between mb-12 px-6 ${isSidebarCollapsed ? 'flex-col gap-4' : ''}`}>
          <div className="flex items-center gap-3">
            <img
              src="/kianda-school-logo-removebg-preview.png"
              alt="Logo"
              className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}
            />
            {!isSidebarCollapsed && (
              <div className="font-headline font-black text-lg text-primary tracking-tight">Admissions Portal</div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-secondary-container rounded-lg text-primary transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-grow px-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <div key={item.id} className="relative group/tooltip">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 font-bold group ${
                  activeTab === item.id
                    ? 'bg-secondary text-primary shadow-lg shadow-secondary/20'
                    : 'text-on-surface-variant/40 hover:bg-secondary-container/30 hover:text-primary'
                }`}
              >
                <div className="flex-shrink-0">
                  <item.icon size={20} className={activeTab === item.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'} />
                </div>
                {!isSidebarCollapsed && (
                  <span className="text-[13px] tracking-wide whitespace-nowrap">{item.label}</span>
                )}
              </button>
              {isSidebarCollapsed && (
                <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-white text-primary text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-outline-variant/10 group-hover/tooltip:translate-x-1">
                  {item.label}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 pt-6 border-t border-outline-variant/10">
          <div className="relative group/tooltip">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant/30 hover:text-red-600 hover:bg-red-50 transition-all font-bold group"
            >
              <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
              {!isSidebarCollapsed && <span className="text-[13px] tracking-wide">Sign Out</span>}
            </button>
            {isSidebarCollapsed && (
              <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-white text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-red-100 group-hover/tooltip:translate-x-1">
                Sign Out
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content area — views are kept mounted with CSS visibility to preserve local state */}
      <div className="flex-grow p-12 overflow-y-auto bg-surface-container-lowest/30">
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
  );
}

// ── Public export — wraps with Provider ──────────────────────────────────────

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <AdminProvider>
      <AdminLayout onLogout={onLogout} />
    </AdminProvider>
  );
}

// Keep old export for backward compat (not used after App.tsx is updated)
export function AdminContentView() {
  return null;
}

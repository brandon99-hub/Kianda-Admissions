import React, { createContext, useContext, useReducer, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminTab = 'dashboard' | 'applications' | 'grades' | 'interviews' | 'assessments' | 'documents' | 'payments';

interface ApplicationsTabState {
  search: string;
  statusFilter: string;
  gradeFilter: string;
  page: number;
}

interface InterviewsTabState {
  search: string;
  activeTab: 'scheduled' | 'awaiting' | 'outcomes';
  page: number;
}

export interface AdminUIState {
  activeTab: AdminTab;
  selectedYear: number;
  isSidebarCollapsed: boolean;
  preSelectedGradeId: number | null;
  applications: ApplicationsTabState;
  interviews: InterviewsTabState;
}

type AdminAction =
  | { type: 'SET_TAB'; tab: AdminTab }
  | { type: 'SET_YEAR'; year: number }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_COLLAPSED'; collapsed: boolean }
  | { type: 'SET_PRE_SELECTED_GRADE'; gradeId: number | null }
  | { type: 'SET_APPLICATIONS_STATE'; payload: Partial<ApplicationsTabState> }
  | { type: 'SET_INTERVIEWS_STATE'; payload: Partial<InterviewsTabState> };

// ── Reducer ───────────────────────────────────────────────────────────────────

function adminReducer(state: AdminUIState, action: AdminAction): AdminUIState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_YEAR':
      return {
        ...state,
        selectedYear: action.year,
        // Reset pagination when year changes
        applications: { ...state.applications, page: 1 },
        interviews: { ...state.interviews, page: 1 },
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarCollapsed: !state.isSidebarCollapsed };
    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, isSidebarCollapsed: action.collapsed };
    case 'SET_PRE_SELECTED_GRADE':
      return { ...state, preSelectedGradeId: action.gradeId };
    case 'SET_APPLICATIONS_STATE':
      return {
        ...state,
        applications: { ...state.applications, ...action.payload },
      };
    case 'SET_INTERVIEWS_STATE':
      return {
        ...state,
        interviews: { ...state.interviews, ...action.payload },
      };
    default:
      return state;
  }
}

// ── Initial State ─────────────────────────────────────────────────────────────

function getInitialState(): AdminUIState {
  // Persist sidebar preference across page reloads
  const sidebarCollapsed = localStorage.getItem('kianda_sidebar_collapsed') === 'true';

  return {
    activeTab: 'dashboard',
    selectedYear: new Date().getFullYear(), // Always correct, never hardcoded
    isSidebarCollapsed: sidebarCollapsed,
    preSelectedGradeId: null,
    applications: { search: '', statusFilter: 'all', gradeFilter: 'all', page: 1 },
    interviews: { search: '', activeTab: 'scheduled', page: 1 },
  };
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AdminContextValue {
  state: AdminUIState;
  dispatch: React.Dispatch<AdminAction>;
  // Convenience helpers
  setActiveTab: (tab: AdminTab) => void;
  setSelectedYear: (year: number) => void;
  toggleSidebar: () => void;
  setPreSelectedGradeId: (id: number | null) => void;
  setApplicationsState: (payload: Partial<ApplicationsTabState>) => void;
  setInterviewsState: (payload: Partial<InterviewsTabState>) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, undefined, getInitialState);

  // Persist sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kianda_sidebar_collapsed', String(state.isSidebarCollapsed));
  }, [state.isSidebarCollapsed]);

  const value: AdminContextValue = {
    state,
    dispatch,
    setActiveTab: (tab) => dispatch({ type: 'SET_TAB', tab }),
    setSelectedYear: (year) => dispatch({ type: 'SET_YEAR', year }),
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    setPreSelectedGradeId: (gradeId) => dispatch({ type: 'SET_PRE_SELECTED_GRADE', gradeId }),
    setApplicationsState: (payload) => dispatch({ type: 'SET_APPLICATIONS_STATE', payload }),
    setInterviewsState: (payload) => dispatch({ type: 'SET_INTERVIEWS_STATE', payload }),
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdminContext must be used inside <AdminProvider>');
  return ctx;
}

import DashboardView from './admin/views/DashboardView';
import ApplicationsView from './admin/views/ApplicationsView';
import GradesView from './admin/views/GradesView';
import InterviewsView from './admin/views/InterviewsView';
import AssessmentBookView from './admin/views/AssessmentBookView';
import ProcessDocumentsView from './admin/views/ProcessDocumentsView';
import PaymentsView from './admin/views/PaymentsView';

interface AdminViewsProps {
  activeTab: 'dashboard' | 'applications' | 'grades' | 'interviews' | 'assessments' | 'documents' | 'payments';
  setView: (view: 'portal' | 'login' | 'admin') => void;
  setActiveTab: (tab: 'dashboard' | 'applications' | 'grades' | 'interviews' | 'assessments' | 'documents' | 'payments') => void;
  preSelectedGradeId: number | null;
  setPreSelectedGradeId: (id: number | null) => void;
}

export function AdminContentView({ activeTab, setActiveTab, preSelectedGradeId, setPreSelectedGradeId }: AdminViewsProps) {
  switch (activeTab) {
    case 'dashboard':
      return <DashboardView />;
    case 'applications':
      return <ApplicationsView />;
    case 'grades':
      return <GradesView onGoToAssessments={(gradeId) => {
        setPreSelectedGradeId(gradeId);
        setActiveTab('assessments');
      }} />;
    case 'interviews':
      return <InterviewsView />;
    case 'assessments':
      return <AssessmentBookView initialGradeId={preSelectedGradeId} />;
    case 'documents':
      return <ProcessDocumentsView />;
    case 'payments':
      return <PaymentsView />;
    default:
      return <DashboardView />;
  }
}

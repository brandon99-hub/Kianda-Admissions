import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import Stepper from './components/Stepper';
import CandidateInfoForm from './components/CandidateInfoForm';
import ParentInfoForm from './components/ParentInfoForm';
import AdditionalInfoForm from './components/AdditionalInfoForm';
import DocumentUploadForm from './components/DocumentUploadForm';
import PaymentConfirmationForm from './components/PaymentConfirmationForm';
import { ApplicationState, Step } from './types';
import { LayoutDashboard, Users, GraduationCap, Calendar, LogOut, Search, Filter, ArrowUpRight, Clock, MapPin, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';
import { AdminContentView } from './components/AdminViews';
import { saveToken, removeToken, isTokenValid } from './utils/auth';

const EXPIRY_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Hours

const INITIAL_STATE: ApplicationState = {
  currentStep: 'candidate',
  candidate: {
    grade: '', fullName: '', dob: '', religion: '', denomination: '', birthOrder: '', medicalInfo: '',
    schools: {
      kindergarten: { name: '', years: '' },
      primary: { name: '', years: '' },
      junior: { name: '', years: '' },
    }
  },
  parent: {
    fatherName: '', fatherPhone: '', fatherEmail: '', fatherProfession: '', fatherWork: '',
    motherName: '', motherPhone: '', motherEmail: '', motherProfession: '', motherWork: '',
  },
  additional: {
    siblings: [],
    motivation: '',
    source: '',
    hasAppliedBefore: false,
  },
  payment: {
    mpesaCode: '',
  },
  documents: {
    letter: '',
    birthCert: '',
    report: '',
  },
  consentGiven: false,
  lastUpdated: new Date().toISOString()
};

export default function App() {
  const [view, setView] = useState<'portal' | 'login' | 'admin'>('portal');
  const [state, setState] = useState<ApplicationState>(() => {
    const saved = localStorage.getItem('kianda_admission_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ApplicationState;
        const lastUpdated = new Date(parsed.lastUpdated).getTime();
        const now = new Date().getTime();
        
        if (now - lastUpdated < EXPIRY_DURATION_MS) {
          return parsed;
        } else {
          console.log('Stored state expired. Clearing...');
          localStorage.removeItem('kianda_admission_state');
        }
      } catch (e) {
        console.error('Failed to parse saved state');
      }
    }
    return INITIAL_STATE;
  });

  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'applications' | 'grades' | 'interviews' | 'assessments'>('dashboard');

  useEffect(() => {
    const stateToSave = { ...state, lastUpdated: new Date().toISOString() };
    localStorage.setItem('kianda_admission_state', JSON.stringify(stateToSave));
  }, [state]);

  // Session persistence check
  useEffect(() => {
    if (isTokenValid()) {
      setView('admin');
    }
  }, []);

  const resetApplication = () => {
    if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
      setState(INITIAL_STATE);
      localStorage.removeItem('kianda_admission_state');
    }
  };

  const updateState = (key: keyof Omit<ApplicationState, 'currentStep'>, data: any) => {
    setState(prev => ({
      ...prev,
      [key]: typeof data === 'object' && data !== null && !Array.isArray(data)
        ? { ...(prev[key] as object), ...data }
        : data,
      lastUpdated: new Date().toISOString()
    }));
  };

  const nextStep = () => {
    const steps: Step[] = ['candidate', 'parent', 'additional', 'documents', 'payment'];
    const currentIdx = steps.indexOf(state.currentStep);
    if (currentIdx < steps.length - 1) {
      setState(prev => ({ ...prev, currentStep: steps[currentIdx + 1], lastUpdated: new Date().toISOString() }));
    } else {
      submissionMutation.mutate(state);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['candidate', 'parent', 'additional', 'documents', 'payment'];
    const currentIdx = steps.indexOf(state.currentStep);
    if (currentIdx > 0) {
      setState(prev => ({ ...prev, currentStep: steps[currentIdx - 1], lastUpdated: new Date().toISOString() }));
    }
  };

  const submissionMutation = useMutation({
    mutationFn: async (payload: ApplicationState) => {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Submission failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Application submitted successfully! ID: ${data.applicationId}`);
      setState(INITIAL_STATE);
      localStorage.removeItem('kianda_admission_state');
    },
    onError: (error) => {
      console.error('Submission error:', error);
      toast.error('Failed to submit application. Please check your connection and try again.');
    }
  });

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (response.ok) {
        saveToken(data.token);
        toast.success(`Welcome back!`, { icon: '👋' });
        setView('admin');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Could not connect to server');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (view === 'login') return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #FFFFFF 0%, #F5D97A 100%)' }}>
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-secondary/15 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-3xl p-8 rounded-[40px] shadow-[0_50px_100px_-20px_rgba(24,33,109,0.15)] w-full max-w-md border border-white/50 relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-secondary/20 rounded-full blur-2xl animate-pulse" />
            <img 
              src="/kianda-school-logo-removebg-preview.png" 
              alt="Kianda School Logo" 
              className="w-16 h-16 object-contain relative z-10 drop-shadow-xl"
            />
          </div>
          <h2 className="text-4xl font-headline font-extrabold text-primary mb-3 tracking-tight">School Admin</h2>
          <p className="text-[13px] text-on-surface-variant font-semibold uppercase tracking-[0.2em] opacity-60">Authentication Required</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-primary/60 ml-1">Email</label>
            <input 
              value={loginForm.email}
              onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-white/50 backdrop-blur-sm p-4 rounded-[18px] border border-white/50 font-semibold focus:ring-4 focus:ring-secondary/20 focus:bg-white transition-all shadow-inner placeholder:opacity-30" 
              placeholder="registrar@kianda.school" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-primary/60 ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-white/50 backdrop-blur-sm p-4 rounded-[18px] border border-white/50 font-semibold focus:ring-4 focus:ring-secondary/20 focus:bg-white transition-all shadow-inner placeholder:opacity-30 pr-12" 
                placeholder="••••••••" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className={`w-full py-5 rounded-[18px] font-black shadow-[0_15px_30px_rgba(255,196,37,0.3)] hover:shadow-[0_20px_40px_rgba(255,196,37,0.4)] hover:-translate-y-1 active:scale-[0.98] transition-all mt-4 relative overflow-hidden group ${isLoggingIn ? 'bg-secondary/50 text-primary/50' : 'bg-secondary text-primary'}`}
          >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
             <span className="tracking-[0.2em] uppercase text-[11px] relative z-10">
               {isLoggingIn ? (
                 <div className="flex items-center justify-center gap-2">
                   <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                   Processing...
                 </div>
               ) : 'Sign In'}
             </span>
          </button>
          
          <button 
            onClick={() => setView('portal')} 
            className="w-full text-[9px] font-extrabold uppercase tracking-[0.3em] text-on-surface-variant/30 hover:text-primary transition-all mt-6"
          >
            Return to Portal
          </button>
        </div>

      </motion.div>
    </div>
  );



  if (view === 'admin') return (
    <div className="min-h-screen bg-surface flex">
      {/* Redesigned Sidebar - White BG, Collapsible */}
      <motion.div 
        animate={{ width: isSidebarCollapsed ? 80 : 300 }}
        className="sticky top-0 h-screen bg-white flex flex-col py-8 shadow-[10px_0_40px_rgba(0,0,0,0.02)] relative z-20 border-r border-outline-variant/5"
      >
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
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 hover:bg-secondary-container rounded-lg text-primary transition-colors"
           >
              {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
           </button>
        </div>
        
        <nav className="flex-grow px-3 space-y-1">
           {[
             { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
             { id: 'applications', label: 'Applications', icon: Users },
             { id: 'grades', label: 'Grade Management', icon: GraduationCap },
             { id: 'assessments', label: 'Assessments', icon: ListChecks },
             { id: 'interviews', label: 'Interviews', icon: Calendar },
           ].map(item => (
             <div key={item.id} className="relative group/tooltip">
               <button
                 onClick={() => setActiveAdminTab(item.id as any)}
                 className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 font-bold group ${
                   activeAdminTab === item.id 
                   ? 'bg-secondary text-primary shadow-lg shadow-secondary/20' 
                   : 'text-on-surface-variant/40 hover:bg-secondary-container/30 hover:text-primary'
                 }`}
               >
                  <div className="flex-shrink-0">
                    <item.icon size={20} className={activeAdminTab === item.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'} />
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

        <div className="px-3 pt-6 border-t border-outline-variant/10">
           <div className="relative group/tooltip">
             <button 
               onClick={() => {
                 removeToken();
                 setView('portal');
               }} 
               className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-on-surface-variant/30 hover:text-red-600 hover:bg-red-50 transition-all font-bold group"
             >
                <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                {!isSidebarCollapsed && (
                  <span className="text-[13px] tracking-wide">Sign Out</span>
                )}
             </button>

             {isSidebarCollapsed && (
               <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-white text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-red-100 group-hover/tooltip:translate-x-1">
                  Sign Out
               </div>
             )}
           </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="flex-grow p-12 overflow-y-auto bg-surface-container-lowest/30">
        <AdminContentView activeTab={activeAdminTab} setView={setView} setActiveTab={setActiveAdminTab} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header onAdminClick={() => setView('login')} />
      
      <main className="flex-grow max-w-5xl mx-auto px-8 mt-16 w-full pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-2">
                Student Admission
              </h1>
              <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Join a legacy of excellence and character at Kianda School.
              </p>
            </div>
          </div>
        </motion.div>

        <Stepper currentStep={state.currentStep} />

        <div className="mt-12">
          <AnimatePresence mode="wait">
            {state.currentStep === 'candidate' && (
              <motion.div key="candidate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <CandidateInfoForm 
                  data={state.candidate}
                  updateData={(d) => updateState('candidate', d)}
                  onNext={nextStep}
                  onCancel={resetApplication}
                />
              </motion.div>
            )}
            {state.currentStep === 'parent' && (
              <motion.div key="parent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ParentInfoForm 
                  data={state.parent}
                  updateData={(d) => updateState('parent', d)}
                  onNext={nextStep}
                  onBack={prevStep}
                  onCancel={resetApplication}
                />
              </motion.div>
            )}
            {state.currentStep === 'additional' && (
              <motion.div key="additional" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <AdditionalInfoForm 
                  data={state.additional}
                  updateData={(d) => updateState('additional', d)}
                  onNext={nextStep}
                  onBack={prevStep}
                  onCancel={resetApplication}
                />
              </motion.div>
            )}
            {state.currentStep === 'documents' && (
              <motion.div key="documents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <DocumentUploadForm 
                  onNext={nextStep}
                  onBack={prevStep}
                  onCancel={resetApplication}
                  candidateName={state.candidate.fullName}
                  consentGiven={state.consentGiven}
                  onConsentChange={(val) => updateState('consentGiven', val)}
                  uploads={state.documents}
                  onUploadChange={(val) => updateState('documents', val)}
                />
              </motion.div>
            )}
            {state.currentStep === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <PaymentConfirmationForm 
                  data={state.payment}
                  updateData={(d) => updateState('payment', d)}
                  onSubmit={nextStep}
                  onBack={prevStep}
                  onCancel={resetApplication}
                  candidateName={state.candidate.fullName}
                  isSubmitting={submissionMutation.isPending}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import Stepper from './components/Stepper';
import CandidateInfoForm from './components/CandidateInfoForm';
import ParentInfoForm from './components/ParentInfoForm';
import AdditionalInfoForm from './components/AdditionalInfoForm';
import DocumentUploadForm from './components/DocumentUploadForm';
import PaymentConfirmationForm from './components/PaymentConfirmationForm';
import PaymentPolling from './components/PaymentPolling';
import { ApplicationState, Step } from './types';
import { LayoutDashboard, Users, GraduationCap, Calendar, LogOut, Search, Filter, ArrowUpRight, Clock, MapPin, ListChecks, FileText, CreditCard } from 'lucide-react';
import { AdminDashboard } from './components/AdminViews';
import { saveToken, removeToken, isTokenValid, isApplicantTokenValid, removeApplicantToken, getApplicantToken } from './utils/auth';
import ApplicantLogin from './components/ApplicantLogin';
import ApplicantDashboard from './components/ApplicantDashboard';

const EXPIRY_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Hours

const INITIAL_STATE: ApplicationState = {
  currentStep: 'candidate',
  candidate: {
    grade: '', fullName: '', dob: '', religion: '', denomination: '', birthOrder: '', medicalInfo: '', assessmentNo: '', passportPhoto: '',
    schools: []
  },
  parent: {
    fatherName: '', fatherPhone: '', fatherEmail: '', fatherProfession: '', fatherWork: '', fatherAltContactName: '', fatherAltContactPhone: '', fatherAltContactRelation: '',
    motherName: '', motherPhone: '', motherEmail: '', motherProfession: '', motherWork: '', motherAltContactName: '', motherAltContactPhone: '', motherAltContactRelation: '',
    residency: '',
  },
  additional: {
    siblings: [],
    motivation: '',
    source: '',
    hasAppliedBefore: false,
    previousApplicationYears: []
  },
  payment: {
    mpesaCode: '',
    paymentMethod: 'stk',
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
  const [view, setView] = useState<'portal' | 'login' | 'admin' | 'applicant-login' | 'applicant-dashboard'>('portal');
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

  const [showCancelModal, setShowCancelModal] = useState(false);
  const pendingAppIdRef = useRef<number | null>(null); // Synchronous ref — survives React batch state updates

  useEffect(() => {
    const stateToSave = { ...state, lastUpdated: new Date().toISOString() };
    localStorage.setItem('kianda_admission_state', JSON.stringify(stateToSave));
  }, [state]);

  // Session persistence check
  useEffect(() => {
    if (isTokenValid()) {
      setView('admin');
    } else if (isApplicantTokenValid()) {
      setView('applicant-dashboard');
    }
  }, []);

  const resetApplication = () => {
    setShowCancelModal(true);
  };

  const confirmResetApplication = () => {
    pendingAppIdRef.current = null; // Clear the ref on reset
    setState(INITIAL_STATE);
    localStorage.removeItem('kianda_admission_state');
    setShowCancelModal(false);
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
    if (state.currentStep === 'payment') {
      submissionMutation.mutate(state);
      return;
    }
    const currentIdx = steps.indexOf(state.currentStep as Step);
    if (currentIdx !== -1 && currentIdx < steps.length - 1) {
      setState(prev => ({ 
        ...prev, 
        currentStep: steps[currentIdx + 1], 
        highestStepIdx: Math.max(prev.highestStepIdx || 0, currentIdx + 1),
        lastUpdated: new Date().toISOString() 
      }));
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['candidate', 'parent', 'additional', 'documents', 'payment'];
    const currentIdx = steps.indexOf(state.currentStep);
    if (currentIdx > 0) {
      setState(prev => ({ ...prev, currentStep: steps[currentIdx - 1], lastUpdated: new Date().toISOString() }));
    }
  };

  const jumpToStep = (step: Step) => {
    setState(prev => ({ ...prev, currentStep: step, lastUpdated: new Date().toISOString() }));
  };

  const submissionMutation = useMutation({
    mutationFn: async (payload: ApplicationState) => {
      // Strip the local base64 preview — the photo is already on the server
      // from the /api/upload call. Sending it again causes a 413 Payload Too Large.
      const cleanPayload = {
        ...payload,
        candidate: {
          ...payload.candidate,
          passportPhotoPreview: undefined,
        },
      };
      const token = getApplicantToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers,
        body: JSON.stringify(cleanPayload),
      });
      if (!response.ok) {
        let errStr = 'Submission failed';
        try {
          const errData = await response.json();
          errStr = errData.details || errData.error || errStr;
        } catch (e) {}
        throw new Error(errStr);
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Store applicationId synchronously in a ref BEFORE any state updates.
      // React batches all setState calls in this block — so state.payment.applicationId
      // won't be visible until the NEXT render. The ref is always current.
      pendingAppIdRef.current = data.applicationId;

      if (data.checkoutRequestId) {
        updateState('payment', { ...state.payment, checkoutRequestId: data.checkoutRequestId, applicationId: data.applicationId });
        jumpToStep('payment_polling');
      } else {
        // Manual payment path — already verified server-side, go straight to success screen
        updateState('payment', { ...state.payment, applicationId: data.applicationId });
        jumpToStep('payment_polling');
      }
    },
    onError: (error) => {
      console.error('Submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit application. Please try again.');
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



  if (view === 'applicant-login') return (
    <ApplicantLogin
      onLoginSuccess={() => setView('applicant-dashboard')}
      onBack={() => setView('portal')}
    />
  );

  if (view === 'applicant-dashboard') return (
    <ApplicantDashboard
      onLogout={() => setView('portal')}
      onNewApplication={() => { confirmResetApplication(); setView('portal'); }}
    />
  );

  if (view === 'admin') return (
    <AdminDashboard onLogout={() => setView('portal')} />
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header 
        onAdminClick={() => setView('login')} 
        onApplicantLoginClick={() => {
          if (isApplicantTokenValid()) {
            setView('applicant-dashboard');
          } else {
            setView('applicant-login');
          }
        }} 
        isApplicantLoggedIn={isApplicantTokenValid()}
      />
      
      <main className="flex-grow max-w-5xl mx-auto px-4 md:px-8 mt-16 w-full pb-20">
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

        <Stepper 
          currentStep={state.currentStep} 
          highestStepIdx={state.highestStepIdx || 0}
          onStepClick={jumpToStep}
        />

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
                  fullState={state}
                  updateData={(d) => updateState('payment', d)}
                  onSubmit={nextStep}
                  onBack={prevStep}
                  onCancel={resetApplication}
                  jumpToStep={jumpToStep}
                  candidateName={state.candidate.fullName}
                  isSubmitting={submissionMutation.isPending}
                />
              </motion.div>
            )}
            {state.currentStep === 'payment_polling' && (
              <motion.div key="polling" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <PaymentPolling 
                  applicationId={(pendingAppIdRef.current || state.payment.applicationId)!}
                  phoneNumber={state.payment.phoneNumber}
                  parentEmail={state.parent.fatherEmail || state.parent.motherEmail}
                  alreadyVerified={!state.payment.checkoutRequestId} // manual payment = already verified
                  onSuccess={() => {
                    toast.success('Application submitted successfully! Please check your email for the next steps.');
                    setState(INITIAL_STATE);
                    localStorage.removeItem('kianda_admission_state');
                    if (isApplicantTokenValid()) setView('applicant-dashboard');
                  }}
                  onBack={() => jumpToStep('payment')}
                  onCancel={resetApplication}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />

      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[200] flex flex-col justify-end md:justify-center items-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowCancelModal(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full md:max-w-md bg-surface-container-lowest border border-outline-variant/10 rounded-t-3xl md:rounded-[24px] p-8 md:p-10 shadow-2xl z-10"
            >
              <div className="w-12 h-1.5 bg-outline-variant/20 rounded-full mx-auto mb-6 md:hidden" />
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-primary mb-3">Cancel Application?</h3>
                <p className="text-sm font-medium text-on-surface-variant mb-8 leading-relaxed">
                  This will permanently clear your current progress and remove all stored data from your browser's local storage. You will need to start over.
                </p>
                <div className="flex flex-col md:flex-row w-full gap-4">
                  <button 
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest text-on-surface-variant bg-surface-container-low hover:text-primary transition-all order-2 md:order-1"
                  >
                    Keep Editing
                  </button>
                  <button 
                    onClick={confirmResetApplication}
                    className="flex-1 px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all order-1 md:order-2"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

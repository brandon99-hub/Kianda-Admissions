import { UserCircle, LogIn } from 'lucide-react';

interface Props {
  onAdminClick: () => void;
  onApplicantLoginClick: () => void;
  isApplicantLoggedIn?: boolean;
}

export default function Header({ onAdminClick, onApplicantLoginClick, isApplicantLoggedIn }: Props) {
  return (
    <header className="w-full py-4 px-4 md:py-6 md:px-8 border-b border-outline-variant/10 bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src="/kianda-school-logo-removebg-preview.png" 
            alt="Kianda School Logo" 
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-bold tracking-tighter text-primary font-headline">
              Kianda School
            </span>
            <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mt-0.5 font-sans font-medium">
              Admissions Portal
            </p>
          </div>
        </div>

        
        <div className="flex items-center gap-2 md:gap-4">
          {/* Parent/Applicant Login */}
          <button 
            onClick={onApplicantLoginClick}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.1em] md:tracking-[0.2em] text-secondary hover:bg-secondary/5 rounded-xl transition-all border border-secondary/20 shadow-sm hover:shadow-md cursor-pointer group"
          >
            {isApplicantLoggedIn ? <UserCircle size={14} className="group-hover:text-primary transition-colors" /> : <LogIn size={14} className="group-hover:text-primary transition-colors" />}
            <span className="hidden sm:inline">{isApplicantLoggedIn ? 'Dashboard' : 'My Application'}</span>
          </button>

          {/* Admin Area */}
          {!isApplicantLoggedIn && (
            <button 
              onClick={onAdminClick}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.1em] md:tracking-[0.2em] text-primary hover:bg-primary/5 rounded-xl transition-all border border-primary/10 shadow-sm hover:shadow-md"
            >
              <UserCircle size={16} />
              <span className="hidden sm:inline">Admin Area</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}

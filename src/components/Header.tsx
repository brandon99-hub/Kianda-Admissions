import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCircle, LogIn, LogOut, Shield, LayoutDashboard, ChevronDown } from 'lucide-react';

interface Props {
  onAdminClick: () => void;
  onApplicantLoginClick: () => void;
  onDashboardClick?: () => void;
  onReturnToAdmin?: () => void;
  onLogout?: () => void;
  onLogoClick?: () => void;
  userRole?: 'admin' | 'applicant' | null;
  userEmail?: string | null;
  isApplicantLoggedIn?: boolean;
}

export default function Header({
  onAdminClick,
  onApplicantLoginClick,
  onDashboardClick,
  onReturnToAdmin,
  onLogout,
  onLogoClick,
  userRole,
  userEmail,
  isApplicantLoggedIn,
}: Props) {
  const isApplicant = userRole === 'applicant' || Boolean(isApplicantLoggedIn);
  const isAdmin = userRole === 'admin';
  const isLoggedIn = isApplicant || isAdmin;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <header className="w-full py-4 px-4 md:py-6 md:px-8 border-b border-outline-variant/10 bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          onClick={onLogoClick} 
          className={`flex items-center gap-4 ${onLogoClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
        >
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

        {/* Dynamic Auth Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {isLoggedIn ? (
            /* Logged-In User Profile Dropdown (Applicants & Admins) */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center gap-2.5 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-surface-container-low/70 hover:bg-surface-container-low border border-outline-variant/15 hover:border-primary/20 transition-all cursor-pointer shadow-sm group"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                  {isAdmin ? <Shield size={14} className="text-secondary" /> : <UserCircle size={15} className="text-secondary" />}
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-primary max-w-[130px] sm:max-w-[180px] truncate leading-tight">
                    {userEmail || (isAdmin ? 'Admin Session' : 'My Account')}
                  </span>
                  <span className="text-[8px] font-extrabold uppercase tracking-wider text-secondary leading-tight mt-0.5">
                    {isAdmin ? 'Administrator' : 'Applicant'}
                  </span>
                </div>

                <ChevronDown 
                  size={14} 
                  className={`text-on-surface-variant transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} 
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-[0_20px_40px_rgba(24,33,109,0.12)] border border-outline-variant/10 py-2 z-50 overflow-hidden"
                  >
                    {/* Header info */}
                    <div className="px-4 py-2.5 border-b border-outline-variant/10 bg-surface-container-lowest/50">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-on-surface-variant/60">Signed in as</p>
                      <p className="text-xs font-bold text-primary truncate mt-0.5">{userEmail || (isAdmin ? 'Administrator' : 'Applicant')}</p>
                    </div>

                    {/* Menu items */}
                    <div className="p-1 space-y-0.5">
                      {isAdmin ? (
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onReturnToAdmin?.();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/5 transition-all text-left group cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <Shield size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-primary">Admin Dashboard</span>
                            <span className="text-[9px] text-on-surface-variant/60 font-medium">Return to management panel</span>
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            if (onDashboardClick) onDashboardClick();
                            else onApplicantLoginClick();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/5 transition-all text-left group cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-secondary/20 flex items-center justify-center text-primary group-hover:bg-secondary transition-colors">
                            <LayoutDashboard size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-primary">Applicant Dashboard</span>
                            <span className="text-[9px] text-on-surface-variant/60 font-medium">View application status</span>
                          </div>
                        </button>
                      )}

                      {onLogout && (
                        <>
                          <div className="my-1 border-t border-outline-variant/10" />
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onLogout();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all text-left group cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                              <LogOut size={14} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-red-600">Sign Out</span>
                              <span className="text-[9px] text-red-400 font-medium">End your active session</span>
                            </div>
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Guest / Logged Out */
            <>
              <button 
                onClick={onApplicantLoginClick}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.1em] md:tracking-[0.2em] text-secondary hover:bg-secondary/5 rounded-xl transition-all border border-secondary/20 shadow-sm hover:shadow-md cursor-pointer group"
              >
                <LogIn size={14} className="group-hover:text-primary transition-colors" />
                <span className="hidden sm:inline">My Application</span>
              </button>

              <button 
                onClick={onAdminClick}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.1em] md:tracking-[0.2em] text-primary hover:bg-primary/5 rounded-xl transition-all border border-primary/10 shadow-sm hover:shadow-md cursor-pointer"
              >
                <Shield size={14} className="text-primary/70" />
                <span className="hidden sm:inline">Admin Area</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

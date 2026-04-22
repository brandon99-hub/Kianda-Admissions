import { UserCircle } from 'lucide-react';

interface Props {
  onAdminClick: () => void;
}

export default function Header({ onAdminClick }: Props) {
  return (
    <header className="w-full py-6 px-8 border-b border-outline-variant/10 bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src="/kianda-school-logo-removebg-preview.png" 
            alt="Kianda School Logo" 
            className="w-12 h-12 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tighter text-primary font-headline">
              Kianda School
            </span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mt-0.5 font-sans font-medium">
              Admissions Portal
            </p>
          </div>
        </div>

        
        <div className="flex items-center gap-8">
          <button 
            onClick={onAdminClick}
            className="flex items-center gap-2 px-6 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary hover:bg-primary/5 rounded-xl transition-all border border-primary/10 shadow-sm hover:shadow-md"
          >
            <UserCircle size={16} />
            Admin Area
          </button>
        </div>

      </div>
    </header>
  );
}

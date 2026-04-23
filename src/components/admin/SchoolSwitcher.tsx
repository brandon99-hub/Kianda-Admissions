import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface School {
  schoolType: string;
  schoolName: string;
  yearsRange?: string;
}

interface Props {
  schools: School[];
}

export default function SchoolSwitcher({ schools }: Props) {
  const [index, setIndex] = useState(0);

  if (!schools || schools.length === 0) {
    return <span className="text-xs italic opacity-30 px-2">No schools reg.</span>;
  }

  const current = schools[index];
  
  const getTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'kindergarten': return { label: 'K', color: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'primary': return { label: 'P', color: 'bg-green-50 text-green-600 border-green-100' };
      case 'junior': return { label: 'J', color: 'bg-amber-50 text-amber-600 border-amber-100' };
      default: return { label: 'S', color: 'bg-primary/5 text-primary/40 border-primary/10' };
    }
  };

  const badge = getTypeBadge(current.schoolType);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % schools.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + schools.length) % schools.length);
  };

  return (
    <div className="relative group/switcher min-h-[44px] flex flex-col justify-center max-w-[200px]" onClick={e => e.stopPropagation()}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 5 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -5 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg border text-[9px] font-black ${badge.color}`}>
            {badge.label}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-primary truncate" title={current.schoolName}>
              {current.schoolName}
            </span>
            {current.yearsRange && (
                <span className="text-[8px] font-bold text-primary/30 uppercase tracking-widest">{current.yearsRange}</span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {schools.length > 1 && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/switcher:opacity-100 transition-opacity flex flex-col gap-1">
          <button 
            onClick={handleNext}
            className="p-1 bg-white border border-outline-variant/10 rounded-full shadow-sm hover:text-secondary text-primary/40 transition-colors"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      )}
      
      {schools.length > 1 && (
        <div className="flex gap-1 mt-2">
            {schools.map((_, i) => (
                <div key={i} className={`h-0.5 rounded-full transition-all ${i === index ? 'w-3 bg-secondary' : 'w-1 bg-primary/10'}`} />
            ))}
        </div>
      )}
    </div>
  );
}

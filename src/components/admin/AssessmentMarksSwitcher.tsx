import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssessmentMark {
  assessmentTitle: string;
  marksObtained: number;
  maxMarks: number;
  passed: boolean;
}

interface Props {
  marks: AssessmentMark[];
}

export default function AssessmentMarksSwitcher({ marks }: Props) {
  const [index, setIndex] = useState(0);

  if (!marks || marks.length === 0) {
    return <span className="text-xs italic opacity-30 px-2">No marks</span>;
  }

  const current = marks[index];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % marks.length);
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
          <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border text-[10px] font-black ${current.passed ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            <FileText size={14} />
          </div>
          <div className="flex flex-col min-w-0 pr-4">
            <span className="text-xs font-bold text-primary truncate" title={current.assessmentTitle}>
              {current.assessmentTitle}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${current.passed ? 'text-green-600' : 'text-red-500'}`}>
               {current.marksObtained} <span className="opacity-40">/ {current.maxMarks}</span>
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {marks.length > 1 && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/switcher:opacity-100 transition-opacity flex flex-col gap-1">
          <button 
            onClick={handleNext}
            className="p-1 bg-white border border-outline-variant/10 rounded-full shadow-sm hover:text-secondary text-primary/40 transition-colors"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      )}
      
      {marks.length > 1 && (
        <div className="flex gap-1 mt-2">
            {marks.map((_, i) => (
                <div key={i} className={`h-0.5 rounded-full transition-all ${i === index ? 'w-3 bg-secondary' : 'w-1 bg-primary/10'}`} />
            ))}
        </div>
      )}
    </div>
  );
}

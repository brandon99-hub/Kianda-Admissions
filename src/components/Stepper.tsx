import { useEffect, useRef } from 'react';
import { Step } from '../types';

interface Props {
  currentStep: Step;
  highestStepIdx: number;
  onStepClick: (step: Step) => void;
  excludePayment?: boolean;
}

export default function Stepper({ currentStep, highestStepIdx, onStepClick, excludePayment }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const activeElement = containerRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentStep]);

  const steps: { id: Step; label: string; stepNum: string }[] = [
    { id: 'candidate', label: 'Candidate Info', stepNum: 'Step 01' },
    { id: 'parent', label: 'Parent Details', stepNum: 'Step 02' },
    { id: 'additional', label: 'Additional Info', stepNum: 'Step 03' },
    { id: 'documents', label: 'Documents', stepNum: 'Step 04' },
    { id: 'payment', label: 'Payment', stepNum: 'Step 05' },
  ] as { id: Step; label: string; stepNum: string }[];

  const filteredSteps = steps.filter(step => !(excludePayment && step.id === 'payment'));

  const currentIdx = filteredSteps.findIndex(s => s.id === currentStep);
  const gridCols = excludePayment ? 'md:grid-cols-4' : 'md:grid-cols-5';

  return (
    <div className="mb-12">
      <div className="w-full h-1 bg-surface-variant mb-10 flex rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-700 ease-in-out"
          style={{ width: `${((currentIdx + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div 
        ref={containerRef}
        className={`flex overflow-x-auto snap-x snap-mandatory gap-6 md:grid ${gridCols} md:gap-4 md:overflow-visible pb-4 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {filteredSteps.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isCompleted = idx < currentIdx;
          const isClickable = idx <= highestStepIdx;

          return (
            <button 
              key={step.id}
              data-active={isActive}
              onClick={() => {
                if (isClickable) onStepClick(step.id);
              }}
              disabled={!isClickable}
              className={`flex-shrink-0 w-[55%] snap-start md:w-auto flex flex-col gap-2 transition-all duration-300 text-left 
                ${isActive || isCompleted ? 'opacity-100' : 'opacity-30'} 
                ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isActive ? 'text-secondary' : 'text-on-surface-variant'}`}>
                {step.stepNum}
              </span>
              <span className={`text-xs font-bold tracking-tight ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                {step.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-secondary rounded-full mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

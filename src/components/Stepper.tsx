import { Step } from '../types';

interface Props {
  currentStep: Step;
}

export default function Stepper({ currentStep }: Props) {
  const steps: { id: Step; label: string; stepNum: string }[] = [
    { id: 'candidate', label: 'Candidate Info', stepNum: 'Step 01' },
    { id: 'parent', label: 'Parent Details', stepNum: 'Step 02' },
    { id: 'additional', label: 'Additional Info', stepNum: 'Step 03' },
    { id: 'documents', label: 'Documents', stepNum: 'Step 04' },
    { id: 'payment', label: 'Payment', stepNum: 'Step 05' },
  ];

  const currentIdx = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="mb-12">
      <div className="w-full h-1 bg-surface-variant mb-10 flex rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-700 ease-in-out"
          style={{ width: `${((currentIdx + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {steps.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isCompleted = idx < currentIdx;

          return (
            <div 
              key={step.id} 
              className={`flex flex-col gap-2 transition-all duration-300 ${isActive || isCompleted ? 'opacity-100' : 'opacity-30'}`}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

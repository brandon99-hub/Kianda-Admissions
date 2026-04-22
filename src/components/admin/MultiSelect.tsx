import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, ChevronDown, Users, UserPlus, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Option {
  id: number;
  label: string;
  subtext?: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  label?: string;
}

export default function MultiSelect({ options, selectedIds, onChange, placeholder = "Select candidates...", label }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) || 
    opt.subtext?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (id: number) => {
    const newIds = selectedIds.includes(id) 
      ? selectedIds.filter(i => i !== id) 
      : [...selectedIds, id];
    onChange(newIds);
  };

  const selectAll = () => {
    if (selectedIds.length === filteredOptions.length) {
      onChange([]);
    } else {
      onChange(filteredOptions.map(o => o.id));
    }
  };

  const selectedOptions = options.filter(o => selectedIds.includes(o.id));

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">{label}</label>}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`min-h-[56px] w-full bg-surface-container-low rounded-2xl p-3 border-2 transition-all cursor-pointer flex flex-wrap gap-2 items-center ${isOpen ? 'border-primary shadow-lg ring-4 ring-primary/5' : 'border-transparent hover:border-primary/10'}`}
      >
        {selectedOptions.length === 0 && (
          <span className="text-xs font-bold text-primary/30 ml-2">{placeholder}</span>
        )}
        
        <AnimatePresence>
          {selectedOptions.map(opt => (
            <motion.div 
              key={opt.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); toggleOption(opt.id); }}
              className="bg-primary text-secondary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group hover:bg-red-500 hover:text-white transition-all shadow-sm"
            >
              {opt.label}
              <X size={12} className="group-hover:scale-125 transition-transform" />
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="ml-auto pr-2 text-primary/40">
           <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[110] top-[calc(100%+8px)] left-0 right-0 bg-white rounded-3xl shadow-[0_20px_50px_rgba(24,33,109,0.15)] border border-outline-variant/10 overflow-hidden flex flex-col max-h-80"
          >
            <div className="p-4 bg-surface-container-low/50 border-b border-outline-variant/10 space-y-3">
               <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/30" />
                  <input 
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search candidates..."
                    className="w-full pl-10 pr-4 py-2 bg-white rounded-xl text-xs font-bold text-primary border-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
               </div>
               <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">{filteredOptions.length} Candidates Found</span>
                  <button 
                    type="button"
                    onClick={selectAll}
                    className="text-[9px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    {selectedIds.length === filteredOptions.length ? 'Deselect All' : 'Select All Result'}
                  </button>
               </div>
            </div>

            <div className="overflow-y-auto p-2 custom-scrollbar flex-1">
               {filteredOptions.map(opt => {
                 const isSelected = selectedIds.includes(opt.id);
                 return (
                   <button
                     key={opt.id}
                     type="button"
                     onClick={() => toggleOption(opt.id)}
                     className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all mb-1 group ${isSelected ? 'bg-primary/5' : 'hover:bg-primary/5'}`}
                   >
                     <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-secondary' : 'border-outline-variant/20 bg-white group-hover:border-primary/40'}`}>
                           {isSelected && <Check size={12} strokeWidth={4} />}
                        </div>
                        <div className="text-left">
                           <div className={`text-xs font-black transition-colors ${isSelected ? 'text-primary' : 'text-primary/60 group-hover:text-primary'}`}>{opt.label}</div>
                           {opt.subtext && <div className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{opt.subtext}</div>}
                        </div>
                     </div>
                   </button>
                 );
               })}
               {filteredOptions.length === 0 && (
                 <div className="py-8 text-center flex flex-col items-center gap-2 opacity-20">
                    <Users size={32} />
                    <span className="text-[10px] font-black uppercase tracking-widest">No candidates match</span>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function DatePicker({ value, onChange, placeholder = "Select Date", label }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(selectedDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    // Padding for start of month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`pad-${i}`} className="h-10" />);
    }
    
    for (let i = 1; i <= totalDays; i++) {
      const isSelected = value === `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();
      
      days.push(
        <button
          key={i}
          type="button"
          onClick={() => handleDateSelect(i)}
          className={`h-10 w-10 rounded-full text-xs font-bold transition-all flex items-center justify-center relative group
            ${isSelected ? 'bg-secondary text-primary shadow-lg shadow-secondary/20' : 'hover:bg-primary/5 text-primary/80'}
          `}
        >
          {isToday && !isSelected && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-secondary rounded-full" />}
          {i}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-surface-container-low p-4 rounded-xl border-2 transition-all
          ${isOpen ? 'border-secondary shadow-lg shadow-secondary/10' : 'border-transparent hover:border-secondary/20'}
        `}
      >
        <div className="flex items-center gap-3">
          <CalendarIcon size={16} className={`${value ? 'text-secondary' : 'text-primary/20'}`} />
          <span className={`text-sm font-black tracking-tight ${value ? 'text-primary' : 'text-primary/30'}`}>
            {value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : placeholder}
          </span>
        </div>
        <ChevronDown size={14} className={`text-primary/20 transition-transform ${isOpen ? 'rotate-180 text-secondary' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-[0_30px_60px_rgba(24,33,109,0.15)] border border-outline-variant/10 p-6 z-[150] min-w-[320px]"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => { setShowMonthSelector(!showMonthSelector); setShowYearSelector(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors text-xs font-black text-primary tracking-tight"
                  >
                    {months[viewDate.getMonth()]}
                    <ChevronDown size={12} className={`opacity-30 transition-transform ${showMonthSelector ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showMonthSelector && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 mt-1 bg-white shadow-xl border border-primary/5 rounded-xl py-2 z-[160] w-32 max-h-48 overflow-y-auto"
                      >
                        {months.map((m, i) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => { setViewDate(new Date(viewDate.getFullYear(), i, 1)); setShowMonthSelector(false); }}
                            className="w-full px-4 py-2 text-left text-[10px] font-bold text-primary hover:bg-secondary/10 transition-colors"
                          >
                            {m}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => { setShowYearSelector(!showYearSelector); setShowMonthSelector(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors text-xs font-black text-primary tracking-tight"
                  >
                    {viewDate.getFullYear()}
                    <ChevronDown size={12} className={`opacity-30 transition-transform ${showYearSelector ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showYearSelector && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 mt-1 bg-white shadow-xl border border-primary/5 rounded-xl py-2 z-[160] w-24 max-h-48 overflow-y-auto"
                      >
                        {years.map(y => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => { setViewDate(new Date(y, viewDate.getMonth(), 1)); setShowYearSelector(false); }}
                            className="w-full px-4 py-2 text-left text-[10px] font-bold text-primary hover:bg-secondary/10 transition-colors"
                          >
                            {y}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex gap-1">
                <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-primary/5 rounded-lg text-primary/40 hover:text-primary transition-all">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-primary/5 rounded-lg text-primary/40 hover:text-primary transition-all">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-primary/20">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            {/* Quick Select Buttons */}
            <div className="mt-6 pt-4 border-t border-primary/5 flex gap-2">
              <button
                type="button"
                onClick={() => setViewDate(new Date())}
                className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-primary/30 hover:text-red-500 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

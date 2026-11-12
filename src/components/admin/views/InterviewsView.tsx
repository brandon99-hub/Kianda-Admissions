import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin, Calendar, Plus, Search, Loader2, Check, X, ChevronDown, ChevronUp, ChevronRight, Mail, LayoutGrid, CalendarCheck, UserMinus, UserPlus, Phone, RefreshCw, CheckCircle2, AlertTriangle, XCircle, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminPageHeader from '../AdminPageHeader';
import DatePicker from '../../DatePicker';
import MultiSelect from '../MultiSelect';
import TablePagination from '../TablePagination';
import { useApplications, useInterviews, useCreateInterview, useRecordInterviewOutcome, useResults, useAssessments, useGrades, useResyncErp } from '../../../hooks/useAdminData';
import ApplicationDetailsView from './ApplicationDetailsView';
import AssessmentMarksSwitcher from '../AssessmentMarksSwitcher';
import { useAdminContext } from '../../../context/AdminContext';

interface ScheduledInterviewRowProps {
  key?: React.Key;
  slot: any;
  marks: any[];
  onAccept: (applicationId: number) => void;
  onReject: (applicationId: number, name: string) => void;
  onResync: (applicationId: number) => void;
  onViewDetails: (app: any) => void;
  isProcessing: boolean;
  vacantSpots: number;
  index: number;
  isSelected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
}

function ScheduledInterviewRow({ slot, marks, onAccept, onReject, onResync, onViewDetails, isProcessing, vacantSpots, index, isSelected, onToggleSelect }: ScheduledInterviewRowProps) {
  const [parentToggle, setParentToggle] = useState<'mother' | 'father'>('mother');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const parentDetails = slot.application?.parentDetails;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <tr 
      className="hover:bg-primary/[0.02] transition-colors group cursor-pointer hover:relative hover:z-10"
      onClick={() => onViewDetails(slot.application)}
    >
       <td className="pl-6 pr-2 py-6 w-10" onClick={(e) => e.stopPropagation()}>
          <button onClick={onToggleSelect} className="text-primary transition-colors">
            {isSelected
              ? <CheckSquare size={18} className="text-secondary" />
              : <Square size={18} className="text-primary/20 hover:text-primary/50" />}
          </button>
       </td>
       <td className="px-8 py-6">
          <div className="font-bold text-primary text-sm flex items-center gap-2">{slot.application?.candidate?.fullName}</div>
          <div className="text-[10px] font-medium text-on-surface-variant/40 uppercase tracking-widest">APP-{slot.applicationId.toString().padStart(4, '0')}</div>
       </td>
       <td className="px-8 py-6 text-sm font-black text-secondary">
          {slot.application?.candidate?.grade || '—'}
       </td>
       <td className="px-8 py-6">
         <div className="flex flex-col">
            <div className="font-bold text-primary text-sm whitespace-nowrap">
                {slot.application?.candidate?.dob ? new Date(slot.application.candidate.dob).toLocaleDateString('en-GB') : 'N/A'}
            </div>
            <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                ({(() => {
                    if (!slot.application?.candidate?.dob) return '0';
                    const birth = new Date(slot.application.candidate.dob);
                    const now = new Date();
                    let age = now.getFullYear() - birth.getFullYear();
                    const m = now.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                    return age;
                })()} yrs)
            </div>
         </div>
       </td>
       <td className="px-8 py-6 text-sm font-bold text-on-surface-variant/60 italic">
          {slot.application?.candidate?.religion || 'N/A'} 
          {slot.application?.candidate?.denomination && <span className="text-secondary ml-1">({slot.application.candidate.denomination})</span>}
       </td>
       <td className="px-8 py-6">
          <AssessmentMarksSwitcher marks={marks} />
       </td>
       <td className="px-8 py-6">
          <div className="flex flex-col">
            <div className="font-black text-primary text-sm italic underline underline-offset-4 decoration-secondary/30 mb-1">
              {new Date(slot.slotTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-secondary uppercase tracking-widest">
              <Clock size={12} strokeWidth={3} /> {new Date(slot.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {slot.endTime && ` - ${new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </div>
          </div>
       </td>
       <td className="px-8 py-6">
          <div className="flex flex-col gap-2">
            <div className="flex bg-primary/5 rounded-full p-0.5 border border-primary/10 w-fit">
               <button 
                 onClick={(e) => { e.stopPropagation(); setParentToggle('mother'); }}
                 className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${parentToggle === 'mother' ? 'bg-primary text-white' : 'text-primary/40 hover:text-primary'}`}
               >Mother</button>
               <button 
                 onClick={(e) => { e.stopPropagation(); setParentToggle('father'); }}
                 className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${parentToggle === 'father' ? 'bg-primary text-white' : 'text-primary/40 hover:text-primary'}`}
               >Father</button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div 
                key={parentToggle}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className="space-y-0.5"
              >
                 <div className="text-xs font-bold text-primary truncate max-w-[150px]">
                    {parentDetails?.[`${parentToggle}Name`] || 'Not provided'}
                 </div>
                 <div className="text-[9px] font-bold text-primary/40 flex items-center gap-1">
                    <Phone size={10} /> {parentDetails?.[`${parentToggle}Phone`] || '—'}
                 </div>
              </motion.div>
            </AnimatePresence>
          </div>
       </td>
       <td className="px-8 py-6 text-right">
          <div className="flex justify-end items-center gap-4">
            <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
               <button 
                 disabled={isProcessing}
                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] border transition-all shadow-sm ${
                   slot.application?.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' :
                   slot.application?.status === 'waitlisted' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                   slot.application?.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                   'bg-primary/5 text-primary border-primary/10 hover:bg-secondary hover:text-white text-primary'
                 }`}
               >
                 {slot.application?.status === 'accepted' ? 'Accepted' : 
                  slot.application?.status === 'waitlisted' ? 'Waitlisted' : 
                  slot.application?.status === 'rejected' ? 'Rejected' : 'Decide'} 
                 <ChevronDown size={12} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
               </button>

               <AnimatePresence>
                 {isDropdownOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: index === 0 ? 10 : -10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: index === 0 ? 10 : -10, scale: 0.95 }}
                     className={`absolute right-0 ${index === 0 ? 'top-full mt-2' : 'bottom-full mb-2'} w-48 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 py-2 z-50 overflow-hidden`}
                   >
                     <button 
                       onClick={() => { setIsDropdownOpen(false); onAccept(slot.applicationId); }}
                       className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest flex items-center justify-between ${vacantSpots > 0 ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}
                     >
                       {vacantSpots > 0 ? 'Accepted / Grant' : 'Waitlist / Slot Full'} <Check size={14} />
                     </button>
                    <button 
                      onClick={() => { setIsDropdownOpen(false); onReject(slot.applicationId, slot.application?.candidate?.fullName); }}
                      className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 flex items-center justify-between"
                    >
                      Rejected / Regret <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); onViewDetails(slot.application); }}
              className="w-10 h-10 inline-flex items-center justify-center bg-primary/5 rounded-full text-primary hover:bg-secondary hover:text-primary transition-all shadow-inner group-hover:-translate-x-1"
              title="View Application Details"
            >
              <ChevronRight size={18} />
            </button>
          </div>
       </td>
    </tr>
  );
}

interface AwaitingInterviewRowProps {
  key?: React.Key;
  app: any;
  marks: any[];
  onSchedule: (id: number) => void;
  onAccept: (applicationId: number) => void;
  onReject: (applicationId: number, name: string) => void;
  onResync: (applicationId: number) => void;
  onViewDetails: (app: any) => void;
  isProcessing: boolean;
  vacantSpots: number;
  index: number;
  isSelected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
}

function AwaitingInterviewRow({ app, marks, onSchedule, onAccept, onReject, onResync, onViewDetails, isProcessing, vacantSpots, index, isSelected, onToggleSelect }: AwaitingInterviewRowProps) {
  const [parentToggle, setParentToggle] = useState<'mother' | 'father'>('mother');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const parentDetails = app.parentDetails;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <tr 
      className="hover:bg-primary/[0.02] transition-colors group cursor-pointer hover:relative hover:z-10"
      onClick={() => onViewDetails(app)}
    >
       <td className="pl-6 pr-2 py-6 w-10" onClick={(e) => e.stopPropagation()}>
          <button onClick={onToggleSelect} className="text-primary transition-colors">
            {isSelected
              ? <CheckSquare size={18} className="text-secondary" />
              : <Square size={18} className="text-primary/20 hover:text-primary/50" />}
          </button>
       </td>
       <td className="px-8 py-6">
          <div className="font-bold text-primary text-sm">{app.candidate?.fullName}</div>
          <div className="text-[10px] font-medium text-on-surface-variant/40 uppercase tracking-widest">APP-{app.id.toString().padStart(4, '0')}</div>
       </td>
       <td className="px-8 py-6 text-sm font-black text-secondary">{app.candidate?.grade}</td>
       <td className="px-8 py-6">
         <div className="flex flex-col">
            <div className="font-bold text-primary text-sm whitespace-nowrap">
                {app.candidate?.dob ? new Date(app.candidate.dob).toLocaleDateString('en-GB') : 'N/A'}
            </div>
            <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                ({(() => {
                    if (!app.candidate?.dob) return '0';
                    const birth = new Date(app.candidate.dob);
                    const now = new Date();
                    let age = now.getFullYear() - birth.getFullYear();
                    const m = now.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                    return age;
                })()} yrs)
            </div>
         </div>
       </td>
       <td className="px-8 py-6 text-sm font-bold text-on-surface-variant/60 italic">
          {app.candidate?.religion || 'N/A'} 
          {app.candidate?.denomination && <span className="text-secondary ml-1">({app.candidate.denomination})</span>}
       </td>
       <td className="px-8 py-6">
          <AssessmentMarksSwitcher marks={marks} />
       </td>
       <td className="px-8 py-6">
          <div className="flex flex-col gap-2">
            <div className="flex bg-primary/5 rounded-full p-0.5 border border-primary/10 w-fit">
               <button 
                 onClick={(e) => { e.stopPropagation(); setParentToggle('mother'); }}
                 className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${parentToggle === 'mother' ? 'bg-primary text-white' : 'text-primary/40 hover:text-primary'}`}
               >Mother</button>
               <button 
                 onClick={(e) => { e.stopPropagation(); setParentToggle('father'); }}
                 className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${parentToggle === 'father' ? 'bg-primary text-white' : 'text-primary/40 hover:text-primary'}`}
               >Father</button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div 
                key={parentToggle}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className="space-y-0.5"
              >
                 <div className="text-xs font-bold text-primary truncate max-w-[150px]">
                    {parentDetails?.[`${parentToggle}Name`] || 'Not provided'}
                 </div>
                 <div className="text-[9px] font-bold text-primary/40 flex items-center gap-1">
                    <Phone size={10} /> {parentDetails?.[`${parentToggle}Phone`] || '—'}
                 </div>
              </motion.div>
            </AnimatePresence>
          </div>
       </td>
       <td className="px-8 py-6">
          <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-green-100">Cleared Exam</span>
       </td>
       <td className="px-8 py-6 text-right">
          <div className="flex justify-end items-center gap-6">
            <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
               <button 
                 disabled={isProcessing}
                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] border transition-all shadow-sm ${
                   app.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' :
                   app.status === 'waitlisted' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                   app.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                   app.status === 'passed_assessment' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                   'bg-primary/5 text-primary border-primary/10 hover:bg-secondary hover:text-white text-primary'
                 }`}
               >
                 {app.status === 'accepted' ? 'Accepted' : 
                  app.status === 'waitlisted' ? 'Waitlisted' : 
                  app.status === 'rejected' ? 'Rejected' : 
                  app.status === 'passed_assessment' ? 'Passed' : 'Status'} 
                 <ChevronDown size={12} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
               </button>

               <AnimatePresence>
                 {isDropdownOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: index === 0 ? 10 : -10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: index === 0 ? 10 : -10, scale: 0.95 }}
                     className={`absolute right-0 ${index === 0 ? 'top-full mt-2' : 'bottom-full mb-2'} w-48 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 py-2 z-50 overflow-hidden text-left`}
                   >
                     <button 
                       onClick={() => { setIsDropdownOpen(false); onSchedule(app.id); }}
                       className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 flex items-center justify-between"
                     >
                       Schedule Interview <CalendarCheck size={14} />
                     </button>
                     <button 
                       onClick={() => { setIsDropdownOpen(false); onAccept(app.id); }}
                       className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest flex items-center justify-between ${vacantSpots > 0 ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}
                     >
                       {vacantSpots > 0 ? 'Final Accept' : 'Waitlist Action'} <Check size={14} />
                     </button>
                    <button 
                      onClick={() => { setIsDropdownOpen(false); onReject(app.id, app.candidate?.fullName); }}
                      className="w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 flex items-center justify-between"
                    >
                      Reject Candidate <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); onViewDetails(app); }}
              className="w-10 h-10 inline-flex items-center justify-center bg-primary/5 rounded-full text-primary hover:bg-secondary hover:text-primary transition-all shadow-inner group-hover:-translate-x-1"
              title="View Application Details"
            >
              <ChevronRight size={18} />
            </button>
          </div>
       </td>
    </tr>
  );
}

interface OutcomeRowProps {
  key?: React.Key;
  app: any;
  marks: any[];
  onResync: (applicationId: number) => void;
  onViewDetails: (app: any) => void;
  index: number;
}

function OutcomeRow({ app, marks, onResync, onViewDetails, isResyncing }: any) {
  const [parentToggle, setParentToggle] = useState<'mother' | 'father'>('mother');
  const parentDetails = app.parentDetails;

  return (
    <tr 
      className="hover:bg-primary/[0.02] transition-colors group cursor-pointer hover:relative hover:z-10"
      onClick={() => onViewDetails(app)}
    >
       <td className="px-8 py-6">
          <div className="font-bold text-primary text-sm">{app.candidate?.fullName}</div>
          <div className="text-[10px] font-medium text-on-surface-variant/40 uppercase tracking-widest">APP-{app.id.toString().padStart(4, '0')}</div>
       </td>
       <td className="px-8 py-6 text-sm font-black text-secondary">{app.candidate?.grade}</td>
       <td className="px-8 py-6">
         <div className="flex flex-col">
            <div className="font-bold text-primary text-sm whitespace-nowrap">
                {app.candidate?.dob ? new Date(app.candidate.dob).toLocaleDateString('en-GB') : 'N/A'}
            </div>
            <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                ({(() => {
                    if (!app.candidate?.dob) return '0';
                    const birth = new Date(app.candidate.dob);
                    const now = new Date();
                    let age = now.getFullYear() - birth.getFullYear();
                    const m = now.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                    return age;
                })()} yrs)
            </div>
         </div>
       </td>
       <td className="px-8 py-6 text-sm font-bold text-on-surface-variant/60 italic">
          {app.candidate?.religion || 'N/A'} 
          {app.candidate?.denomination && <span className="text-secondary ml-1">({app.candidate.denomination})</span>}
       </td>
       <td className="px-8 py-6">
          <AssessmentMarksSwitcher marks={marks} />
       </td>
       <td className="px-8 py-6">
          <div className="flex flex-col gap-2">
            <div className="flex bg-primary/5 rounded-full p-0.5 border border-primary/10 w-fit">
               <button 
                 onClick={(e) => { e.stopPropagation(); setParentToggle('mother'); }}
                 className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${parentToggle === 'mother' ? 'bg-primary text-white' : 'text-primary/40 hover:text-primary'}`}
               >Mother</button>
               <button 
                 onClick={(e) => { e.stopPropagation(); setParentToggle('father'); }}
                 className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${parentToggle === 'father' ? 'bg-primary text-white' : 'text-primary/40 hover:text-primary'}`}
               >Father</button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div 
                key={parentToggle}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className="space-y-0.5"
              >
                 <div className="text-xs font-bold text-primary truncate max-w-[150px]">
                    {parentDetails?.[`${parentToggle}Name`] || 'Not provided'}
                 </div>
                 <div className="text-[9px] font-bold text-primary/40 flex items-center gap-1">
                    <Phone size={10} /> {parentDetails?.[`${parentToggle}Phone`] || '—'}
                 </div>
              </motion.div>
            </AnimatePresence>
          </div>
       </td>
       <td className="px-8 py-6">
          <div className="flex flex-col gap-1.5 items-start">
             <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${
               app.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' :
               app.status === 'waitlisted' ? 'bg-amber-50 text-amber-600 border-amber-100' :
               'bg-red-50 text-red-600 border-red-100'
             }`}>
               {app.status}
             </span>
             {app.status === 'accepted' && (
                <div className="text-[8px] font-black tracking-widest uppercase mt-1">
                  {app.erpSyncStatus === 'failed_partially' && (
                    <span className="text-orange-500 flex items-center gap-1"><AlertTriangle size={10} /> Partial Sync</span>
                  )}
                  {app.erpSyncStatus === 'failed' && (
                    <span className="text-red-500 flex items-center gap-1"><XCircle size={10} /> ERP Failed</span>
                  )}
                </div>
             )}
          </div>
       </td>
       <td className="px-8 py-6 text-right relative">
          <div className="flex flex-col justify-end items-center gap-2 relative">
            {app.status === 'accepted' && (app.erpSyncStatus === 'failed' || app.erpSyncStatus === 'failed_partially') && (
               <button 
                 onClick={(e) => { e.stopPropagation(); onResync(app.id); }} 
                 disabled={isResyncing}
                 className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm border border-orange-200/50 group/resync relative" 
                 title="Retry Sync to Business Central"
               >
                 {isResyncing ? (
                   <Loader2 size={12} className="animate-spin" />
                 ) : (
                   <RefreshCw size={12} className="group-hover/resync:rotate-180 transition-transform duration-500" />
                 )}
                 <span className="text-[9px] font-black uppercase tracking-widest">{isResyncing ? 'Syncing...' : 'Retry Sync'}</span>
               </button>
            )}

            <button 
              onClick={(e) => { e.stopPropagation(); onViewDetails(app); }}
              className="w-10 h-10 inline-flex items-center justify-center bg-primary/5 rounded-full text-primary hover:bg-secondary hover:text-primary transition-all shadow-inner group-hover:-translate-x-1"
              title="View Application Details"
            >
              <ChevronRight size={18} />
            </button>
          </div>
       </td>
    </tr>
  );
}


export default function InterviewsView() {
  const queryClient = useQueryClient();
  const { data: applications = [], isLoading: appsLoading, refetch: refetchApps } = useApplications();
  const { data: grades = [] } = useGrades();
  const { data: interviews = [], isLoading: interviewsLoading, refetch: refetchInterviews } = useInterviews();
  const { data: results = [] } = useResults();
  const { data: assessments = [] } = useAssessments();
  const createInterviewMutation = useCreateInterview();
  const recordOutcomeMutation = useRecordInterviewOutcome();
  const resyncMutation = useResyncErp();

  const handleResync = (applicationId: number) => {
    resyncMutation.mutate(applicationId);
  };

  // Shared AdminContext state — persists across tab navigation
  const { state: adminState, setInterviewsState } = useAdminContext();
  const activeTab = adminState.interviews.activeTab;
  const searchQuery = adminState.interviews.search;
  const currentPage = adminState.interviews.page;

  const setActiveTab = (t: 'scheduled' | 'awaiting' | 'outcomes') => setInterviewsState({ activeTab: t, page: 1 });
  const setSearchQuery = (v: string) => setInterviewsState({ search: v, page: 1 });
  const setCurrentPage = (v: number) => setInterviewsState({ page: v });

  const itemsPerPage = 10;
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [showAcceptProgress, setShowAcceptProgress] = useState(false);

  // Bulk interview selection state
  const [bulkInterviewIds, setBulkInterviewIds] = useState<Set<number>>(new Set());
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; accepted: number; waitlisted: number } | null>(null);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState<'accept' | 'reject' | null>(null);
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);
  const [customAcceptOrder, setCustomAcceptOrder] = useState<number[]>([]);

  const openBulkAcceptModal = () => {
    const ids: number[] = Array.from(bulkInterviewIds);
    if (ids.length === 0) return;

    // Compile assessment scores for each selected candidate to establish a merit-first default
    const candidateScores = ids.map(id => {
      const app = applications.find((a: any) => a.id === id);
      const appResults = results.filter((r: any) => r.applicationId === id);
      const totalMarksObtained = appResults.reduce((acc: number, r: any) => acc + (Number(r.marksObtained) || 0), 0);
      const totalMaxMarks = appResults.reduce((acc: number, r: any) => {
        const ass = assessments.find((a: any) => a.id === r.assessmentId);
        return acc + (ass?.maxMarks || 100);
      }, 0) || (appResults.length > 0 ? appResults.length * 100 : 100);
      const percentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;
      const grade = app?.candidate?.grade || '';
      return { id, grade, percentage };
    });

    // Sort by Grade first, then descending by exam score (merit-first default)
    candidateScores.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      return b.percentage - a.percentage;
    });

    setCustomAcceptOrder(candidateScores.map(c => c.id));
    setShowBulkConfirmModal('accept');
  };

  const moveCandidate = (id: number, direction: 'up' | 'down') => {
    setCustomAcceptOrder(prev => {
      const index = prev.indexOf(id);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const [selectedSlot, setSelectedSlot] = useState<string>('All Slots');
  const [outcomeFilter, setOutcomeFilter] = useState<'All Outcomes' | 'accepted' | 'rejected' | 'waitlisted'>('All Outcomes');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState<any | null>(null);
  
  // Reset pagination on tab or filter changes
  useEffect(() => {
    setCurrentPage(1);
    setBulkInterviewIds(new Set());
    setCustomAcceptOrder([]);
  }, [activeTab, searchQuery, selectedSlot, outcomeFilter]);

  // Schedule Form State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Admissions Office, Kianda School'
  });

  // Outcome Form State

  if (selectedApp) {
    return (
      <ApplicationDetailsView 
        app={selectedApp} 
        onBack={() => setSelectedApp(null)} 
        onUpdate={() => { refetchApps(); refetchInterviews(); }} 
        showResults={true}
      />
    );
  }

  // Filter Logic
  const decidedStatuses = ['accepted', 'rejected', 'waitlisted'];

  const awaitingScheduling = applications.filter((app: any) => 
    app.status === 'passed_assessment' && 
    !interviews.some((int: any) => int.applicationId === app.id) &&
    !decidedStatuses.includes(app.status)
  );

  const getSlotString = (slot: any) => {
    const start = new Date(slot.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = slot.endTime ? new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    return end ? `${start} - ${end}` : start;
  };

  const pendingInterviews = interviews.filter((int: any) => !decidedStatuses.includes(int.application?.status));
  const availableSlots = Array.from(new Set(pendingInterviews.map(getSlotString))).sort();

  const filteredInterviews = pendingInterviews.filter((int: any) => {
    const matchesSearch = int.application?.candidate?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          int.applicationId.toString().includes(searchQuery);
    const matchesSlot = selectedSlot === 'All Slots' || getSlotString(int) === selectedSlot;
    return matchesSearch && matchesSlot;
  }).sort((a: any, b: any) => new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime());

  const filteredAwaiting = awaitingScheduling.filter((app: any) => 
    app.candidate?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.id.toString().includes(searchQuery)
  );

  const outcomesApps = applications.filter((app: any) => decidedStatuses.includes(app.status));
  
  const filteredOutcomes = outcomesApps.filter((app: any) => {
    const matchesSearch = app.candidate?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || app.id.toString().includes(searchQuery);
    const matchesOutcome = outcomeFilter === 'All Outcomes' || app.status === outcomeFilter;
    return matchesSearch && matchesOutcome;
  }).sort((a: any, b: any) => b.id - a.id);

  const totalItems = activeTab === 'scheduled' ? filteredInterviews.length : activeTab === 'awaiting' ? filteredAwaiting.length : filteredOutcomes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginatedInterviews = filteredInterviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedAwaiting = filteredAwaiting.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedOutcomes = filteredOutcomes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleBulkInterview = (id: number) => {
    setBulkInterviewIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allCurrentSelected = (() => {
    const currentList = activeTab === 'scheduled' ? paginatedInterviews : paginatedAwaiting;
    return currentList.length > 0 && currentList.every((item: any) => {
      const id = activeTab === 'scheduled' ? item.applicationId : item.id;
      return bulkInterviewIds.has(id);
    });
  })();

  const toggleSelectAllInterviews = () => {
    const currentList = activeTab === 'scheduled' ? paginatedInterviews : paginatedAwaiting;
    if (allCurrentSelected) {
      setBulkInterviewIds(new Set());
    } else {
      const ids = currentList.map((item: any) => activeTab === 'scheduled' ? item.applicationId : item.id);
      setBulkInterviewIds(new Set(ids));
    }
  };

  const handleBulkAccept = async () => {
    setShowBulkConfirmModal(null);
    const ids: number[] = customAcceptOrder.length > 0 ? customAcceptOrder : Array.from(bulkInterviewIds);

    setBulkProgress({ current: 0, total: ids.length, accepted: 0, waitlisted: 0 });
    setShowAcceptProgress(true);

    // Track running vacancies per grade so spots are properly decremented
    const remainingSpots: Record<string, number> = {};
    grades.forEach((g: any) => {
      const key = g.gradeName?.toLowerCase()?.trim();
      if (key) remainingSpots[key] = Math.max(0, g.vacantSpots ?? 0);
    });

    let acceptedCount = 0;
    let waitlistedCount = 0;

    for (const appId of ids) {
      const app = applications.find((a: any) => a.id === appId);
      const gradeKey = app?.candidate?.grade?.toLowerCase()?.trim();
      const spots = remainingSpots[gradeKey] ?? 0;
      const desiredOutcome = spots > 0 ? 'accepted' : 'waitlisted';
      if (spots > 0) {
        remainingSpots[gradeKey] = spots - 1;
      }

      try {
        const res: any = await recordOutcomeMutation.mutateAsync({
          applicationId: appId,
          outcome: desiredOutcome,
          reason: undefined
        });

        const actualStatus = res?.status || desiredOutcome;
        if (actualStatus === 'accepted') {
          acceptedCount++;
        } else {
          waitlistedCount++;
        }
      } catch (e) {
        // continue processing
      }

      setBulkProgress(prev => prev ? {
        ...prev,
        current: prev.current + 1,
        accepted: acceptedCount,
        waitlisted: waitlistedCount,
      } : null);
    }

    setTimeout(() => {
      setShowAcceptProgress(false);
      setBulkProgress(null);
      setBulkInterviewIds(new Set());
      setCustomAcceptOrder([]);
      refetchApps();
      refetchInterviews();
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success(`✓ ${acceptedCount} Accepted · ${waitlistedCount} Waitlisted`);
    }, 2000);
  };

  const handleBulkReject = async () => {
    setIsBulkRejecting(true);
    const ids: number[] = Array.from(bulkInterviewIds);
    try {
      for (const appId of ids) {
        await recordOutcomeMutation.mutateAsync({
          applicationId: appId,
          outcome: 'rejected',
          reason: undefined
        });
      }
      setBulkInterviewIds(new Set());
      setShowBulkConfirmModal(null);
      refetchApps();
      refetchInterviews();
      toast.success(`${ids.length} candidate${ids.length > 1 ? 's' : ''} rejected.`);
    } catch (e) {
      toast.error('One or more rejections failed.');
    } finally {
      setIsBulkRejecting(false);
    }
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0 || !scheduleData.date) return;

    const slotTime = `${scheduleData.date}T${scheduleData.startTime}:00`;
    const endTime = `${scheduleData.date}T${scheduleData.endTime}:00`;

    createInterviewMutation.mutate({
      applicationIds: selectedIds,
      slotTime,
      endTime,
      location: scheduleData.location
    }, {
      onSuccess: () => {
        setShowScheduleModal(false);
        setSelectedIds([]);
        setScheduleData({ ...scheduleData, date: '' });
      }
    });
  };

  const handleOutcome = (applicationId: number, outcome: 'accepted' | 'rejected') => {
    if (outcome === 'accepted') {
      setShowAcceptProgress(true);
    }
    recordOutcomeMutation.mutate({
      applicationId,
      outcome,
      reason: undefined
    }, {
      onSuccess: () => {
        setShowOutcomeModal(null);
        if (outcome === 'accepted') {
          setTimeout(() => setShowAcceptProgress(false), 2000);
        }
      },
      onError: () => {
        if (outcome === 'accepted') {
          setTimeout(() => setShowAcceptProgress(false), 2000);
        }
      }
    });
  };

  const isLoading = appsLoading || interviewsLoading;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <AdminPageHeader 
        title="Interviews" 
        description="Manage oral interviews and final admission decisions." 
        icon={Calendar} 
      >
        <div className="flex flex-col md:flex-row items-center gap-4">
          {activeTab === 'scheduled' && availableSlots.length > 0 && (
            <div className="relative group">
              <select 
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="appearance-none bg-white px-6 py-3 rounded-xl font-bold text-primary min-w-[180px] border border-outline-variant/10 focus:ring-4 focus:ring-primary/5 cursor-pointer transition-all pr-12 shadow-sm text-xs"
              >
                <option value="All Slots">All Slots</option>
                {availableSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none group-hover:text-primary transition-colors" />
            </div>
          )}
          {activeTab === 'outcomes' && (
            <div className="relative group">
              <select 
                value={outcomeFilter}
                onChange={(e: any) => setOutcomeFilter(e.target.value)}
                className="appearance-none bg-white px-6 py-3 rounded-xl font-bold text-primary min-w-[180px] border border-outline-variant/10 focus:ring-4 focus:ring-primary/5 cursor-pointer transition-all pr-12 shadow-sm text-xs"
              >
                <option value="All Outcomes">All Outcomes</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="waitlisted">Waitlisted</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none group-hover:text-primary transition-colors" />
            </div>
          )}
          <div className="relative group/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within/search:text-primary transition-colors" size={16} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border border-outline-variant/10 rounded-2xl text-xs font-black placeholder:text-primary/20 focus:ring-4 focus:ring-primary/5 transition-all w-full md:w-64 shadow-sm" 
              placeholder="Search candidates..." 
            />
          </div>
          {activeTab !== 'outcomes' && (
            <button 
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-secondary rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/10"
            >
              <Plus size={14} /> Schedule Interview
            </button>
          )}
        </div>
      </AdminPageHeader>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center items-center gap-4 border-b border-outline-variant/10 pb-4">
        <button 
          onClick={() => setActiveTab('scheduled')}
          className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2.5 ${
            activeTab === 'scheduled' 
              ? 'bg-primary text-secondary shadow-lg shadow-primary/20 scale-100 ring-2 ring-primary/20' 
              : 'bg-white text-primary/75 hover:text-primary hover:bg-primary/5 border border-outline-variant/20 shadow-sm'
          }`}
        >
          <CalendarCheck size={15} /> Scheduled
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${
            activeTab === 'scheduled' ? 'bg-white/20 text-secondary' : 'bg-primary/10 text-primary'
          }`}>
            {filteredInterviews.length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('awaiting')}
          className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2.5 ${
            activeTab === 'awaiting' 
              ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-100 ring-2 ring-secondary/30' 
              : 'bg-white text-primary/75 hover:text-primary hover:bg-primary/5 border border-outline-variant/20 shadow-sm'
          }`}
        >
          <LayoutGrid size={15} /> Awaiting Scheduling
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${
            activeTab === 'awaiting' ? 'bg-primary/15 text-primary' : 'bg-primary/10 text-primary'
          }`}>
            {filteredAwaiting.length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('outcomes')}
          className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2.5 ${
            activeTab === 'outcomes' 
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/20 scale-100 ring-2 ring-green-600/30' 
              : 'bg-white text-primary/75 hover:text-primary hover:bg-primary/5 border border-outline-variant/20 shadow-sm'
          }`}
        >
          <CheckCircle2 size={15} /> Outcomes
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black ${
            activeTab === 'outcomes' ? 'bg-white/25 text-white' : 'bg-primary/10 text-primary'
          }`}>
            {filteredOutcomes.length}
          </span>
        </button>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl shadow-primary/5 overflow-hidden border border-outline-variant/5 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-primary/20" />
          </div>
        )}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left whitespace-nowrap min-w-[1000px]">
             <thead className="bg-surface-container-low/50 border-b border-outline-variant/10">
                <tr>
                   {activeTab !== 'outcomes' && (
                     <th className="pl-6 pr-2 py-6 w-10">
                       <button
                         onClick={toggleSelectAllInterviews}
                         className="text-primary/40 hover:text-primary transition-colors"
                         title={allCurrentSelected ? 'Deselect all' : 'Select all visible'}
                       >
                         {allCurrentSelected
                           ? <CheckSquare size={16} className="text-secondary" />
                           : <Square size={16} />}
                       </button>
                     </th>
                   )}
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Candidate Dossier</th>
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Grade Applied</th>
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">DOB / Age</th>
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Religion</th>
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Ass. Marks</th>
                   {activeTab === 'scheduled' ? (
                     <>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Interview Schedule</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Parent Info</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Location</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40 text-right">Actions</th>
                     </>
                   ) : activeTab === 'awaiting' ? (
                     <>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Parent Info</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Exam Status</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40 text-right">Actions</th>
                     </>
                   ) : (
                     <>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Parent Info</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40 text-right">Actions</th>
                     </>
                   )}
                </tr>
             </thead>
             <tbody className="divide-y divide-outline-variant/5">
                {activeTab === 'scheduled' ? (
                  paginatedInterviews.map((slot: any, i: number) => {
                    const appResults = results.filter((r: any) => r.applicationId === slot.applicationId);
                    const marks = appResults.map((r: any) => {
                       const ass = assessments.find((a: any) => a.id === r.assessmentId);
                       return { assessmentTitle: ass?.title || 'Assessment', marksObtained: r.marksObtained, maxMarks: ass?.maxMarks || 100, passed: r.passed };
                    });
                    return (
                    <ScheduledInterviewRow 
                      key={i} 
                      index={i}
                      slot={slot} 
                      marks={marks}
                      isSelected={bulkInterviewIds.has(slot.applicationId)}
                      onToggleSelect={(e) => { e.stopPropagation(); toggleBulkInterview(slot.applicationId); }}
                      isProcessing={recordOutcomeMutation.isPending}
                      vacantSpots={grades.find((g: any) => g.gradeName === slot.application?.candidate?.grade)?.vacantSpots || 0}
                      onAccept={handleOutcome.bind(null, slot.applicationId, 'accepted')}
                      onReject={(id, name) => setShowOutcomeModal({ id, name })}
                      onResync={handleResync}
                      onViewDetails={(app) => {
                        const fullApp = applications.find((a: any) => a.id === app.id);
                        const appObj = fullApp || app;
                        setSelectedApp({ ...appObj, assessmentResults: appResults });
                      }}
                    />
                    );
                  })
                ) : activeTab === 'awaiting' ? (
                  paginatedAwaiting.map((app: any, i: number) => {
                    const appResults = results.filter((r: any) => r.applicationId === app.id);
                    const marks = appResults.map((r: any) => {
                       const ass = assessments.find((a: any) => a.id === r.assessmentId);
                       return { assessmentTitle: ass?.title || 'Assessment', marksObtained: r.marksObtained, maxMarks: ass?.maxMarks || 100, passed: r.passed };
                    });
                    return (
                    <AwaitingInterviewRow 
                      key={i} 
                      index={i}
                      app={app} 
                      marks={marks}
                      isSelected={bulkInterviewIds.has(app.id)}
                      onToggleSelect={(e) => { e.stopPropagation(); toggleBulkInterview(app.id); }}
                      isProcessing={recordOutcomeMutation.isPending}
                      vacantSpots={grades.find((g: any) => g.gradeName === app.candidate?.grade)?.vacantSpots || 0}
                      onAccept={handleOutcome.bind(null, app.id, 'accepted')}
                      onReject={(id, name) => setShowOutcomeModal({ id, name })}
                      onResync={handleResync}
                      onSchedule={(id) => { setSelectedIds([id]); setShowScheduleModal(true); }}
                      onViewDetails={(app) => {
                        const fullApp = applications.find((a: any) => a.id === app.id);
                        const appObj = fullApp || app;
                        setSelectedApp({ ...appObj, assessmentResults: appResults });
                      }}
                    />
                    );
                  })
                ) : (
                  paginatedOutcomes.map((app: any, i: number) => {
                    const appResults = results.filter((r: any) => r.applicationId === app.id);
                    const marks = appResults.map((r: any) => {
                       const ass = assessments.find((a: any) => a.id === r.assessmentId);
                       return { assessmentTitle: ass?.title || 'Assessment', marksObtained: r.marksObtained, maxMarks: ass?.maxMarks || 100, passed: r.passed };
                    });
                    return (
                    <OutcomeRow 
                      key={i} 
                      index={i}
                      app={app} 
                      marks={marks}
                      onResync={handleResync}
                      isResyncing={resyncMutation.isPending && resyncMutation.variables === app.id}
                      onViewDetails={(app) => {
                        const fullApp = applications.find((a: any) => a.id === app.id);
                        const appObj = fullApp || app;
                        setSelectedApp({ ...appObj, assessmentResults: appResults });
                      }}
                    />
                    );
                  })
                )}
                
                {!isLoading && ((activeTab === 'scheduled' && filteredInterviews.length === 0) || (activeTab === 'awaiting' && filteredAwaiting.length === 0) || (activeTab === 'outcomes' && filteredOutcomes.length === 0)) && (
                  <tr>
                    <td colSpan={activeTab !== 'outcomes' ? 10 : 9} className="px-8 py-24 text-center">
                       <div className="flex flex-col items-center gap-3 opacity-20">
                          <Calendar size={48} />
                          <p className="font-bold text-primary italic">No records found for this section.</p>
                       </div>
                    </td>
                  </tr>
                )}
             </tbody>
          </table>
          
          <TablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Bulk Interview Selection Bar */}
      <AnimatePresence>
        {bulkInterviewIds.size > 0 && activeTab !== 'outcomes' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2.5 bg-white/95 backdrop-blur-md text-primary px-4 py-3 rounded-2xl shadow-[0_20px_50px_rgba(24,33,109,0.15)] border border-outline-variant/15"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 px-2.5 py-1 bg-primary/5 rounded-xl border border-primary/10 mr-1">
              {bulkInterviewIds.size} selected
            </span>
            <button
              onClick={openBulkAcceptModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 transition-all shadow-sm cursor-pointer"
            >
              <Check size={13} /> Bulk Accept / Waitlist
            </button>
            <button
              onClick={() => setShowBulkConfirmModal('reject')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 transition-all shadow-sm"
            >
              <X size={13} /> Bulk Reject
            </button>
            <button
              onClick={() => setBulkInterviewIds(new Set())}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-primary/40 hover:text-primary hover:bg-primary/5 transition-all ml-1"
              title="Clear selection"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accept Progress Modal */}
      <AnimatePresence>
        {showAcceptProgress && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/40 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl overflow-hidden flex flex-col items-center text-center"
            >
               <div className="w-16 h-16 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-6">
                  {recordOutcomeMutation.isPending ? (
                     <Loader2 size={32} className="animate-spin" />
                  ) : recordOutcomeMutation.isError ? (
                     <XCircle size={32} className="text-red-500" />
                  ) : (
                     <CheckCircle2 size={32} className="text-green-500" />
                  )}
               </div>
               
               <h3 className="text-xl font-black text-primary mb-2 tracking-tight">
                 {bulkProgress ? 'Processing Bulk Acceptance' : 'Processing Acceptance'}
               </h3>
               <p className="text-xs font-medium text-on-surface-variant/70 mb-8 max-w-[250px] mx-auto">
                 {bulkProgress
                   ? `Processing ${bulkProgress.current} of ${bulkProgress.total}… ${bulkProgress.accepted > 0 ? `${bulkProgress.accepted} Accepted` : ''}${bulkProgress.waitlisted > 0 ? ` · ${bulkProgress.waitlisted} Waitlisted` : ''}`
                   : recordOutcomeMutation.isPending 
                     ? "Updating local database, sending parent emails, and synchronizing with Business Central..." 
                     : recordOutcomeMutation.isError 
                       ? "An error occurred during acceptance." 
                       : "Application successfully accepted!"}
               </p>

               <div className="w-full space-y-3">
                 <div className="flex items-center gap-3 text-left">
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center ${recordOutcomeMutation.isPending || recordOutcomeMutation.isSuccess ? 'bg-green-100 text-green-600' : 'bg-outline-variant/20 text-primary/40'}`}>
                     {(recordOutcomeMutation.isPending || recordOutcomeMutation.isSuccess) && <Check size={12} strokeWidth={4} />}
                   </div>
                   <span className={`text-xs font-bold ${recordOutcomeMutation.isPending || recordOutcomeMutation.isSuccess ? 'text-primary' : 'text-primary/40'}`}>Local Status Updated</span>
                 </div>
                 <div className="flex items-center gap-3 text-left">
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center ${recordOutcomeMutation.isPending || recordOutcomeMutation.isSuccess ? 'bg-green-100 text-green-600' : 'bg-outline-variant/20 text-primary/40'}`}>
                     {(recordOutcomeMutation.isPending || recordOutcomeMutation.isSuccess) && <Check size={12} strokeWidth={4} />}
                   </div>
                   <span className={`text-xs font-bold ${recordOutcomeMutation.isPending || recordOutcomeMutation.isSuccess ? 'text-primary' : 'text-primary/40'}`}>Offer Email Sent</span>
                 </div>
                 <div className="flex items-center gap-3 text-left">
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center ${recordOutcomeMutation.isSuccess ? 'bg-green-100 text-green-600' : recordOutcomeMutation.isPending ? 'bg-amber-100 text-amber-600' : 'bg-outline-variant/20 text-primary/40'}`}>
                     {recordOutcomeMutation.isSuccess ? <Check size={12} strokeWidth={4} /> : recordOutcomeMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                   </div>
                   <span className={`text-xs font-bold ${recordOutcomeMutation.isSuccess ? 'text-primary' : recordOutcomeMutation.isPending ? 'text-amber-600' : 'text-primary/40'}`}>ERP Synchronization</span>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Accept Confirm Modal with Interactive Candidate Reorder/Swap Controls */}
      <AnimatePresence>
        {showBulkConfirmModal === 'accept' && (() => {
          const ids: number[] = customAcceptOrder.length > 0 ? customAcceptOrder : Array.from(bulkInterviewIds);
          
          // Map each candidate with exam scores
          const orderedApps = ids.map(id => {
            const app = applications.find((a: any) => a.id === id);
            if (!app) return null;
            const appResults = results.filter((r: any) => r.applicationId === id);
            const totalMarksObtained = appResults.reduce((acc: number, r: any) => acc + (Number(r.marksObtained) || 0), 0);
            const totalMaxMarks = appResults.reduce((acc: number, r: any) => {
              const ass = assessments.find((a: any) => a.id === r.assessmentId);
              return acc + (ass?.maxMarks || 100);
            }, 0) || (appResults.length > 0 ? appResults.length * 100 : 100);
            const percentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;
            return {
              id,
              app,
              candidate: app.candidate,
              totalMarksObtained,
              totalMaxMarks,
              percentage,
              hasResults: appResults.length > 0
            };
          }).filter(Boolean);

          // Track running vacancies per grade to classify into Offer vs Waitlist
          const remainingSpots: Record<string, number> = {};
          grades.forEach((g: any) => {
            const key = g.gradeName?.toLowerCase()?.trim();
            if (key) remainingSpots[key] = Math.max(0, g.vacantSpots ?? 0);
          });

          const enrichedCandidates = orderedApps.map((item: any) => {
            const gradeKey = item.candidate?.grade?.toLowerCase()?.trim();
            const available = remainingSpots[gradeKey] ?? 0;
            const isOffer = available > 0;
            if (isOffer) {
              remainingSpots[gradeKey] = available - 1;
            }
            return {
              ...item,
              isOffer,
              gradeName: item.candidate?.grade || 'Unassigned'
            };
          });

          const offerCandidates = enrichedCandidates.filter((c: any) => c.isOffer);
          const waitlistCandidates = enrichedCandidates.filter((c: any) => !c.isOffer);

          return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-primary/40 backdrop-blur-md" 
                onClick={() => setShowBulkConfirmModal(null)} 
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 20 }} 
                className="bg-white w-full max-w-2xl rounded-[36px] p-6 md:p-8 shadow-2xl relative z-10 border border-outline-variant/10 max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-outline-variant/10 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0 shadow-sm border border-green-100">
                      <UserPlus size={22} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-primary italic leading-tight">Confirm Bulk Acceptance</h3>
                      <p className="text-xs text-on-surface-variant/60 font-medium mt-0.5">
                        Sorted by assessment merit. Use arrows to swap who receives available spots.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-green-50 rounded-xl border border-green-200 text-center">
                      <div className="text-base font-black text-green-700 leading-none">{offerCandidates.length}</div>
                      <div className="text-[8px] font-black uppercase tracking-wider text-green-600/70 mt-0.5">Will Accept</div>
                    </div>
                    <div className="px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200 text-center">
                      <div className="text-base font-black text-amber-700 leading-none">{waitlistCandidates.length}</div>
                      <div className="text-[8px] font-black uppercase tracking-wider text-amber-600/70 mt-0.5">Will Waitlist</div>
                    </div>
                  </div>
                </div>

                {/* Candidate Breakdown & Reorder List */}
                <div className="my-4 overflow-y-auto pr-1 space-y-4 flex-grow custom-scrollbar">
                  {/* Offers Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-green-800">
                          Will Receive Offer ({offerCandidates.length})
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant/50">
                        Within Grade Vacancies
                      </span>
                    </div>

                    {offerCandidates.length === 0 ? (
                      <div className="p-4 bg-surface-container-low rounded-2xl text-center text-xs text-on-surface-variant/50 font-bold">
                        No vacancies currently available. All candidates will be waitlisted.
                      </div>
                    ) : (
                      offerCandidates.map((c: any, idx: number) => {
                        const globalIdx = ids.indexOf(c.id);
                        return (
                          <div 
                            key={c.id} 
                            className="p-3.5 bg-green-50/70 rounded-2xl border border-green-200/80 flex items-center justify-between gap-3 shadow-xs hover:border-green-300 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-green-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                                #{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-primary truncate">{c.candidate?.fullName}</div>
                                <div className="text-[10px] text-on-surface-variant/70 font-medium flex items-center gap-2">
                                  <span>APP-{c.id.toString().padStart(4, '0')}</span>
                                  <span>•</span>
                                  <span className="font-bold text-primary">{c.gradeName}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {c.hasResults ? (
                                <span className="px-2.5 py-1 bg-white rounded-xl text-[10px] font-black text-green-700 border border-green-200 shadow-xs">
                                  {c.percentage}% ({c.totalMarksObtained}/{c.totalMaxMarks})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-white/70 rounded-lg text-[9px] font-bold text-primary/40">
                                  No Exam Score
                                </span>
                              )}

                              {/* Reorder Buttons */}
                              <div className="flex items-center gap-0.5 bg-white/90 rounded-xl p-0.5 border border-green-200 shadow-xs">
                                <button
                                  type="button"
                                  onClick={() => moveCandidate(c.id, 'up')}
                                  disabled={globalIdx === 0}
                                  className="p-1 hover:bg-green-100 rounded-lg text-primary/70 hover:text-primary transition-all disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                  title="Move Up"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveCandidate(c.id, 'down')}
                                  disabled={globalIdx === ids.length - 1}
                                  className="p-1 hover:bg-green-100 rounded-lg text-primary/70 hover:text-primary transition-all disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                  title="Move Down / Demote"
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Cutoff Line */}
                  {waitlistCandidates.length > 0 && (
                    <div className="relative py-2 flex items-center justify-center my-1">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-dashed border-amber-300" />
                      </div>
                      <div className="relative bg-white px-3 py-1 rounded-full border border-amber-300 text-[9px] font-extrabold uppercase tracking-widest text-amber-700 shadow-xs flex items-center gap-1.5">
                        <AlertTriangle size={11} className="text-amber-500 shrink-0" />
                        Grade Quota Cutoff — Below Will Be Waitlisted
                      </div>
                    </div>
                  )}

                  {/* Waitlist Section */}
                  {waitlistCandidates.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                            Will Be Waitlisted ({waitlistCandidates.length})
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-on-surface-variant/50">
                          Capacity Exceeded
                        </span>
                      </div>

                      {waitlistCandidates.map((c: any, idx: number) => {
                        const globalIdx = ids.indexOf(c.id);
                        return (
                          <div 
                            key={c.id} 
                            className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-3 shadow-xs hover:border-amber-300 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                                #{offerCandidates.length + idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-primary truncate">{c.candidate?.fullName}</div>
                                <div className="text-[10px] text-on-surface-variant/70 font-medium flex items-center gap-2">
                                  <span>APP-{c.id.toString().padStart(4, '0')}</span>
                                  <span>•</span>
                                  <span className="font-bold text-primary">{c.gradeName}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {c.hasResults ? (
                                <span className="px-2.5 py-1 bg-white rounded-xl text-[10px] font-black text-amber-700 border border-amber-200 shadow-xs">
                                  {c.percentage}% ({c.totalMarksObtained}/{c.totalMaxMarks})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-white/70 rounded-lg text-[9px] font-bold text-primary/40">
                                  No Exam Score
                                </span>
                              )}

                              {/* Reorder Buttons */}
                              <div className="flex items-center gap-0.5 bg-white/90 rounded-xl p-0.5 border border-amber-200 shadow-xs">
                                <button
                                  type="button"
                                  onClick={() => moveCandidate(c.id, 'up')}
                                  disabled={globalIdx === 0}
                                  className="p-1 hover:bg-amber-100 rounded-lg text-primary/70 hover:text-primary transition-all disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                  title="Promote Up"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveCandidate(c.id, 'down')}
                                  disabled={globalIdx === ids.length - 1}
                                  className="p-1 hover:bg-amber-100 rounded-lg text-primary/70 hover:text-primary transition-all disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                  title="Move Down"
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex gap-3 pt-4 border-t border-outline-variant/10 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setShowBulkConfirmModal(null)} 
                    className="flex-1 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest text-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleBulkAccept} 
                    className="flex-[2] py-3.5 bg-primary text-secondary rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check size={14} />
                    Confirm & Process ({offerCandidates.length} Offers • {waitlistCandidates.length} Waitlist)
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Bulk Reject Modal */}
      <AnimatePresence>
        {showBulkConfirmModal === 'reject' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-900/20 backdrop-blur-md" onClick={() => !isBulkRejecting && setShowBulkConfirmModal(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white max-w-lg w-full rounded-[40px] p-10 relative z-10 shadow-2xl border border-outline-variant/10">
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-50 rounded-[20px] flex items-center justify-center text-red-500 mb-6">
                  <X size={32} strokeWidth={3} />
                </div>
                <h3 className="text-3xl font-black text-primary italic leading-none mb-2">Bulk Reject</h3>
                <p className="text-sm font-medium text-on-surface-variant/70">You are about to reject <span className="font-bold text-primary">{bulkInterviewIds.size}</span> selected candidate{bulkInterviewIds.size > 1 ? 's' : ''}. A regret email will be sent to their parents.</p>
                <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900/90 leading-relaxed space-y-1">
                    <p><strong>No rejection reason required</strong> — if needed, add an internal note later in each candidate's application card.</p>
                    <p><strong>Internal Only:</strong> Regret emails are sent without any internal remarks.</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowBulkConfirmModal(null)} disabled={isBulkRejecting} className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40 hover:bg-primary/5 rounded-2xl transition-colors">Cancel</button>
                <button
                  onClick={handleBulkReject}
                  disabled={isBulkRejecting}
                  className="flex-[2] py-5 bg-red-500 text-white shadow-xl shadow-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBulkRejecting ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : `Reject ${bulkInterviewIds.size} Candidates`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/40 backdrop-blur-md" onClick={() => !createInterviewMutation.isPending && setShowScheduleModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-2xl rounded-[40px] p-8 shadow-2xl relative z-10 border border-outline-variant/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary mb-2">Scheduling System</h3>
                    <h2 className="text-3xl font-black text-primary italic leading-none">Oral Interview Invite</h2>
                  </div>
                  <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-primary/5 rounded-full text-primary/20 hover:text-primary transition-all">
                    <X size={20} />
                  </button>
               </div>

               <form onSubmit={handleSchedule} className="space-y-6">
                  <MultiSelect 
                    label="Select Candidates"
                    placeholder="Choose students for this session..."
                    options={awaitingScheduling.map((app: any) => ({
                      id: app.id,
                      label: app.candidate?.fullName,
                      subtext: `${app.candidate?.grade} • APP-${app.id}`
                    }))}
                    selectedIds={selectedIds}
                    onChange={setSelectedIds}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <DatePicker 
                          label="Interview Date"
                          value={scheduleData.date}
                          onChange={d => setScheduleData({ ...scheduleData, date: d })}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Start Time</label>
                          <input 
                            type="time" 
                            value={scheduleData.startTime}
                            onChange={e => setScheduleData({ ...scheduleData, startTime: e.target.value })}
                            required
                            className="w-full bg-surface-container-low p-4 rounded-xl text-xs font-bold text-primary border-none focus:ring-2 focus:ring-secondary"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">End Time</label>
                          <input 
                            type="time" 
                            value={scheduleData.endTime}
                            onChange={e => setScheduleData({ ...scheduleData, endTime: e.target.value })}
                            required
                            className="w-full bg-surface-container-low p-4 rounded-xl text-xs font-bold text-primary border-none focus:ring-2 focus:ring-secondary"
                          />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Location</label>
                    <input 
                      type="text" 
                      value={scheduleData.location}
                      onChange={e => setScheduleData({ ...scheduleData, location: e.target.value })}
                      required
                      className="w-full bg-surface-container-low p-4 rounded-xl text-xs font-bold text-primary border-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>

                  <div className="pt-4 py-2">
                    <button 
                      type="submit"
                      disabled={createInterviewMutation.isPending || selectedIds.length === 0}
                      className="w-full py-5 bg-primary text-secondary rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createInterviewMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Communicating...</> : <><Mail size={16} /> Schedule {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} Candidates</>}
                    </button>
                    <p className="text-[9px] text-center mt-4 font-bold text-primary/30 uppercase tracking-widest">Invitation emails are dispatched immediately upon confirmation.</p>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Outcome/Rejection Modal */}
      <AnimatePresence>
        {showOutcomeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-900/20 backdrop-blur-md" onClick={() => !recordOutcomeMutation.isPending && setShowOutcomeModal(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white max-w-lg w-full rounded-[40px] p-10 relative z-10 shadow-2xl border border-outline-variant/10">
               <div className="mb-8">
                  <div className="w-16 h-16 bg-red-50 rounded-[20px] flex items-center justify-center text-red-500 mb-6">
                    <X size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-3xl font-black text-primary italic leading-none mb-2">Reject Candidate</h3>
                  <p className="text-sm font-medium text-on-surface-variant/70">This will record <span className="font-bold text-primary">{showOutcomeModal.name}</span> as rejected and send a regret email to their parents. You can add an internal note afterwards in the application card.</p>
               </div>

               <div className="flex gap-4">
                  <button onClick={() => setShowOutcomeModal(null)} disabled={recordOutcomeMutation.isPending} className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40 hover:bg-primary/5 rounded-2xl transition-colors">Cancel</button>
                  <button 
                    onClick={() => handleOutcome(showOutcomeModal.id, 'rejected')} 
                    disabled={recordOutcomeMutation.isPending}
                    className="flex-[2] py-5 bg-red-500 text-white shadow-xl shadow-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                  >
                    {recordOutcomeMutation.isPending ? 'Processing...' : 'Confirm Rejection'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

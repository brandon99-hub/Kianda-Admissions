import React, { useState, useEffect, useRef } from 'react';
import { Clock, MapPin, Calendar, Plus, Search, Loader2, Check, X, ChevronDown, ChevronRight, Mail, LayoutGrid, CalendarCheck, UserMinus, UserPlus, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminPageHeader from '../AdminPageHeader';
import DatePicker from '../../DatePicker';
import MultiSelect from '../MultiSelect';
import { useApplications, useInterviews, useCreateInterview, useRecordInterviewOutcome, useResults, useGrades } from '../../../hooks/useAdminData';
import ApplicationDetailsView from './ApplicationDetailsView';

interface ScheduledInterviewRowProps {
  key?: React.Key;
  slot: any;
  onAccept: (applicationId: number) => void;
  onReject: (applicationId: number, name: string) => void;
  onViewDetails: (app: any) => void;
  isProcessing: boolean;
  vacantSpots: number;
  index: number;
}

function ScheduledInterviewRow({ slot, onAccept, onReject, onViewDetails, isProcessing, vacantSpots, index }: ScheduledInterviewRowProps) {
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
    <tr className="hover:bg-primary/[0.02] transition-colors group">
       <td className="px-8 py-6">
          <div className="font-bold text-primary text-sm flex items-center gap-2">{slot.application?.candidate?.fullName}</div>
          <div className="text-[10px] font-medium text-on-surface-variant/40 uppercase tracking-widest">APP-{slot.applicationId.toString().padStart(4, '0')}</div>
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
                 onClick={() => setParentToggle('mother')}
                 className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${parentToggle === 'mother' ? 'bg-primary text-white' : 'text-primary/40 hover:text-primary'}`}
               >Mother</button>
               <button 
                 onClick={() => setParentToggle('father')}
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
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary">
            <MapPin size={12} className="text-secondary" /> {slot.location}
          </div>
       </td>
       <td className="px-8 py-6 text-right">
          <div className="flex justify-end items-center gap-4">
            <div className="relative" ref={dropdownRef}>
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
              onClick={() => onViewDetails(slot.application)}
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
  onSchedule: (id: number) => void;
  onAccept: (applicationId: number) => void;
  onReject: (applicationId: number, name: string) => void;
  onViewDetails: (app: any) => void;
  isProcessing: boolean;
  vacantSpots: number;
  index: number;
}

function AwaitingInterviewRow({ app, onSchedule, onAccept, onReject, onViewDetails, isProcessing, vacantSpots, index }: AwaitingInterviewRowProps) {
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
    <tr className="hover:bg-primary/[0.02] transition-colors">
       <td className="px-8 py-6">
          <div className="font-bold text-primary text-sm">{app.candidate?.fullName}</div>
          <div className="text-[10px] font-medium text-on-surface-variant/40 uppercase tracking-widest">APP-{app.id.toString().padStart(4, '0')}</div>
       </td>
       <td className="px-8 py-6 text-sm font-black text-secondary">{app.candidate?.grade}</td>
       <td className="px-8 py-6">
          <div className="flex flex-col gap-2">
            <div className="flex bg-primary/5 rounded-full p-0.5 border border-primary/10 w-fit">
               <button 
                 onClick={() => setParentToggle('mother')}
                 className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${parentToggle === 'mother' ? 'bg-primary text-white' : 'text-primary/40 hover:text-primary'}`}
               >Mother</button>
               <button 
                 onClick={() => setParentToggle('father')}
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
            <div className="relative" ref={dropdownRef}>
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
              onClick={() => onViewDetails(app)}
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
  const { data: applications = [], isLoading: appsLoading, refetch: refetchApps } = useApplications();
  const { data: grades = [] } = useGrades();
  const { data: interviews = [], isLoading: interviewsLoading, refetch: refetchInterviews } = useInterviews();
  const { data: results = [] } = useResults();
  const createInterviewMutation = useCreateInterview();
  const recordOutcomeMutation = useRecordInterviewOutcome();

  const [activeTab, setActiveTab] = useState<'scheduled' | 'awaiting'>('scheduled');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<string>('All Slots');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState<any | null>(null);
  
  // Schedule Form State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Admissions Office, Kianda School'
  });

  // Outcome Form State
  const [outcomeReason, setOutcomeReason] = useState('');

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
  const awaitingScheduling = applications.filter((app: any) => 
    app.status === 'passed_assessment' && 
    !interviews.some((int: any) => int.applicationId === app.id)
  );

  const getSlotString = (slot: any) => {
    const start = new Date(slot.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = slot.endTime ? new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    return end ? `${start} - ${end}` : start;
  };

  const availableSlots = Array.from(new Set(interviews.map(getSlotString))).sort();

  const filteredInterviews = interviews.filter((int: any) => {
    const matchesSearch = int.application?.candidate?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          int.applicationId.toString().includes(searchQuery);
    const matchesSlot = selectedSlot === 'All Slots' || getSlotString(int) === selectedSlot;
    return matchesSearch && matchesSlot;
  });

  const filteredAwaiting = awaitingScheduling.filter((app: any) => 
    app.candidate?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.id.toString().includes(searchQuery)
  );

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
    recordOutcomeMutation.mutate({
      applicationId,
      outcome,
      reason: outcome === 'rejected' ? outcomeReason : undefined
    }, {
      onSuccess: () => {
        setShowOutcomeModal(null);
        setOutcomeReason('');
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
          <div className="relative group/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within/search:text-primary transition-colors" size={16} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border border-outline-variant/10 rounded-2xl text-xs font-black placeholder:text-primary/20 focus:ring-4 focus:ring-primary/5 transition-all w-full md:w-64 shadow-sm" 
              placeholder="Search candidates..." 
            />
          </div>
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-secondary rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/10"
          >
            <Plus size={14} /> Schedule Interview
          </button>
        </div>
      </AdminPageHeader>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-outline-variant/10 pb-4">
        <button 
          onClick={() => setActiveTab('scheduled')}
          className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === 'scheduled' ? 'bg-primary text-secondary shadow-lg shadow-primary/10' : 'text-primary/40 hover:text-primary'}`}
        >
          <CalendarCheck size={14} /> Scheduled Interviews
          <span className={`px-2 py-0.5 rounded-full text-[8px] ${activeTab === 'scheduled' ? 'bg-white/20' : 'bg-primary/5'}`}>{interviews.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('awaiting')}
          className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === 'awaiting' ? 'bg-secondary text-primary shadow-lg shadow-secondary/10' : 'text-primary/40 hover:text-primary'}`}
        >
          <LayoutGrid size={14} /> Awaiting Scheduling
          <span className={`px-2 py-0.5 rounded-full text-[8px] ${activeTab === 'awaiting' ? 'bg-primary/10' : 'bg-primary/5'}`}>{awaitingScheduling.length}</span>
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
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Candidate Dossier</th>
                   {activeTab === 'scheduled' ? (
                     <>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Interview Schedule</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Parent Info</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Location</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40 text-right">Actions</th>
                     </>
                   ) : (
                     <>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Grade Applied</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Parent Info</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40">Assessment Status</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-primary/40 text-right">Actions</th>
                     </>
                   )}
                </tr>
             </thead>
             <tbody className="divide-y divide-outline-variant/5">
                {activeTab === 'scheduled' ? (
                  filteredInterviews.map((slot: any, i: number) => (
                    <ScheduledInterviewRow 
                      key={i} 
                      index={i}
                      slot={slot} 
                      isProcessing={recordOutcomeMutation.isPending}
                      vacantSpots={grades.find((g: any) => g.gradeName === slot.application?.candidate?.grade)?.vacantSpots || 0}
                      onAccept={handleOutcome.bind(null, slot.applicationId, 'accepted')}
                      onReject={(id, name) => setShowOutcomeModal({ id, name })}
                      onViewDetails={(app) => {
                        const fullApp = applications.find((a: any) => a.id === app.id);
                        const appObj = fullApp || app;
                        const appResults = results.filter((r: any) => r.applicationId === appObj.id);
                        setSelectedApp({ ...appObj, assessmentResults: appResults });
                      }}
                    />
                  ))
                ) : (
                  filteredAwaiting.map((app: any, i: number) => (
                    <AwaitingInterviewRow 
                      key={i} 
                      index={i}
                      app={app} 
                      isProcessing={recordOutcomeMutation.isPending}
                      vacantSpots={grades.find((g: any) => g.gradeName === app.candidate?.grade)?.vacantSpots || 0}
                      onAccept={handleOutcome.bind(null, app.id, 'accepted')}
                      onReject={(id, name) => setShowOutcomeModal({ id, name })}
                      onSchedule={(id) => { setSelectedIds([id]); setShowScheduleModal(true); }}
                      onViewDetails={(app) => {
                        const fullApp = applications.find((a: any) => a.id === app.id);
                        const appObj = fullApp || app;
                        const appResults = results.filter((r: any) => r.applicationId === appObj.id);
                        setSelectedApp({ ...appObj, assessmentResults: appResults });
                      }}
                    />
                  ))
                )}
                
                {!isLoading && ((activeTab === 'scheduled' && filteredInterviews.length === 0) || (activeTab === 'awaiting' && filteredAwaiting.length === 0)) && (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                       <div className="flex flex-col items-center gap-3 opacity-20">
                          <Calendar size={48} />
                          <p className="font-bold text-primary italic">No records found for this section.</p>
                       </div>
                    </td>
                  </tr>
                )}
             </tbody>
          </table>
        </div>
      </div>

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
                  <p className="text-sm font-medium text-on-surface-variant/60">Provide a professional reason for rejecting <span className="font-bold text-primary">{showOutcomeModal.name}</span> after the oral interview.</p>
               </div>

               <textarea 
                  value={outcomeReason}
                  onChange={e => setOutcomeReason(e.target.value)}
                  disabled={recordOutcomeMutation.isPending}
                  placeholder="e.g., The candidate's proficiency in core communicative areas did not meet Kianda's benchmark requirements..."
                  className="w-full h-32 p-6 bg-surface-container-lowest border border-outline-variant/20 rounded-[24px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium text-primary text-sm mb-8"
               ></textarea>

               <div className="flex gap-4">
                  <button onClick={() => setShowOutcomeModal(null)} disabled={recordOutcomeMutation.isPending} className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-primary/40 hover:bg-primary/5 rounded-2xl transition-colors">Cancel</button>
                  <button 
                    onClick={() => handleOutcome(showOutcomeModal.id, 'rejected')} 
                    disabled={!outcomeReason.trim() || recordOutcomeMutation.isPending}
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

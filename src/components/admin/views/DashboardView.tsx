import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AdminPageHeader from '../AdminPageHeader';
import { LayoutDashboard, Calendar, Bell, ChevronLeft, ChevronRight, CheckCircle2, UserPlus, Award, Clock, ArrowUpRight, GraduationCap, MapPin, ChevronDown } from 'lucide-react';
import { useApplications, useInterviews, useAssessments, useGrades } from '../../../hooks/useAdminData';

export default function DashboardView() {
  const { data: applications = [] } = useApplications();
  const { data: interviews = [] } = useInterviews();
  const { data: assessments = [] } = useAssessments();
  const { data: grades = [] } = useGrades();
  const [stats, setStats] = useState({ 
    totalApplications: 0, 
    totalVacantSpots: 0, 
    interviewsToday: 0, 
    acceptanceRate: 0 
  });

  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    fetch(`/api/admin/stats?year=${selectedYear}`)
      .then(res => res.json())
      .then(setStats)
      .catch(console.error);
  }, [selectedYear]);

  // Compute Recent Activities
  const activities = useMemo(() => {
    const events: any[] = [];
    const yearApps = applications.filter((a: any) => a.academicYear === selectedYear);
    
    yearApps.forEach((app: any) => {
      // New Application
      events.push({
        id: `new-${app.id}`,
        type: 'new',
        title: 'New Application',
        candidate: app.candidate?.fullName || 'Unknown Candidate',
        date: new Date(app.createdAt),
        icon: <UserPlus className="text-blue-500" size={14} />,
        color: 'bg-blue-50'
      });
      
      // Waitlisted
      if (app.status === 'waitlisted') {
        events.push({
          id: `waitlist-${app.id}`,
          type: 'warning',
          title: 'Candidate Waitlisted',
          candidate: app.candidate?.fullName || 'Unknown Candidate',
          date: new Date(app.updatedAt),
          icon: <Clock className="text-amber-500" size={14} />,
          color: 'bg-amber-50'
        });
      }

      // Passed Test (based on status and updatedAt)
      if (app.status === 'passed_assessment' || app.status === 'interview_scheduled' || app.status === 'accepted') {
        events.push({
          id: `passed-${app.id}`,
          type: 'passed',
          title: 'Assessment Cleared',
          candidate: app.candidate?.fullName || 'Unknown Candidate',
          date: new Date(app.updatedAt),
          icon: <CheckCircle2 className="text-green-500" size={14} />,
          color: 'bg-green-50'
        });
      }

      // Accepted
      if (app.status === 'accepted') {
        events.push({
          id: `accepted-${app.id}`,
          type: 'success',
          title: 'Student Admitted',
          candidate: app.candidate?.fullName || 'Unknown Candidate',
          date: new Date(app.updatedAt),
          icon: <Award className="text-amber-500" size={14} />,
          color: 'bg-amber-50'
        });
      }
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [applications, selectedYear]);

  // Calendar Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const total = daysInMonth(year, month);
    const start = firstDayOfMonth(year, month);
    const days = [];
    
    for (let i = 0; i < start; i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(new Date(year, month, i));
    
    return days;
  }, [viewDate]);

  // Calendar Logic helpers
  const getLocalDateString = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatTime = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getDayEvents = (date: Date) => {
    const dateStr = getLocalDateString(date);
    const dayInterviews = interviews.filter((i: any) => i.slotTime && getLocalDateString(i.slotTime) === dateStr);
    const dayAssessments = grades.filter((g: any) => g.assessmentDate && getLocalDateString(g.assessmentDate) === dateStr);
    return { dayInterviews, dayAssessments };
  };

  const selectedDayData = useMemo(() => selectedDate ? getDayEvents(selectedDate) : null, [selectedDate, interviews, assessments]);

  return (
    <div className="space-y-12">
      <AdminPageHeader 
        title="Overview" 
        description={`${selectedYear} Admission Cycle Real-time indicators.`}
        icon={LayoutDashboard} 
      >
        <div className="relative group/year w-48">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="appearance-none w-full bg-white px-6 py-3 rounded-xl font-black text-primary border border-outline-variant/10 focus:ring-4 focus:ring-primary/5 cursor-pointer transition-all pr-12 shadow-sm text-xs"
          >
            {Array.from({ length: 5 }, (_, i) => 2026 + i).map(y => (
              <option key={y} value={y}>Cycle {y}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none group-hover/year:text-primary transition-colors" />
        </div>
      </AdminPageHeader>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Total Applications" value={stats.totalApplications} subValue={`${stats.totalVacantSpots} Vacancies`} color="blue" />
        <StatCard title="Interviews Today" value={stats.interviewsToday} color="secondary" />
        <StatCard title="Acceptance Rate" value={stats.acceptanceRate} isPercentage color="green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Calendar Card */}
        <div className="xl:col-span-2 bg-white rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-outline-variant/10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-headline font-black text-primary flex items-center gap-3">
                <Calendar size={20} className="text-secondary" /> Academic Schedule
              </h3>
              <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mt-1">Interviews & Assessments</p>
            </div>
            <div className="flex items-center gap-4 bg-primary/5 p-1.5 rounded-2xl">
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 hover:bg-white rounded-xl transition-all text-primary/40 hover:text-primary"><ChevronLeft size={16}/></button>
              <span className="text-xs font-black text-primary min-w-[100px] text-center uppercase tracking-widest">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 hover:bg-white rounded-xl transition-all text-primary/40 hover:text-primary"><ChevronRight size={16}/></button>
            </div>
          </div>

          <div className="flex flex-col gap-16">
            <div className="flex-1">
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="h-10 flex items-center justify-center text-[9px] font-black uppercase tracking-[0.2em] text-primary/20">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} className="h-14 lg:h-16" />;
                  const { dayInterviews, dayAssessments } = getDayEvents(day);
                  const isSelected = selectedDate.toDateString() === day.toDateString();
                  const isToday = new Date().toDateString() === day.toDateString();
                  const hasEvents = dayInterviews.length > 0 || dayAssessments.length > 0;

                  return (
                    <button 
                      key={i} 
                      onClick={() => setSelectedDate(day)}
                      className={`h-14 lg:h-16 rounded-2xl flex flex-col items-center justify-center relative transition-all group
                        ${isSelected ? 'bg-primary text-white shadow-xl shadow-primary/20 ring-4 ring-primary/10' : 'hover:bg-primary/5 text-primary'}
                        ${isToday && !isSelected ? 'border-2 border-secondary/30' : ''}
                      `}
                    >
                      <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-primary'}`}>{day.getDate()}</span>
                      {hasEvents && !isSelected && (
                         <div className="flex gap-1 mt-1">
                           {dayInterviews.length > 0 && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                           {dayAssessments.length > 0 && <span className="w-1.5 h-1.5 bg-secondary rounded-full" />}
                         </div>
                      )}
                      {isSelected && hasEvents && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-secondary rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full pt-12 border-t border-outline-variant/10">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 mb-8 flex items-center justify-between">
                 <span className="flex items-center gap-2 font-headline text-primary font-black"><Clock size={12} className="text-secondary" /> {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} Schedule</span>
                 <span className="text-[9px] font-bold text-on-surface-variant/30 italic">Nairobi Time (GMT+3)</span>
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-2">
                  {selectedDayData?.dayInterviews.length === 0 && selectedDayData?.dayAssessments.length === 0 && (
                    <div className="text-center py-12">
                       <div className="text-[10px] font-bold text-on-surface-variant/30 italic">No events scheduled</div>
                    </div>
                  )}
                  {selectedDayData?.dayAssessments.map((ass: any, i: number) => (
                    <div key={`ass-${i}`} className="p-4 bg-secondary/10 rounded-2xl border-2 border-secondary/20 group hover:border-secondary transition-all shadow-lg shadow-secondary/5">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-5 h-5 rounded bg-secondary text-primary flex items-center justify-center">
                           <GraduationCap size={12} />
                         </div>
                         <div className="text-[8px] font-black text-secondary uppercase tracking-[0.2em]">Institutional Assessment</div>
                       </div>
                       <div className="text-sm font-black text-primary leading-tight">{ass.gradeName} - Entrance Test</div>
                       <div className="text-[9px] font-bold text-primary/40 mt-1 uppercase tracking-widest">Year {ass.academicYear} Cycle</div>
                    </div>
                  ))}
                  {selectedDayData?.dayInterviews.map((int: any, i: number) => (
                    <div key={`int-${i}`} className="p-4 bg-primary/5 rounded-2xl border border-primary/5 group hover:border-primary/20 transition-all">
                       <div className="text-[8px] font-bold text-primary/40 uppercase tracking-widest mb-1">{formatTime(int.slotTime)}</div>
                       <div className="text-xs font-black text-primary leading-tight truncate">
                         {int.application?.candidate?.fullName || 'Scheduled Interview'}
                         {int.groupName && <span className="block text-[8px] opacity-40 font-bold mt-0.5">{int.groupName}</span>}
                       </div>
                       <div className="text-[9px] font-bold text-primary/30 mt-1 flex items-center gap-1"><MapPin size={8}/> {int.location || 'Admission Office'}</div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Recent Activities Card */}
        <div className="bg-white rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-outline-variant/10 flex flex-col h-full self-stretch">
          <div className="mb-8">
             <h3 className="text-xl font-headline font-black text-primary flex items-center justify-between">
               <span className="flex items-center gap-3"><Bell size={20} className="text-secondary" /> Activity</span>
               <ArrowUpRight size={18} className="text-primary/20" />
             </h3>
             <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mt-1">Live Notifications</p>
          </div>

          <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
             <AnimatePresence mode="popLayout">
               {activities.length > 0 ? activities.map((act, i) => (
                 <motion.div 
                  key={act.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pl-8 group"
                 >
                   {/* Vertical Line */}
                   {i !== activities.length - 1 && <div className="absolute left-[7px] top-6 bottom-[-24px] w-0.5 bg-outline-variant/10 group-hover:bg-secondary/20 transition-colors" />}
                   
                   {/* Icon */}
                   <div className={`absolute left-0 top-0 w-4 h-4 rounded-full ${act.color} border border-white shadow-sm flex items-center justify-center z-10 group-hover:scale-125 transition-transform`}>
                     {act.icon}
                   </div>

                   <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">{act.title}</span>
                        <span className="text-[9px] font-bold text-on-surface-variant/30">{formatActivityDate(act.date)}</span>
                      </div>
                      <div className="text-xs font-black text-primary group-hover:text-secondary transition-colors truncate">{act.candidate}</div>
                   </div>
                 </motion.div>
               )) : (
                 <div className="text-center py-20">
                    <div className="text-[10px] font-bold text-on-surface-variant/30 italic">No recent activity detected</div>
                 </div>
               )}
             </AnimatePresence>
          </div>

          <button className="w-full py-4 mt-8 bg-primary/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 hover:bg-primary hover:text-white transition-all">View All Activity</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, color, isPercentage }: { title: string, value: any, subValue?: string, color: string, isPercentage?: boolean }) {
  const colorMap: any = {
    blue: 'text-primary',
    secondary: 'text-secondary',
    green: 'text-green-600'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-10 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-outline-variant/10 relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${color === 'blue' ? 'bg-primary/5' : color === 'secondary' ? 'bg-secondary/5' : 'bg-green-50'} rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 italic">{title}</span>
      <div className="flex items-baseline gap-2 mt-4">
        <div className={`text-7xl font-headline font-black ${colorMap[color]}`}>{value}</div>
        {isPercentage && <div className={`text-2xl font-headline font-black ${colorMap[color]} opacity-30`}>%</div>}
        {subValue && (
          <div className="ml-4 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            {subValue}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatActivityDate(date: Date) {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AdminPageHeader from '../AdminPageHeader';
import { LayoutDashboard, Calendar, Bell, ChevronLeft, ChevronRight, CheckCircle2, UserPlus, Award, Clock, ArrowUpRight, GraduationCap, MapPin, ChevronDown, XCircle, TrendingUp, X, AlertTriangle } from 'lucide-react';
import { useApplications, useInterviews, useAssessments, useGrades, useCycles, useCreateCycle, useDeleteCycle } from '../../../hooks/useAdminData';
import { authFetch } from '../../../utils/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, Line, Cell, Legend } from 'recharts';

export default function DashboardView() {
  const { data: applications = [] } = useApplications();
  const { data: interviews = [] } = useInterviews();
  const { data: assessments = [] } = useAssessments();
  const { data: grades = [] } = useGrades();
  const { data: cycles = [] } = useCycles();
  const createCycle = useCreateCycle();
  const deleteCycle = useDeleteCycle();
  const [stats, setStats] = useState({ 
    totalApplications: 0, 
    totalVacantSpots: 0, 
    interviewsToday: 0, 
    acceptanceRate: 0 
  });

  const sortedCycles = useMemo(() => {
    return [...cycles].sort((a: any, b: any) => {
      const now = new Date();
      const aActive = a.isActive && now >= new Date(a.startDate) && now <= new Date(a.endDate);
      const bActive = b.isActive && now >= new Date(b.startDate) && now <= new Date(b.endDate);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return b.academicYear - a.academicYear;
    });
  }, [cycles]);

  const [selectedYear, setSelectedYear] = useState(2026);

  useEffect(() => {
    if (sortedCycles.length > 0 && !sortedCycles.some((c: any) => c.academicYear === selectedYear)) {
      setSelectedYear(sortedCycles[0].academicYear);
    }
  }, [sortedCycles, selectedYear]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [activityPage, setActivityPage] = useState(1);
  const itemsPerActivityPage = 10;

  useEffect(() => {
    authFetch(`/api/admin/stats?year=${selectedYear}`)
      .then(res => res.json())
      .then(setStats)
      .catch(console.error);
  }, [selectedYear]);

  // Compute Recent Activities
  const activities = useMemo(() => {
    const events: any[] = [];
    const yearApps = applications.filter((a: any) => a.academicYear === selectedYear);

    const PRIORITY: Record<string, number> = {
      success: 5,
      warning: 4,
      error: 4,
      interview: 3,
      passed: 2,
      new: 1
    };

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
      
      // Assessment Failed
      if (app.status === 'failed' || app.status === 'rejected') {
        events.push({
          id: `failed-${app.id}`,
          type: 'error',
          title: 'Assessment Failed',
          candidate: app.candidate?.fullName || 'Unknown Candidate',
          date: new Date(app.updatedAt),
          icon: <XCircle className="text-red-500" size={14} />,
          color: 'bg-red-50'
        });
      }

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

      // Interview Scheduled
      const interview = interviews.find((i: any) => i.applicationId === app.id);
      if (interview) {
        events.push({
          id: `interview-${app.id}`,
          type: 'interview',
          title: 'Interview Scheduled',
          candidate: app.candidate?.fullName || 'Unknown Candidate',
          date: new Date(interview.createdAt || app.updatedAt),
          icon: <Calendar className="text-primary" size={14} />,
          color: 'bg-primary/5'
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

    return events.sort((a, b) => {
      const dateDiff = b.date.getTime() - a.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      // If same second, use journey priority
      return (PRIORITY[b.type] || 0) - (PRIORITY[a.type] || 0);
    });
  }, [applications, selectedYear, interviews]);

  const totalActivityPages = Math.ceil(activities.length / itemsPerActivityPage);
  const paginatedActivities = activities.slice(
    (activityPage - 1) * itemsPerActivityPage,
    activityPage * itemsPerActivityPage
  );

  const chartData = useMemo(() => {
    return grades.map((g: any) => {
      const gradeApps = applications.filter((app: any) => {
        const matchesYear = Number(app.academicYear) === Number(selectedYear);
        const appGrade = String(app.candidate?.grade || '').toLowerCase().trim();
        const gName = String(g.gradeName || '').toLowerCase().trim();
        const gId = String(g.id || '');
        
        const matchesGrade = appGrade === gName || appGrade === gId || appGrade.replace(/\s+/g, '') === gName.replace(/\s+/g, '');
        return matchesYear && matchesGrade;
      });
      
      const admittedCount = gradeApps.filter(a => a.status === 'accepted').length;
      const trueCapacity = (Number(g.vacantSpots) || 0) + admittedCount;
      
      return {
        name: g.gradeName,
        applied: gradeApps.length,
        admitted: admittedCount,
        capacity: trueCapacity,
        vacancies: Number(g.vacantSpots) || 0
      };
    }).sort((a, b) => {
      const getNum = (s: string) => {
        const match = s.match(/\d+/);
        return match ? parseInt(match[0]) : 999;
      };
      return getNum(a.name) - getNum(b.name);
    });
  }, [grades, applications, selectedYear]);

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

  const selectedDayData = useMemo(() => selectedDate ? getDayEvents(selectedDate) : null, [selectedDate, interviews, assessments, grades]);

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
            {sortedCycles.length === 0 && <option value={selectedYear}>Cycle {selectedYear}</option>}
            {sortedCycles.map((c: any) => (
              <option key={c.id} value={c.academicYear}>Cycle {c.academicYear}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none group-hover/year:text-primary transition-colors" />
        </div>
      </AdminPageHeader>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Total Applications" value={stats.totalApplications || 0} subValue={`${stats.totalVacantSpots || 0} Vacancies`} color="blue" />
        <StatCard title="Interviews Today" value={stats.interviewsToday} color="secondary" />
        <StatCard title="Acceptance Rate" value={stats.acceptanceRate} isPercentage color="green" />
      </div>

      <CycleManagementCard cycles={cycles} createCycle={createCycle} deleteCycle={deleteCycle} />

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
               {paginatedActivities.length > 0 ? paginatedActivities.map((act, i) => (
                 <motion.div 
                  key={act.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pl-8 group"
                 >
                   {/* Vertical Line */}
                   {i !== paginatedActivities.length - 1 && <div className="absolute left-[7px] top-6 bottom-[-24px] w-0.5 bg-outline-variant/10 group-hover:bg-secondary/20 transition-colors" />}
                   
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

          <div className="flex items-center justify-between pt-6 border-t border-outline-variant/5">
             <div className="text-[9px] font-bold text-primary/30 uppercase tracking-widest">Page {activityPage} of {totalActivityPages || 1}</div>
             <div className="flex gap-2">
                <button 
                  disabled={activityPage === 1}
                  onClick={() => setActivityPage(p => p - 1)}
                  className="p-2 bg-primary/5 rounded-lg text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-20"
                >
                  <ChevronLeft size={12} />
                </button>
                <button 
                   disabled={activityPage === totalActivityPages || totalActivityPages === 0}
                   onClick={() => setActivityPage(p => p + 1)}
                   className="p-2 bg-primary/5 rounded-lg text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-20"
                >
                  <ChevronRight size={12} />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Institutional Demand Profile - Area/Line Chart */}
      <div className="bg-white rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-outline-variant/10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-headline font-black text-primary flex items-center gap-3">
              <TrendingUp size={20} className="text-secondary" /> Academic Demand Profile
            </h3>
            <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mt-1">Grade-wise Interest Wave vs. Institutional Ceiling</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-primary" />
              <span className="text-[9px] font-black uppercase tracking-widest text-primary/50">Demand (Apps)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-8 h-4 bg-secondary/20 border border-secondary/30 rounded-sm" />
               <span className="text-[9px] font-black uppercase tracking-widest text-primary/50">Enrollment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border-t-2 border-dashed border-primary/20" />
              <span className="text-[9px] font-black uppercase tracking-widest text-primary/50">Capacity Ceiling</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorAdmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFC425" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FFC425" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#18216D', fontSize: 10, fontWeight: 900 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#18216D', fontSize: 10, fontWeight: 900 }}
                width={30}
              />
              <Tooltip 
                cursor={{ stroke: '#18216D', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const demandPercent = data.capacity > 0 ? Math.round((data.applied / data.capacity) * 100) : 0;
                    return (
                      <div className="bg-white/95 p-5 rounded-[24px] shadow-2xl border border-outline-variant/10 backdrop-blur-xl">
                        <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">{label}</p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-primary/[0.02] p-3 rounded-xl">
                            <div>
                               <p className="text-[9px] font-bold text-primary/30 uppercase tracking-widest">Enrolled</p>
                               <p className="text-xs font-black text-primary mt-1">{data.admitted} <span className="text-primary/20">/ {data.capacity}</span></p>
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] font-bold text-secondary uppercase tracking-widest">Fill Rate</p>
                               <p className="text-xs font-black text-secondary mt-1">{Math.round((data.admitted/data.capacity)*100)}%</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center border-t border-primary/5 pt-3">
                             <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Candidate Demand</span>
                             <span className="text-xs font-black text-primary">{data.applied} APPS</span>
                          </div>
                          {demandPercent > 100 && (
                            <div className="pt-2 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                               <span className="text-[9px] font-bold text-red-600/60 uppercase tracking-widest">Exceeds Ceiling (+{data.applied - data.capacity})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="admitted" 
                stroke="#FFC425" 
                fillOpacity={1} 
                fill="url(#colorAdmitted)" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="applied" 
                stroke="#18216D" 
                strokeWidth={3} 
                dot={{ fill: '#18216D', strokeWidth: 2, r: 4, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#FFC425' }}
              />
              <Line 
                type="step" 
                dataKey="capacity" 
                stroke="#18216D" 
                strokeWidth={1} 
                strokeDasharray="6 6" 
                opacity={0.2}
                dot={false}
                activeDot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
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

function CycleManagementCard({ cycles, createCycle, deleteCycle }: any) {
  const [year, setYear] = useState<number>(new Date().getFullYear() + 1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [editingCycle, setEditingCycle] = useState<any>(null);
  const itemsPerPage = 12;
  
  const sortedCycles = useMemo(() => {
    return [...cycles].sort((a: any, b: any) => {
      const now = new Date();
      const aActive = a.isActive && now >= new Date(a.startDate) && now <= new Date(a.endDate);
      const bActive = b.isActive && now >= new Date(b.startDate) && now <= new Date(b.endDate);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return b.academicYear - a.academicYear;
    });
  }, [cycles]);

  const currentCycle = useMemo(() => {
    return sortedCycles.find((c: any) => {
      const now = new Date();
      return c.isActive && now >= new Date(c.startDate) && now <= new Date(c.endDate);
    });
  }, [sortedCycles]);

  const otherCycles = useMemo(() => {
    return sortedCycles.filter(c => c.id !== currentCycle?.id);
  }, [sortedCycles, currentCycle]);

  const totalPages = Math.ceil(otherCycles.length / itemsPerPage) || 1;
  const paginatedCycles = otherCycles.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSave = () => {
    if (!startDate || !endDate) return;
    createCycle.mutate({
      id: editingCycle?.id,
      academicYear: year,
      startDate,
      endDate,
      isActive: editingCycle?.isActive ?? true
    }, {
      onSuccess: () => {
        setEditingCycle(null);
        setYear(new Date().getFullYear() + 1);
        setStartDate('');
        setEndDate('');
      }
    });
  };

  const handleEditClick = (cycle: any) => {
    setEditingCycle(cycle);
    setYear(cycle.academicYear);
    const formatDateTime = (dStr: string) => {
      const d = new Date(dStr);
      const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      return localISOTime;
    };
    setStartDate(formatDateTime(cycle.startDate));
    setEndDate(formatDateTime(cycle.endDate));
  };

  const renderCycleCard = (c: any, isCurrent: boolean) => {
    const now = new Date();
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    const isPast = end < now;

    return (
      <div key={c.id} className={`p-6 rounded-3xl border-2 transition-all relative group flex flex-col h-full ${isCurrent ? 'bg-green-50/50 border-green-500/20' : 'bg-white border-outline-variant/10 hover:border-primary/20'}`}>
        {isCurrent ? (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-2 py-1 bg-green-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> Current
          </div>
        ) : isPast ? (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-2 py-1 bg-surface-container-low rounded-lg text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">
            Past
          </div>
        ) : null}
        
        <h4 className="text-lg font-black text-primary mb-6 mt-1">Year {c.academicYear}</h4>
        
        <div className="space-y-3 mb-6 flex-1">
          <div className="flex flex-col text-xs">
              <span className="font-black text-[9px] uppercase tracking-widest text-primary/30 mb-0.5">Starts</span>
              <span className="font-bold text-primary">{start.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          <div className="flex flex-col text-xs">
              <span className="font-black text-[9px] uppercase tracking-widest text-primary/30 mb-0.5">Ends</span>
              <span className="font-bold text-primary">{end.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <button 
            onClick={() => handleEditClick(c)}
            className="flex-1 py-2 bg-primary/5 text-primary hover:bg-primary/10 transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100"
          >
            Edit
          </button>
          <button 
            onClick={() => deleteCycle.mutate(c.id)}
            className="flex-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-outline-variant/10 mt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-headline font-black text-primary flex items-center gap-3">
            <Calendar size={20} className="text-secondary" /> Admission Cycles
          </h3>
          <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest mt-1">Manage Application Durations</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Top Section: Form and Current Cycle */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 xl:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-black text-primary">
                {editingCycle ? `Edit Cycle (Year ${editingCycle.academicYear})` : 'Create New Cycle'}
              </h4>
              {editingCycle && (
                <button 
                  onClick={() => {
                    setEditingCycle(null);
                    setYear(new Date().getFullYear() + 1);
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <X size={12} /> Cancel Edit
                </button>
              )}
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 block mb-1">Academic Year</label>
                <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} className="w-full bg-white p-3 rounded-xl border border-outline-variant/10 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 block mb-1">Start Date & Time</label>
                  <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white p-3 rounded-xl border border-outline-variant/10 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 block mb-1">End Date & Time</label>
                  <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white p-3 rounded-xl border border-outline-variant/10 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 outline-none" />
                </div>
              </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={createCycle.isPending}
              className="w-full mt-4 py-3 bg-secondary text-primary font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#e5b021] transition-colors"
            >
              {createCycle.isPending ? 'Saving...' : (editingCycle ? 'Update Cycle' : 'Save Cycle')}
            </button>
          </div>

          {/* Current Cycle */}
          <div className="xl:col-span-1">
            {currentCycle ? (
              renderCycleCard(currentCycle, true)
            ) : (
              <div className="h-full bg-surface-container-lowest/50 border border-outline-variant/5 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                <AlertTriangle size={24} className="text-primary/20 mb-2" />
                <div className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">No Active Cycle</div>
                <p className="text-xs text-primary/30 mt-2">Applications are currently closed to the public.</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Created Cycles Grid */}
        <div className="flex flex-col gap-6 pt-8 border-t border-outline-variant/5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/40 px-2">Other Defined Cycles</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedCycles.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-[10px] font-bold text-on-surface-variant/30 italic uppercase tracking-widest">
                No other cycles defined
              </div>
            )}
            {paginatedCycles.map((c: any) => renderCycleCard(c, false))}
          </div>

          {/* Pagination Controls */}
          {otherCycles.length > 0 && (
            <div className="flex items-center justify-between pt-4 mt-auto">
               <div className="text-[10px] font-black uppercase tracking-widest text-primary/30 px-2">
                 Page {page} of {totalPages}
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   disabled={page === 1}
                   className="p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                 >
                   <ChevronLeft size={16} />
                 </button>
                 <button 
                   onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                   disabled={page === totalPages}
                   className="p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                 >
                   <ChevronRight size={16} />
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


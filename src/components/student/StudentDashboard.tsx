import React, { useState } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import { Batch, ScheduleClass, BatchContent } from '../../types';
import { NoBatchState } from './NoBatchState';
import { ClassHistoryView } from '../common/ClassHistoryView';
import {
  Calendar,
  BookOpen,
  Video,
  Clock,
  Youtube,
  PlusCircle,
  Sparkles,
  PlayCircle,
  MapPin,
  FileText,
  Download,
  Bell,
  Megaphone,
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenJoinBatchModal: () => void;
  onOpenMailModal: () => void;
  onPlayVideo: (content: BatchContent) => void;
  onJoinLiveMeeting: (cls: ScheduleClass) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenJoinBatchModal,
  onOpenMailModal,
  onPlayVideo,
  onJoinLiveMeeting,
}) => {
  const {
    currentUser,
    getStudentBatches,
    getStudentUnifiedSchedule,
    content,
    announcements,
    memberships,
    getBatchResources,
  } = useKaksha();

  const todayObj = new Date();
  const tomorrowObj = new Date();
  tomorrowObj.setDate(todayObj.getDate() + 1);

  const todayIso = todayObj.toISOString().split('T')[0];
  const tomorrowIso = tomorrowObj.toISOString().split('T')[0];

  const todayLabel = `Today (${todayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  const tomorrowLabel = `Tomorrow (${tomorrowObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

  const [selectedDate, setSelectedDate] = useState(todayIso);

  if (!currentUser) return null;

  const studentBatches = getStudentBatches(currentUser.id);
  const filteredSchedule = getStudentUnifiedSchedule(currentUser.id, selectedDate);

  if (studentBatches.length === 0) {
    return (
      <NoBatchState
        onOpenJoinModal={onOpenJoinBatchModal}
        onOpenMailModal={onOpenMailModal}
      />
    );
  }

  const studentBatchIds = studentBatches.map((b) => b.id);
  const availableContent = content.filter((c) => studentBatchIds.includes(c.batchId));

  return (
    <div className="space-y-6">
      {/* Student Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-900/80 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-800 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Unified Student Operating Layer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser.name}! 🎓
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Student ID:{' '}
              <span className="font-mono font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {currentUser.kakshaId}
              </span>
              {' • '}
              Enrolled in{' '}
              <strong className="text-white">{studentBatches.length} Independent Batches</strong>
            </p>
          </div>

          <button
            onClick={onOpenJoinBatchModal}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Join Another Batch</span>
          </button>
        </div>
      </div>

      {/* CORE HERO FEATURE: UNIFIED AGGREGATED SCHEDULE */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg font-extrabold text-slate-900">
                Unified Academic Schedule Aggregator
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically stitches independent timetables from Teacher A, Teacher B, Teacher C into one timeline.
            </p>
          </div>

          {/* Date Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setSelectedDate(todayIso)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDate === todayIso
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {todayLabel}
            </button>
            <button
              onClick={() => setSelectedDate(tomorrowIso)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDate === tomorrowIso
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tomorrowLabel}
            </button>
          </div>
        </div>

        {/* Timeline View */}
        {filteredSchedule.length === 0 ? (
          <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No classes scheduled for {selectedDate}.</p>
            <p className="text-[11px] text-slate-400">Enjoy your free study day!</p>
          </div>
        ) : (
          <div className="relative pl-4 sm:pl-6 border-l-2 border-indigo-100 space-y-6">
            {filteredSchedule.map((cls) => {
              const classRes = getBatchResources(cls.batchId);

              return (
                <div key={cls.id} className="relative group">
                  <div className="absolute -left-[25px] sm:-left-[33px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />

                  <div className="p-5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                          ⏰ {cls.startTime} - {cls.endTime}
                        </span>
                        <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                          {cls.batchName}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-500">
                          by {cls.teacherName}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{cls.title}</h3>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-semibold text-indigo-600">{cls.subject}</span>
                        <span>•</span>
                        <span>Mode: {cls.classType === 'online' ? 'Live In-App Class' : 'Tuition Hub'}</span>
                      </div>

                      {/* Class Attached Study Materials Bar */}
                      {classRes.length > 0 && (
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <FileText className="w-3 h-3 text-indigo-500" />
                            <span>Notes & Homework:</span>
                          </span>
                          {classRes.map((r) => (
                            <a
                              key={r.id}
                              href={r.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-indigo-100 transition-colors"
                            >
                              <span>📄 {r.title}</span>
                              <Download className="w-3 h-3 text-indigo-500" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {cls.classType === 'online' ? (
                        <button
                          onClick={() => onJoinLiveMeeting(cls)}
                          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-95"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Live In-App Class</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-200/80 px-3 py-2 rounded-xl">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{cls.roomNo || 'Tuition Room'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Enrolled Batches & Recorded Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Enrolled Batches Roster */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Your Enrolled Tuition Batches</h3>
              <span className="text-xs font-semibold text-slate-400">
                {studentBatches.length} Active Classes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {studentBatches.map((batch) => {
                const mem = memberships.find((m) => m.batchId === batch.id && m.studentId === currentUser.id);

                return (
                  <div
                    key={batch.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {batch.subject}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{batch.name}</h4>
                        <p className="text-xs text-slate-500">Teacher: {batch.teacherName}</p>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                        {batch.code}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">Monthly Fee Status:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                          mem?.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {mem?.paymentStatus === 'paid' ? 'Paid ✓' : 'Pending ⏳'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Teacher Notices Feed & Recorded YouTube Lectures */}
        <div className="space-y-6">
          {/* Live Compact Teacher Notice / Updates Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Teacher Notices & Updates</h3>
                  <p className="text-[10px] text-slate-400">Live feed of teacher posts, files & updates</p>
                </div>
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                Real-Time
              </span>
            </div>

            {(() => {
              const myBatchIds = studentBatches.map((b) => b.id);
              const myAnnouncements = announcements.filter((a) => myBatchIds.includes(a.batchId));

              if (myAnnouncements.length === 0) {
                return (
                  <div className="p-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                    <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">No notices posted yet</p>
                    <p className="text-[10px] text-slate-400">
                      When your teachers post notices, upload new notes, or schedule special classes, they will appear here instantly!
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {myAnnouncements.map((anc) => (
                    <div
                      key={anc.id}
                      className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/70 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-800">
                        <span className="truncate">{anc.batchName} • {anc.teacherName}</span>
                        <span className="shrink-0 text-slate-400">{new Date(anc.postedAt).toLocaleDateString()}</span>
                      </div>
                      <h5 className="font-bold text-slate-900 leading-tight">{anc.title}</h5>
                      <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{anc.content}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Youtube className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">Protected Recorded Lectures</h3>
            </div>

            <div className="space-y-3">
              {availableContent.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-4 text-center">
                  No recorded lectures uploaded for your batches yet.
                </p>
              ) : (
                availableContent.map((cnt) => (
                  <div
                    key={cnt.id}
                    onClick={() => onPlayVideo(cnt)}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 cursor-pointer transition-all flex items-center gap-3 group"
                  >
                    <div className="w-16 h-12 rounded-xl bg-slate-900 overflow-hidden shrink-0 relative">
                      <img
                        src={cnt.thumbnailUrl}
                        alt={cnt.title}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <PlayCircle className="w-5 h-5 text-white absolute inset-0 m-auto group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="overflow-hidden">
                      <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                        {cnt.title}
                      </h5>
                      <p className="text-[10px] text-slate-400">{cnt.batchName}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PREVIOUS CLASSES & BACKLOG CLEARING SECTION */}
      <ClassHistoryView batchId="all" />
    </div>
  );
};

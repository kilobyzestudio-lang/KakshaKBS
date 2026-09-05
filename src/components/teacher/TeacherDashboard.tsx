import React, { useState } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import { Batch, ScheduleClass } from '../../types';
import { ScheduleBuilderModal } from './ScheduleBuilderModal';
import {
  Users,
  BookOpen,
  Calendar,
  IndianRupee,
  Plus,
  Video,
  Copy,
  Check,
  Clock,
  ChevronRight,
  RefreshCw,
  Bell,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ClipboardCheck,
  Edit3,
  Trash2,
  Repeat,
} from 'lucide-react';

interface TeacherDashboardProps {
  onSelectBatch: (batchId: string) => void;
  onOpenCreateBatchModal: () => void;
  onOpenScheduleModal: (batchId?: string) => void;
  onStartLiveMeeting: (cls: ScheduleClass) => void;
  onNavigateToStudents?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onSelectBatch,
  onOpenCreateBatchModal,
  onOpenScheduleModal,
  onStartLiveMeeting,
  onNavigateToStudents,
}) => {
  const {
    currentUser,
    getTeacherBatches,
    memberships,
    classes,
    announcements,
    resetAllFeesForTeacher,
    getPendingJoinRequestsForTeacher,
    respondToMailRequest,
    getBatchAttendanceStats,
    getTeacherDailySchedule,
    deleteScheduleClass,
    deleteRecurringSlot,
  } = useKaksha();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showFeeResetConfirm, setShowFeeResetConfirm] = useState(false);
  const [editingClass, setEditingClass] = useState<ScheduleClass | null>(null);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; isPermanent?: boolean; recurringSlotId?: string } | null>(null);

  if (!currentUser) return null;

  const teacherBatches = getTeacherBatches(currentUser.id);
  const batchIds = teacherBatches.map((b) => b.id);

  const teacherMemberships = memberships.filter((m) => batchIds.includes(m.batchId));
  const totalStudents = teacherMemberships.length;
  const pendingPayments = teacherMemberships.filter((m) => m.paymentStatus === 'pending').length;

  const pendingRequests = getPendingJoinRequestsForTeacher(currentUser.kakshaId);

  const todayStr = new Date().toISOString().split('T')[0];
  // Automatically fetches both direct classes AND permanent weekly/monthly recurring slots into today's timetable!
  const todaysClasses = getTeacherDailySchedule(currentUser.id, todayStr);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmFeeReset = () => {
    resetAllFeesForTeacher(currentUser.id);
    setShowFeeResetConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-800/80 text-indigo-200 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-700/50 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Teacher Operating Centre</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Namaste, {currentUser.name}! 👋
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-xl">
              Teacher ID: <span className="font-mono font-bold text-white bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-700/50">{currentUser.kakshaId}</span>. All your tuition batches, manual student join approvals, attendance registers, and monthly fee records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreateBatchModal}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Batch</span>
            </button>
            <button
              onClick={() => onOpenScheduleModal()}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2 text-xs sm:text-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Class</span>
            </button>
          </div>
        </div>
      </div>

      {/* PENDING JOIN REQUESTS ALERT SECTION */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-base font-extrabold text-amber-950">
                Pending Student Join Requests ({pendingRequests.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg">
              Manual Approval Required
            </span>
          </div>

          <p className="text-xs text-amber-800">
            These students submitted your batch code. Since join requests require your explicit approval, they will only be admitted once you click <strong>Approve</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                    <span className="font-mono text-indigo-600 font-bold">Student ID: {req.senderId}</span>
                    <span>{new Date(req.sentAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{req.senderName}</h4>
                  <p className="text-xs text-slate-600 mt-1">{req.body}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => respondToMailRequest(req.id, 'accept')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Enroll</span>
                  </button>
                  <button
                    onClick={() => respondToMailRequest(req.id, 'decline')}
                    className="px-4 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs py-2 rounded-xl transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Active Batches</p>
            <p className="text-2xl font-extrabold text-slate-900">{teacherBatches.length}</p>
          </div>
        </div>

        <div
          onClick={onNavigateToStudents}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 cursor-pointer hover:border-indigo-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Enrolled Students</p>
            <p className="text-2xl font-extrabold text-slate-900">{totalStudents}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Today's Classes</p>
            <p className="text-2xl font-extrabold text-slate-900">{todaysClasses.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Pending Fees</p>
              <p className="text-2xl font-extrabold text-rose-600">{pendingPayments} Students</p>
            </div>
          </div>
          <button
            onClick={() => setShowFeeResetConfirm(true)}
            title="Reset All Fees for New Month"
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fee Reset Modal */}
      {showFeeResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">Reset Monthly Fee Statuses?</h3>
            <p className="text-xs text-slate-600 mb-4">
              This will set all enrolled students across your batches to <span className="font-semibold text-rose-600">"Pending"</span> for the new billing cycle.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFeeResetConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFeeReset}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Today's Schedule & Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Teaching Schedule & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">Today's Teaching Timetable</h3>
                <span className="text-xs text-slate-400 font-medium">({todayStr})</span>
              </div>
              <button
                onClick={() => onOpenScheduleModal()}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>+ Add Class</span>
              </button>
            </div>

            {todaysClasses.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No classes scheduled for today.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click "+ Add Class" to set up today's live lecture or offline session.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {cls.startTime.split(' ')[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {cls.batchName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {cls.classType === 'online' ? '📹 Live Online' : '📍 In-Person'}
                          </span>
                          {cls.isPermanent && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Repeat className="w-2.5 h-2.5" /> Permanent Timetable
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{cls.title}</h4>
                        <p className="text-xs text-slate-500">
                          Time: {cls.startTime} - {cls.endTime}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {cls.classType === 'online' ? (
                        <button
                          onClick={() => onStartLiveMeeting(cls)}
                          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all transform active:scale-95"
                        >
                          <Video className="w-4 h-4" />
                          <span>Start In-App Class</span>
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-3 py-1.5 rounded-xl">
                          {cls.roomNo || 'Tuition Room'}
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setEditingClass(cls);
                          setShowEditScheduleModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-xl border border-slate-200 transition-colors"
                        title="Edit Timetable Session"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setDeleteTarget({
                            id: cls.id,
                            title: cls.title,
                            isPermanent: cls.isPermanent,
                            recurringSlotId: cls.recurringSlotId,
                          });
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
                        title="Delete Timetable Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Batches Workspaces Overview */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Your Active Batches</h3>
              <button
                onClick={onOpenCreateBatchModal}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                + New Batch
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teacherBatches.map((batch) => {
                const enrolledCount = memberships.filter((m) => m.batchId === batch.id).length;
                const capacityPct = Math.round((enrolledCount / batch.studentCapacity) * 100);
                const attStats = getBatchAttendanceStats(batch.id);

                return (
                  <div
                    key={batch.id}
                    onClick={() => onSelectBatch(batch.id)}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {batch.subject}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1.5 group-hover:text-indigo-600 transition-colors">
                          {batch.name}
                        </h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>

                    <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          SHARE BATCH CODE
                        </span>
                        <span className="font-mono font-extrabold text-indigo-700 text-sm">
                          {batch.code}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCode(batch.code);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Copy Batch Code"
                      >
                        {copiedCode === batch.code ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                        <span>Enrolled Students</span>
                        <span>
                          {enrolledCount} / {batch.studentCapacity} ({capacityPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            capacityPct > 85 ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(capacityPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Announcements & Quick Tips */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Recent Announcements</h3>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map((anc) => (
                <div key={anc.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>{anc.batchName}</span>
                    <span>{new Date(anc.postedAt).toLocaleDateString()}</span>
                  </div>
                  <h5 className="font-bold text-slate-800">{anc.title}</h5>
                  <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">{anc.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-tr from-indigo-500/10 via-indigo-500/5 to-transparent p-6 rounded-3xl border border-indigo-100">
            <h4 className="text-sm font-extrabold text-indigo-950 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-indigo-600" />
              <span>Attendance & Payment Tracker</span>
            </h4>
            <p className="text-xs text-indigo-800 mt-2 leading-relaxed">
              Open any batch or click <strong>Students Directory</strong> in the top navigation to mark daily attendance, check annual attendance percentage, and record monthly fee dues!
            </p>
          </div>
        </div>
      </div>

      {/* Edit Schedule Modal */}
      {showEditScheduleModal && (
        <ScheduleBuilderModal
          isOpen={showEditScheduleModal}
          onClose={() => {
            setShowEditScheduleModal(false);
            setEditingClass(null);
          }}
          editingClass={editingClass}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">Delete Timetable Entry?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{deleteTarget.title}"</strong> from your teaching schedule?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteTarget.isPermanent && deleteTarget.recurringSlotId) {
                    deleteRecurringSlot(deleteTarget.recurringSlotId);
                  } else {
                    deleteScheduleClass(deleteTarget.id);
                  }
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import { Batch, StudentAttendanceItem } from '../../types';
import { ClassResourcesSection } from '../common/ClassResourcesSection';
import { ClassHistoryView } from '../common/ClassHistoryView';
import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Youtube,
  Plus,
  ArrowLeft,
  Copy,
  Check,
  Search,
  IndianRupee,
  FileText,
  Bell,
  ShieldBan,
  Trash2,
  Sparkles,
  ClipboardCheck,
  UserCheck,
  UserX,
  AlertCircle,
  Phone,
} from 'lucide-react';

interface BatchManagerProps {
  batchId: string;
  onBack: () => void;
  onOpenScheduleModal: (batchId: string) => void;
}

export const BatchManager: React.FC<BatchManagerProps> = ({
  batchId,
  onOpenScheduleModal,
  onBack,
}) => {
  const {
    batches,
    memberships,
    classes,
    content,
    announcements,
    attendances,
    togglePaymentStatus,
    updateMembershipPayment,
    removeStudentFromBatch,
    blockUserKakshaId,
    deleteBatch,
    addBatchContent,
    postAnnouncement,
    getBatchResources,
    markAttendance,
    getStudentCumulativeAttendance,
  } = useKaksha();

  const [activeTab, setActiveTab] = useState<
    'roster' | 'attendance' | 'payments' | 'schedule' | 'history' | 'resources' | 'content' | 'announcements'
  >('roster');

  const [copiedCode, setCopiedCode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Content upload modal state
  const [showContentModal, setShowContentModal] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('45 mins');

  // Announcement modal state
  const [showAncModal, setShowAncModal] = useState(false);
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');

  // Attendance Tracker State
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | 'excused'>>({});
  const [attendanceSavedToast, setAttendanceSavedToast] = useState(false);
  const [attendanceViewMode, setAttendanceViewMode] = useState<'mark' | 'annual_record'>('mark');

  const batch = batches.find((b) => b.id === batchId);
  if (!batch) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-sm font-semibold text-slate-600">Batch not found.</p>
        <button onClick={onBack} className="mt-4 text-xs font-bold text-indigo-600 underline">
          Go Back
        </button>
      </div>
    );
  }

  const batchMemberships = memberships.filter((m) => m.batchId === batch.id);
  const filteredMemberships = batchMemberships.filter(
    (m) =>
      m.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.studentKakshaId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.studentPhone.includes(searchTerm)
  );

  const batchClasses = classes.filter((c) => c.batchId === batch.id);
  const batchContent = content.filter((c) => c.batchId === batch.id);
  const batchAnnouncements = announcements.filter((a) => a.batchId === batch.id);
  const batchResources = getBatchResources(batch.id);
  const batchAttendances = attendances.filter((a) => a.batchId === batch.id);

  // Initialize today's attendance state if existing record exists
  React.useEffect(() => {
    const existingForDate = batchAttendances.find((a) => a.date === attendanceDate);
    const initialMap: Record<string, 'present' | 'absent' | 'excused'> = {};

    batchMemberships.forEach((mem) => {
      if (existingForDate) {
        const found = existingForDate.records.find((r) => r.studentId === mem.studentId);
        initialMap[mem.studentId] = found ? found.status : 'present';
      } else {
        initialMap[mem.studentId] = 'present'; // default all present
      }
    });

    setAttendanceRecords(initialMap);
  }, [batchId, attendanceDate, memberships.length]);

  const copyBatchCode = () => {
    navigator.clipboard.writeText(batch.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : 'L_LUpnjgPso';
  };

  const handleAddContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle || !youtubeUrl) return;

    addBatchContent({
      batchId: batch.id,
      batchName: batch.name,
      title: videoTitle,
      description: videoDesc,
      youtubeId: extractYoutubeId(youtubeUrl),
      duration: videoDuration,
      thumbnailUrl: `https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600`,
    });

    setShowContentModal(false);
    setVideoTitle('');
    setVideoDesc('');
    setYoutubeUrl('');
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle || !ancContent) return;

    postAnnouncement(batch.id, ancTitle, ancContent);
    setShowAncModal(false);
    setAncTitle('');
    setAncContent('');
  };

  const handleSaveAttendance = () => {
    const recordsList: StudentAttendanceItem[] = batchMemberships.map((mem) => ({
      studentId: mem.studentId,
      studentName: mem.studentName,
      studentKakshaId: mem.studentKakshaId,
      status: attendanceRecords[mem.studentId] || 'present',
    }));

    markAttendance(batch.id, attendanceDate, recordsList);
    setAttendanceSavedToast(true);
    setTimeout(() => setAttendanceSavedToast(false), 3000);
  };

  const handleMarkAllPresent = () => {
    const allP: Record<string, 'present' | 'absent' | 'excused'> = {};
    batchMemberships.forEach((mem) => {
      allP[mem.studentId] = 'present';
    });
    setAttendanceRecords(allP);
  };

  // Payment Summary Metrics
  const paidCount = batchMemberships.filter((m) => m.paymentStatus === 'paid').length;
  const pendingCount = batchMemberships.length - paidCount;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-700 transition-colors"
              title="Back to Batches"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {batch.subject}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Valid till {batch.validUntil}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-1">{batch.name}</h1>
            </div>
          </div>

          {/* Share Code Widget */}
          <div className="flex items-center gap-3 bg-slate-50 p-2 sm:p-2.5 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Batch Code (Manual Approval Required)
              </span>
              <span className="font-mono font-black text-indigo-700 text-base">{batch.code}</span>
            </div>
            <button
              onClick={copyBatchCode}
              className="p-2 bg-white text-slate-700 hover:text-indigo-600 rounded-xl border border-slate-200 shadow-2xs transition-colors"
              title="Copy Code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 flex overflow-x-auto gap-2 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('roster')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'roster'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students Roster ({batchMemberships.length}/{batch.studentCapacity})</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Attendance Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            <span>Monthly Fee Records ({paidCount} Paid / {pendingCount} Pending)</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Timetable & Classes ({batchClasses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Previous Classes & Backlogs</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'resources'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Class Notes & Homework ({batchResources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'content'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Youtube className="w-4 h-4" />
            <span>Recorded Lectures ({batchContent.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Announcements ({batchAnnouncements.length})</span>
          </button>
        </div>
      </div>

      {/* 1. ROSTER TAB */}
      {activeTab === 'roster' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Enrolled Students Roster</h2>
              <p className="text-xs text-slate-500">
                Live list of students currently admitted to this batch ({batchMemberships.length} of {batch.studentCapacity} capacity).
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search student or Kaksha ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          {filteredMemberships.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No students enrolled in this batch yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Share batch code <strong className="font-mono text-indigo-600">{batch.code}</strong> with students to approve them.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="pb-3 px-3">Student Name</th>
                    <th className="pb-3 px-3">Kaksha ID</th>
                    <th className="pb-3 px-3">Phone Number</th>
                    <th className="pb-3 px-3">Enrolled Date</th>
                    <th className="pb-3 px-3">Fee Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMemberships.map((mem) => {
                    const att = getStudentCumulativeAttendance(batch.id, mem.studentId);

                    return (
                      <tr key={mem.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs">
                              {mem.studentName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{mem.studentName}</span>
                              <span className="text-[10px] text-slate-400">Attendance: {att.attendancePct}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {mem.studentKakshaId}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {mem.studentPhone}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500">
                          {new Date(mem.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-3">
                          <button
                            onClick={() => togglePaymentStatus(mem.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                              mem.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            }`}
                            title="Click to toggle fee payment status"
                          >
                            {mem.paymentStatus === 'paid' ? 'Paid ✓' : 'Pending ⏳'}
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${mem.studentName} from this batch?`)) {
                                  removeStudentFromBatch(mem.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remove from batch"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Block ${mem.studentName} (${mem.studentKakshaId}) from sending messages or requests?`)) {
                                  blockUserKakshaId(mem.studentKakshaId);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Block Kaksha ID"
                            >
                              <ShieldBan className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. ATTENDANCE TRACKER TAB */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          {attendanceSavedToast && (
            <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Attendance recorded and saved successfully for {attendanceDate}!</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Attendance Tracker & Annual Record</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mark daily attendance with 1-click and inspect cumulative / annual records for every student.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAttendanceViewMode('mark')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  attendanceViewMode === 'mark'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Take Daily Attendance
              </button>
              <button
                onClick={() => setAttendanceViewMode('annual_record')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  attendanceViewMode === 'annual_record'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Annual Attendance Register
              </button>
            </div>
          </div>

          {attendanceViewMode === 'mark' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700">Select Date:</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-700"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkAllPresent}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
                  >
                    Save Attendance
                  </button>
                </div>
              </div>

              {batchMemberships.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No students enrolled to take attendance.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {batchMemberships.map((mem) => {
                    const currentStatus = attendanceRecords[mem.studentId] || 'present';

                    return (
                      <div
                        key={mem.id}
                        className="py-3 px-2 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-xs">
                            {mem.studentName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{mem.studentName}</span>
                            <span className="font-mono text-[10px] text-indigo-600">{mem.studentKakshaId}</span>
                          </div>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setAttendanceRecords((prev) => ({ ...prev, [mem.studentId]: 'present' }))
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setAttendanceRecords((prev) => ({ ...prev, [mem.studentId]: 'absent' }))
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50'
                            }`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setAttendanceRecords((prev) => ({ ...prev, [mem.studentId]: 'excused' }))
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === 'excused'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-50'
                            }`}
                          >
                            Excused
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Annual / Cumulative Attendance Register */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span>Total Classes Recorded for Batch: <strong className="text-slate-900">{batchAttendances.length} Sessions</strong></span>
                <span className="text-[11px] text-indigo-600 font-bold">Annual Cumulative Progress</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                      <th className="pb-3 px-3">Student</th>
                      <th className="pb-3 px-3">Kaksha ID</th>
                      <th className="pb-3 px-3">Classes Attended</th>
                      <th className="pb-3 px-3">Total Classes</th>
                      <th className="pb-3 px-3">Attendance %</th>
                      <th className="pb-3 px-3 text-right">Standing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {batchMemberships.map((mem) => {
                      const att = getStudentCumulativeAttendance(batch.id, mem.studentId);
                      const isHigh = att.attendancePct >= 85;
                      const isMedium = att.attendancePct >= 65 && att.attendancePct < 85;

                      return (
                        <tr key={mem.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">{mem.studentName}</td>
                          <td className="py-3 px-3 font-mono text-indigo-700">{mem.studentKakshaId}</td>
                          <td className="py-3 px-3 text-emerald-700 font-bold">{att.attendedSessions}</td>
                          <td className="py-3 px-3 text-slate-600">{att.totalSessions}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">{att.attendancePct}%</span>
                              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isHigh ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(att.attendancePct, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                isHigh
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : isMedium
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {isHigh ? 'Excellent' : isMedium ? 'Moderate' : 'Low Attendance'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Monthly Fee & Payment Management</h2>
              <p className="text-xs text-slate-500">
                Track and manually record student fee payments, payment methods, and pending dues for this batch.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-100 text-xs font-bold text-emerald-800">
                Paid: {paidCount} Students
              </div>
              <div className="bg-rose-50 px-3.5 py-1.5 rounded-xl border border-rose-100 text-xs font-bold text-rose-800">
                Pending: {pendingCount} Students
              </div>
            </div>
          </div>

          {filteredMemberships.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No enrolled students in this batch.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="pb-3 px-3">Student</th>
                    <th className="pb-3 px-3">Kaksha ID</th>
                    <th className="pb-3 px-3">Phone</th>
                    <th className="pb-3 px-3">Billing Cycle</th>
                    <th className="pb-3 px-3">Payment Mode</th>
                    <th className="pb-3 px-3">Fee Status</th>
                    <th className="pb-3 px-3 text-right">Mark Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMemberships.map((mem) => (
                    <tr key={mem.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{mem.studentName}</td>
                      <td className="py-3 px-3 font-mono text-indigo-700">{mem.studentKakshaId}</td>
                      <td className="py-3 px-3 text-slate-600">{mem.studentPhone}</td>
                      <td className="py-3 px-3 text-slate-500">{mem.lastPaymentPeriod || 'Current Month'}</td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {mem.paymentMode || (mem.paymentStatus === 'paid' ? 'UPI' : 'Pending')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            mem.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {mem.paymentStatus === 'paid' ? 'Paid ✓' : 'Pending ⏳'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              updateMembershipPayment(
                                mem.id,
                                mem.paymentStatus === 'paid' ? 'pending' : 'paid',
                                mem.paymentStatus === 'paid' ? 'Pending' : 'UPI'
                              )
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              mem.paymentStatus === 'paid'
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                            }`}
                          >
                            {mem.paymentStatus === 'paid' ? 'Mark Pending' : 'Mark as Paid'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Batch Timetable & Scheduled Classes</h2>
              <p className="text-xs text-slate-500">Add live online or offline classroom sessions for this batch.</p>
            </div>
            <button
              onClick={() => onOpenScheduleModal(batch.id)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Class</span>
            </button>
          </div>

          {batchClasses.length === 0 ? (
            <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No classes scheduled for this batch.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {batchClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      ⏰ {cls.date} • {cls.startTime} - {cls.endTime}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{cls.title}</h4>
                    <p className="text-xs text-slate-500">
                      Mode: {cls.classType === 'online' ? 'Live In-App Class' : `Tuition Room (${cls.roomNo || 'Centre'})`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4.5. PREVIOUS CLASSES & BACKLOGS TAB */}
      {activeTab === 'history' && (
        <ClassHistoryView batchId={batch.id} />
      )}

      {/* 5. RESOURCES TAB */}
      {activeTab === 'resources' && (
        <ClassResourcesSection batchId={batch.id} />
      )}

      {/* 6. CONTENT TAB */}
      {activeTab === 'content' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Protected Recorded Lectures</h2>
              <p className="text-xs text-slate-500">
                Students watch these embedded inside Kaksha with anti-sharing shields.
              </p>
            </div>
            <button
              onClick={() => setShowContentModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lecture</span>
            </button>
          </div>

          {batchContent.length === 0 ? (
            <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Youtube className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No recorded lectures uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {batchContent.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative">
                    <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-slate-950/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                      {c.duration}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{c.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{c.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. ANNOUNCEMENTS TAB */}
      {activeTab === 'announcements' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Batch Announcements & Notices</h2>
              <p className="text-xs text-slate-500">Send urgent class updates or schedule changes to students.</p>
            </div>
            <button
              onClick={() => setShowAncModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Post Notice</span>
            </button>
          </div>

          {batchAnnouncements.length === 0 ? (
            <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No announcements posted for this batch.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {batchAnnouncements.map((a) => (
                <div key={a.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>By {a.teacherName}</span>
                    <span>{new Date(a.postedAt).toLocaleString()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{a.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Batch Section at the Bottom */}
      <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            Batch Management Options
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Need to retire or remove this batch completely?
          </p>
        </div>
        <button
          onClick={() => setShowDeleteConfirmModal(true)}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Batch</span>
        </button>
      </div>

      {/* Delete Batch Confirmation Warning Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Batch Permanently?</h3>
                <p className="text-xs font-semibold text-rose-600">{batch.name} ({batch.code})</p>
              </div>
            </div>

            <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 text-xs text-rose-950 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldBan className="w-4 h-4 text-rose-600 shrink-0" />
                Warning: This action cannot be undone!
              </p>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Deleting this batch will permanently remove all student enrollments, timetable schedules, attendance registers, fee payment logs, notes, materials, and announcements associated with <strong>{batch.name}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteBatch(batch.id);
                  setShowDeleteConfirmModal(false);
                  onBack();
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      {showContentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Protected YouTube Lecture</h3>
            <form onSubmit={handleAddContent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lecture Title</label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Chemical Bonding Complete Revision"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">YouTube Link / Video ID</label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtu.be/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Summary</label>
                <textarea
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                  placeholder="Topics covered..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Lecture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Announcement Modal */}
      {showAncModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Post Batch Notice</h3>
            <form onSubmit={handlePostAnnouncement} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  value={ancTitle}
                  onChange={(e) => setAncTitle(e.target.value)}
                  placeholder="e.g. Test Schedule for this Sunday"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Content</label>
                <textarea
                  value={ancContent}
                  onChange={(e) => setAncContent(e.target.value)}
                  placeholder="Write message..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAncModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

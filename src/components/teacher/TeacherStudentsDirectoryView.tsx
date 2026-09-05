import React, { useState } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import {
  Users,
  Search,
  IndianRupee,
  ClipboardCheck,
  Phone,
  ShieldBan,
  Trash2,
  Filter,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';

export const TeacherStudentsDirectoryView: React.FC = () => {
  const {
    currentUser,
    getTeacherBatches,
    memberships,
    batches,
    togglePaymentStatus,
    updateMembershipPayment,
    removeStudentFromBatch,
    blockUserKakshaId,
    getStudentCumulativeAttendance,
  } = useKaksha();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');

  if (!currentUser) return null;

  const teacherBatches = getTeacherBatches(currentUser.id);
  const teacherBatchIds = teacherBatches.map((b) => b.id);

  const teacherMemberships = memberships.filter((m) => teacherBatchIds.includes(m.batchId));

  const filteredMemberships = teacherMemberships.filter((m) => {
    const matchesSearch =
      m.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.studentKakshaId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.studentPhone.includes(searchTerm);

    const matchesBatch = selectedBatchFilter === 'all' || m.batchId === selectedBatchFilter;
    const matchesPayment = paymentFilter === 'all' || m.paymentStatus === paymentFilter;

    return matchesSearch && matchesBatch && matchesPayment;
  });

  const totalPaid = teacherMemberships.filter((m) => m.paymentStatus === 'paid').length;
  const totalPending = teacherMemberships.length - totalPaid;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900">Enrolled Students Master Directory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete list of students across all your tuition batches, their fee status, and attendance records.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-50 px-3.5 py-2 rounded-2xl border border-indigo-100 text-xs">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Students</span>
            <span className="font-extrabold text-indigo-700 text-sm">{teacherMemberships.length}</span>
          </div>
          <div className="bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-100 text-xs">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Fee Paid</span>
            <span className="font-extrabold text-emerald-700 text-sm">{totalPaid}</span>
          </div>
          <div className="bg-rose-50 px-3.5 py-2 rounded-2xl border border-rose-100 text-xs">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Fee Pending</span>
            <span className="font-extrabold text-rose-700 text-sm">{totalPending}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search name, phone, or Kaksha ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3 h-3 text-slate-400 ml-1.5" />
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none pr-2 py-1"
            >
              <option value="all">All Batches ({teacherBatches.length})</option>
              {teacherBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setPaymentFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                paymentFilter === 'all' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPaymentFilter('paid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                paymentFilter === 'paid' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Paid ({totalPaid})
            </button>
            <button
              onClick={() => setPaymentFilter('pending')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                paymentFilter === 'pending' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Pending ({totalPending})
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredMemberships.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No student records found.</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Kaksha ID</th>
                  <th className="py-3 px-4">Enrolled Batch</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Attendance Rate</th>
                  <th className="py-3 px-4">Monthly Fee Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMemberships.map((mem) => {
                  const targetBatch = batches.find((b) => b.id === mem.batchId);
                  const att = getStudentCumulativeAttendance(mem.batchId, mem.studentId);
                  const isHighAtt = att.attendancePct >= 80;

                  return (
                    <tr key={mem.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs">
                            {mem.studentName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{mem.studentName}</span>
                            <span className="text-[10px] text-slate-400">Joined: {new Date(mem.joinedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {mem.studentKakshaId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {targetBatch ? targetBatch.name : 'Batch'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {mem.studentPhone}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isHighAtt ? 'text-emerald-700' : 'text-amber-600'}`}>
                            {att.attendancePct}%
                          </span>
                          <span className="text-[10px] text-slate-400">({att.attendedSessions}/{att.totalSessions})</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
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

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${mem.studentName} from this batch?`)) {
                                removeStudentFromBatch(mem.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove student from batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Block ${mem.studentName} (${mem.studentKakshaId}) from contacting you?`)) {
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
    </div>
  );
};

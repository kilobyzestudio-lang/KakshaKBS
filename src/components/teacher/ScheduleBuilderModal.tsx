import React, { useState, useEffect } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import { ScheduleClass, RecurringTimetableSlot, DayOfWeek } from '../../types';
import { Calendar, Video, MapPin, X, Clock, Repeat, Check } from 'lucide-react';

interface ScheduleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBatchId?: string;
  editingClass?: ScheduleClass | null;
  editingSlot?: RecurringTimetableSlot | null;
  defaultMode?: 'single' | 'weekly' | 'monthly';
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const ScheduleBuilderModal: React.FC<ScheduleBuilderModalProps> = ({
  isOpen,
  onClose,
  defaultBatchId,
  editingClass,
  editingSlot,
  defaultMode = 'single',
}) => {
  const {
    currentUser,
    getTeacherBatches,
    createScheduleClass,
    updateScheduleClass,
    createRecurringSlot,
    updateRecurringSlot,
  } = useKaksha();

  if (!currentUser || !isOpen) return null;

  const teacherBatches = getTeacherBatches(currentUser.id);

  // Determine schedule type: single, weekly (permanent), or monthly (permanent)
  const initialScheduleType = editingSlot
    ? editingSlot.recurrenceType === 'weekly'
      ? 'weekly'
      : 'monthly'
    : defaultMode;

  const [scheduleType, setScheduleType] = useState<'single' | 'weekly' | 'monthly'>(initialScheduleType);
  const [batchId, setBatchId] = useState(
    editingClass?.batchId || editingSlot?.batchId || defaultBatchId || teacherBatches[0]?.id || ''
  );
  const [title, setTitle] = useState(editingClass?.title || editingSlot?.title || '');
  const [date, setDate] = useState(editingClass?.date || new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(editingSlot?.dayOfWeek || 'Monday');
  const [dayOfMonth, setDayOfMonth] = useState<number>(editingSlot?.dayOfMonth || 1);
  const [startTime, setStartTime] = useState(editingClass?.startTime || editingSlot?.startTime || '10:00 AM');
  const [endTime, setEndTime] = useState(editingClass?.endTime || editingSlot?.endTime || '11:30 AM');
  const [classType, setClassType] = useState<'online' | 'in_person'>(
    editingClass?.classType || editingSlot?.classType || 'online'
  );
  const [meetingUrl, setMeetingUrl] = useState(
    editingClass?.meetingUrl || editingSlot?.meetingUrl || 'https://zoom.us/j/9876543210'
  );
  const [roomNo, setRoomNo] = useState(
    editingClass?.roomNo || editingSlot?.roomNo || 'Room 2B (Sector 4 Coaching Centre)'
  );

  useEffect(() => {
    if (editingClass) {
      setScheduleType('single');
      setBatchId(editingClass.batchId);
      setTitle(editingClass.title);
      setDate(editingClass.date);
      setStartTime(editingClass.startTime);
      setEndTime(editingClass.endTime);
      setClassType(editingClass.classType);
      if (editingClass.meetingUrl) setMeetingUrl(editingClass.meetingUrl);
      if (editingClass.roomNo) setRoomNo(editingClass.roomNo);
    } else if (editingSlot) {
      setScheduleType(editingSlot.recurrenceType);
      setBatchId(editingSlot.batchId);
      setTitle(editingSlot.title);
      if (editingSlot.dayOfWeek) setDayOfWeek(editingSlot.dayOfWeek);
      if (editingSlot.dayOfMonth) setDayOfMonth(editingSlot.dayOfMonth);
      setStartTime(editingSlot.startTime);
      setEndTime(editingSlot.endTime);
      setClassType(editingSlot.classType);
      if (editingSlot.meetingUrl) setMeetingUrl(editingSlot.meetingUrl);
      if (editingSlot.roomNo) setRoomNo(editingSlot.roomNo);
    }
  }, [editingClass, editingSlot]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBatch = teacherBatches.find((b) => b.id === batchId);
    if (!selectedBatch) return;

    if (editingSlot) {
      // Update existing recurring slot
      updateRecurringSlot(editingSlot.id, {
        batchId: selectedBatch.id,
        batchCode: selectedBatch.code,
        batchName: selectedBatch.name,
        subject: selectedBatch.subject,
        title,
        recurrenceType: scheduleType === 'monthly' ? 'monthly' : 'weekly',
        dayOfWeek: scheduleType === 'weekly' ? dayOfWeek : undefined,
        dayOfMonth: scheduleType === 'monthly' ? Number(dayOfMonth) : undefined,
        startTime,
        endTime,
        classType,
        meetingUrl: classType === 'online' ? meetingUrl : undefined,
        roomNo: classType === 'in_person' ? roomNo : undefined,
      });
    } else if (editingClass) {
      // Update existing single scheduled class
      updateScheduleClass(editingClass.id, {
        batchId: selectedBatch.id,
        batchCode: selectedBatch.code,
        batchName: selectedBatch.name,
        subject: selectedBatch.subject,
        title,
        date,
        startTime,
        endTime,
        classType,
        meetingUrl: classType === 'online' ? meetingUrl : undefined,
        roomNo: classType === 'in_person' ? roomNo : undefined,
      });
    } else {
      // Create new
      if (scheduleType === 'weekly') {
        createRecurringSlot({
          batchId: selectedBatch.id,
          batchCode: selectedBatch.code,
          batchName: selectedBatch.name,
          subject: selectedBatch.subject,
          title,
          recurrenceType: 'weekly',
          dayOfWeek,
          startTime,
          endTime,
          classType,
          meetingUrl: classType === 'online' ? meetingUrl : undefined,
          roomNo: classType === 'in_person' ? roomNo : undefined,
        });
      } else if (scheduleType === 'monthly') {
        createRecurringSlot({
          batchId: selectedBatch.id,
          batchCode: selectedBatch.code,
          batchName: selectedBatch.name,
          subject: selectedBatch.subject,
          title,
          recurrenceType: 'monthly',
          dayOfMonth: Number(dayOfMonth),
          startTime,
          endTime,
          classType,
          meetingUrl: classType === 'online' ? meetingUrl : undefined,
          roomNo: classType === 'in_person' ? roomNo : undefined,
        });
      } else {
        createScheduleClass({
          batchId: selectedBatch.id,
          batchCode: selectedBatch.code,
          batchName: selectedBatch.name,
          subject: selectedBatch.subject,
          title,
          date,
          startTime,
          endTime,
          classType,
          meetingUrl: classType === 'online' ? meetingUrl : undefined,
          roomNo: classType === 'in_person' ? roomNo : undefined,
        });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              {editingSlot
                ? 'Edit Permanent Timetable Slot'
                : editingClass
                ? 'Edit Scheduled Class'
                : 'Schedule / Set Timetable Slot'}
            </h3>
            <p className="text-xs text-slate-500">
              {scheduleType === 'weekly'
                ? 'Repeats every week & automatically fetches into daily dashboard'
                : scheduleType === 'monthly'
                ? 'Repeats every month on specified day'
                : 'One-time session scheduled for a specific date'}
            </p>
          </div>
        </div>

        {/* Timetable Type Selection Tabs (Only when creating new) */}
        {!editingClass && !editingSlot && (
          <div className="mb-4 bg-slate-100 p-1 rounded-2xl grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setScheduleType('single')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                scheduleType === 'single'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 One-Time Date
            </button>
            <button
              type="button"
              onClick={() => setScheduleType('weekly')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                scheduleType === 'weekly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔄 Weekly Permanent
            </button>
            <button
              type="button"
              onClick={() => setScheduleType('monthly')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                scheduleType === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗓️ Monthly Timetable
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Batch *</label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            >
              {teacherBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Title / Topic *</label>
            <input
              type="text"
              placeholder="e.g. Chapter 4 — Quadratic Formula & Practice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              required
            />
          </div>

          {/* Date / Day Selection based on Recurrence */}
          {scheduleType === 'single' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                required
              />
            </div>
          )}

          {scheduleType === 'weekly' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Day of the Week (Permanent Weekly Slot)</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    Every {d}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                ⚡ Automatically appears in today's teaching timetable on every {dayOfWeek}.
              </p>
            </div>
          )}

          {scheduleType === 'monthly' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Day of the Month (Monthly Timetable)</label>
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Day {num} of Every Month
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                ⚡ Repeats on the {dayOfMonth}th of every month automatically.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time *</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="11:30 AM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Class Delivery Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setClassType('online')}
                className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  classType === 'online'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Live In-App Video</span>
              </button>
              <button
                type="button"
                onClick={() => setClassType('in_person')}
                className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  classType === 'in_person'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>In-Person Tuition Room</span>
              </button>
            </div>
          </div>

          {classType === 'online' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Link / Room ID</label>
              <input
                type="text"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Classroom / Coaching Centre Room Location</label>
              <input
                type="text"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="Room 2B (Sector 4 Coaching Centre)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingSlot || editingClass ? 'Save Changes' : 'Confirm Timetable Slot'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

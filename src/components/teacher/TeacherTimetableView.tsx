import React, { useState } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import { ScheduleClass, RecurringTimetableSlot, DayOfWeek } from '../../types';
import { ScheduleBuilderModal } from './ScheduleBuilderModal';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Repeat,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Layers,
} from 'lucide-react';

interface TeacherTimetableViewProps {
  onOpenScheduleModal: () => void;
  onStartLiveMeeting: (cls: ScheduleClass) => void;
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

export const TeacherTimetableView: React.FC<TeacherTimetableViewProps> = ({
  onOpenScheduleModal,
  onStartLiveMeeting,
}) => {
  const {
    currentUser,
    getTeacherBatches,
    classes,
    recurringSlots,
    getTeacherDailySchedule,
    getTeacherRecurringSlots,
    deleteScheduleClass,
    deleteRecurringSlot,
  } = useKaksha();

  const [activeView, setActiveView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [editingClass, setEditingClass] = useState<ScheduleClass | null>(null);
  const [editingSlot, setEditingSlot] = useState<RecurringTimetableSlot | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'single' | 'weekly' | 'monthly'>('single');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    id: string;
    title: string;
    type: 'class' | 'slot';
  } | null>(null);

  if (!currentUser) return null;

  const teacherBatches = getTeacherBatches(currentUser.id);
  const teacherRecurringSlots = getTeacherRecurringSlots(currentUser.id);

  // Automatically fetches both direct classes AND permanent weekly/monthly recurring slots for selectedDate!
  const dailyClasses = getTeacherDailySchedule(currentUser.id, selectedDate);

  const weeklySlots = teacherRecurringSlots.filter((s) => s.recurrenceType === 'weekly');
  const monthlySlots = teacherRecurringSlots.filter((s) => s.recurrenceType === 'monthly');

  const handleDelete = () => {
    if (!deleteConfirmTarget) return;
    if (deleteConfirmTarget.type === 'class') {
      deleteScheduleClass(deleteConfirmTarget.id);
    } else {
      deleteRecurringSlot(deleteConfirmTarget.id);
    }
    setDeleteConfirmTarget(null);
  };

  const handleEditClass = (cls: ScheduleClass) => {
    if (cls.isPermanent && cls.recurringSlotId) {
      // Find original recurring slot
      const originalSlot = recurringSlots.find((s) => s.id === cls.recurringSlotId);
      if (originalSlot) {
        setEditingSlot(originalSlot);
        setEditingClass(null);
        setModalMode(originalSlot.recurrenceType);
        setShowModal(true);
        return;
      }
    }
    setEditingClass(cls);
    setEditingSlot(null);
    setModalMode('single');
    setShowModal(true);
  };

  const handleEditSlot = (slot: RecurringTimetableSlot) => {
    setEditingSlot(slot);
    setEditingClass(null);
    setModalMode(slot.recurrenceType);
    setShowModal(true);
  };

  const openNewSlotModal = (mode: 'single' | 'weekly' | 'monthly') => {
    setEditingClass(null);
    setEditingSlot(null);
    setModalMode(mode);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card & View Switcher */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900">Teaching Timetable & Planner</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Set permanent weekly & monthly timetables that automatically populate your daily schedule.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveView('daily')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'daily'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Daily View</span>
            </button>

            <button
              onClick={() => setActiveView('weekly')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'weekly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Permanent Weekly ({weeklySlots.length})</span>
            </button>

            <button
              onClick={() => setActiveView('monthly')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Monthly Timetable ({monthlySlots.length})</span>
            </button>
          </div>

          <button
            onClick={() => openNewSlotModal(activeView === 'monthly' ? 'monthly' : activeView === 'weekly' ? 'weekly' : 'single')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-2xl shadow-sm text-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeView === 'weekly'
                ? 'Add Weekly Slot'
                : activeView === 'monthly'
                ? 'Add Monthly Slot'
                : 'Schedule Class'}
            </span>
          </button>
        </div>
      </div>

      {/* 1. DAILY TIMETABLE VIEW */}
      {activeView === 'daily' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Timetable for:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate('2026-08-29')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDate === '2026-08-29'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Aug 29 (Today)
              </button>
              <button
                onClick={() => setSelectedDate('2026-08-30')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedDate === '2026-08-30'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Aug 30 (Tomorrow)
              </button>
              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                {dailyClasses.length} Sessions
              </span>
            </div>
          </div>

          {dailyClasses.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No classes scheduled for {selectedDate}.</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Classes from your Permanent Weekly and Monthly timetable will automatically appear here on matching days.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => openNewSlotModal('single')}
                  className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700"
                >
                  + Add Single Class
                </button>
                <button
                  onClick={() => setActiveView('weekly')}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
                >
                  Configure Weekly Timetable
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                        ⏰ {cls.startTime} - {cls.endTime}
                      </span>
                      <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {cls.batchName}
                      </span>
                      {cls.isPermanent && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Repeat className="w-3 h-3" /> Auto-Fetched from Permanent Timetable
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900">{cls.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <span>Subject: <strong className="text-slate-700">{cls.subject}</strong></span>
                      <span>•</span>
                      <span>Mode: {cls.classType === 'online' ? 'Live In-App Class' : `Tuition Room (${cls.roomNo || 'Centre'})`}</span>
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {cls.classType === 'online' ? (
                      <button
                        onClick={() => onStartLiveMeeting(cls)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <Video className="w-4 h-4" />
                        <span>Start In-App Class</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-200 px-3 py-2 rounded-xl">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{cls.roomNo || 'Tuition Room'}</span>
                      </span>
                    )}

                    {/* Edit Timetable Button */}
                    <button
                      onClick={() => handleEditClass(cls)}
                      className="p-2 text-slate-500 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-xl border border-slate-200 transition-colors"
                      title="Edit Class Timetable"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Timetable Button */}
                    <button
                      onClick={() =>
                        setDeleteConfirmTarget({
                          id: cls.isPermanent && cls.recurringSlotId ? cls.recurringSlotId : cls.id,
                          title: cls.title,
                          type: cls.isPermanent && cls.recurringSlotId ? 'slot' : 'class',
                        })
                      }
                      className="p-2 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
                      title="Delete Timetable Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. PERMANENT WEEKLY TIMETABLE VIEW */}
      {activeView === 'weekly' && (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-indigo-950">Permanent Weekly Timetable</h3>
                <p className="text-xs text-indigo-700">
                  Slots configured here automatically fetch into your Dashboard schedule on the corresponding day of every week!
                </p>
              </div>
            </div>
            <button
              onClick={() => openNewSlotModal('weekly')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Weekly Slot</span>
            </button>
          </div>

          {/* Monday through Sunday Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = weeklySlots.filter((s) => s.dayOfWeek === day);

              return (
                <div
                  key={day}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <h4 className="text-sm font-extrabold text-slate-900">{day}</h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {daySlots.length === 0 ? (
                      <div className="py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-400 font-medium">No permanent classes on {day}.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="p-3 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditSlot(slot)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-colors"
                                  title="Edit Slot"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirmTarget({
                                      id: slot.id,
                                      title: slot.title,
                                      type: 'slot',
                                    })
                                  }
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                                  title="Delete Slot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h5 className="text-xs font-bold text-slate-900 truncate">{slot.title}</h5>
                            <p className="text-[10px] text-slate-500 truncate">
                              {slot.batchName} • {slot.classType === 'online' ? '📹 Online' : '📍 In-Person'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEditingClass(null);
                      setEditingSlot(null);
                      setModalMode('weekly');
                      setShowModal(true);
                    }}
                    className="w-full text-center py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold text-indigo-600 transition-colors"
                  >
                    + Add slot for {day}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MONTHLY TIMETABLE VIEW */}
      {activeView === 'monthly' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-amber-950">Monthly Timetable & Recurring Schedule</h3>
                <p className="text-xs text-amber-800">
                  Set classes that repeat every month on specific dates (e.g. 1st of month, 15th of month) for monthly revisions and tests.
                </p>
              </div>
            </div>
            <button
              onClick={() => openNewSlotModal('monthly')}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Monthly Slot</span>
            </button>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h4 className="text-base font-extrabold text-slate-900">Configured Monthly Timetable Slots</h4>

            {monthlySlots.length === 0 ? (
              <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No monthly recurring slots configured yet.</p>
                <button
                  onClick={() => openNewSlotModal('monthly')}
                  className="text-xs font-bold text-indigo-600 underline"
                >
                  + Add Monthly Slot (e.g. Monthly Mock Exam, Revision Day)
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {monthlySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-amber-300 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex flex-col items-center justify-center font-bold shrink-0">
                        <span className="text-[10px] uppercase font-semibold">Day</span>
                        <span className="text-sm font-black">{slot.dayOfMonth}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {slot.batchName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {slot.classType === 'online' ? '📹 Online' : '📍 In-Person'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{slot.title}</h4>
                        <p className="text-xs text-slate-500 font-mono">
                          ⏰ {slot.startTime} - {slot.endTime} (Every month on day {slot.dayOfMonth})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEditSlot(slot)}
                        className="p-2 text-slate-400 hover:text-indigo-600 bg-white rounded-xl border border-slate-200 transition-colors"
                        title="Edit Slot"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirmTarget({
                            id: slot.id,
                            title: slot.title,
                            type: 'slot',
                          })
                        }
                        className="p-2 text-slate-400 hover:text-rose-600 bg-white rounded-xl border border-slate-200 transition-colors"
                        title="Delete Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">Delete Timetable Entry?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{deleteConfirmTarget.title}"</strong> from your timetable?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule / Slot Builder & Editor Modal */}
      {showModal && (
        <ScheduleBuilderModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          editingClass={editingClass}
          editingSlot={editingSlot}
          defaultMode={modalMode}
        />
      )}
    </div>
  );
};

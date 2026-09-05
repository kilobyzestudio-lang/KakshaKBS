import React, { useState } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import { ScheduleClass, ClassResource } from '../../types';
import {
  Calendar,
  Clock,
  BookOpen,
  FileText,
  Download,
  Lock,
  Unlock,
  Upload,
  ChevronDown,
  ChevronUp,
  Edit3,
  Check,
  Plus,
  X,
  AlertCircle,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';

interface ClassHistoryViewProps {
  batchId?: string;
}

// Client-side Image Compression Engine using HTML5 Canvas
async function compressImage(file: File, maxWidth = 1024, quality = 0.72): Promise<{ compressedDataUrl: string; originalKB: number; compressedKB: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target!.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const originalKB = Math.round(file.size / 1024);
        const compressedKB = Math.round((compressedDataUrl.length * 0.75) / 1024);
        
        resolve({ compressedDataUrl, originalKB, compressedKB });
      };
    };
    reader.readAsDataURL(file);
  });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

function timeUntilLock(cls: ScheduleClass, lockHours = 24): string {
  const endTimeStr = cls.endTime || '23:59';
  const endAt = cls.classEndedAt ? new Date(cls.classEndedAt) : new Date(`${cls.date}T${endTimeStr}:00`);
  const lockAt = endAt.getTime() + lockHours * 60 * 60 * 1000;
  const remaining = lockAt - Date.now();
  if (remaining <= 0) return 'locked';
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  return `${h}h ${m}m left`;
}

const UploadNotesModal: React.FC<{ cls: ScheduleClass; onClose: () => void }> = ({ cls, onClose }) => {
  const { addClassResource, currentUser } = useKaksha();
  const [title, setTitle] = useState('');
  const [resType, setResType] = useState<ClassResource['type']>('notes');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{ originalKB: number; compressedKB: number } | null>(null);
  const [sizeWarning, setSizeWarning] = useState('');
  const [done, setDone] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSizeWarning('');
    setCompressionStats(null);
    if (!file.type.startsWith('image/') && file.size > 5 * 1024 * 1024) {
      setSizeWarning(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB (>5 MB). Consider Google Drive link instead.`);
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setCompressing(true);
    let compressedDataUrl: string | undefined;
    let fileUrl = linkUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    let fileSize = 'Drive Link';

    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        const result = await compressImage(selectedFile);
        compressedDataUrl = result.compressedDataUrl;
        setCompressionStats({ originalKB: result.originalKB, compressedKB: result.compressedKB });
        const pct = Math.round((1 - result.compressedKB / Math.max(1, result.originalKB)) * 100);
        fileSize = `${result.compressedKB} KB (${pct > 0 ? `${pct}% smaller` : 'compressed'})`;
        fileUrl = compressedDataUrl;
      } else {
        fileSize = `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`;
      }
    }

    addClassResource({
      batchId: cls.batchId,
      classId: cls.id,
      title,
      type: resType,
      fileUrl,
      fileSize,
      compressedDataUrl,
      uploadedBy: currentUser?.name || 'Teacher',
    });

    setCompressing(false);
    setDone(true);
    setTimeout(() => onClose(), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" />
              Upload Class Notes & Materials
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{cls.title} • {formatDateLabel(cls.date)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-emerald-700">Material published successfully!</p>
              {compressionStats && (
                <p className="text-xs text-slate-500 mt-1">
                  Compressed from {compressionStats.originalKB} KB → {compressionStats.compressedKB} KB
                </p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Title *</label>
              <input
                type="text"
                placeholder="e.g. Chapter 5 — Quadratic Equations Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Material Type</label>
              <select
                value={resType}
                onChange={(e) => setResType(e.target.value as ClassResource['type'])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="notes">📚 Class Notes</option>
                <option value="homework">📝 Homework / Assignment</option>
                <option value="question_paper">📄 Question Paper</option>
                <option value="solution">✅ Solution / Answer Key</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Option A — Upload Image / Document (Auto-Compressed)
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="flex items-center gap-2 bg-white border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl shadow-sm hover:bg-indigo-50 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{selectedFile ? selectedFile.name : 'Choose Image / File'}</span>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {sizeWarning && (
                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1.5 rounded-lg flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> {sizeWarning}
                </p>
              )}
              <p className="text-[10px] text-slate-400">
                ⚡ Images are compressed client-side (max 1024px, 72% quality) to conserve storage space.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Option B — Paste External Document URL</p>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={compressing || (!selectedFile && !linkUrl)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {compressing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Compressing & Saving…</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Publish Material</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const ClassHistoryView: React.FC<ClassHistoryViewProps> = ({ batchId }) => {
  const {
    currentUser,
    classes,
    batches,
    getClassResources,
    isResourceUploadLocked,
    updateClassTopic,
  } = useKaksha();

  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [uploadModalClass, setUploadModalClass] = useState<ScheduleClass | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicDraft, setTopicDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '14days' | '30days'>('all');

  const isTeacher = currentUser?.role === 'teacher';
  const today = new Date().toISOString().split('T')[0];

  // Filter classes by batch, date < today (past classes), date range, and search query
  const relevantClasses = classes.filter((c) => {
    if (batchId && batchId !== 'all' && c.batchId !== batchId) return false;
    if (c.date >= today) return false; // Past classes only

    if (dateFilter !== 'all') {
      const clsDate = new Date(c.date + 'T00:00:00');
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - clsDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dateFilter === '7days' && diffDays > 7) return false;
      if (dateFilter === '14days' && diffDays > 14) return false;
      if (dateFilter === '30days' && diffDays > 30) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(q);
      const topicMatch = c.topicCovered ? c.topicCovered.toLowerCase().includes(q) : false;
      const batchMatch = c.batchName ? c.batchName.toLowerCase().includes(q) : false;
      return titleMatch || topicMatch || batchMatch;
    }

    return true;
  }).sort((a, b) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
    return diff !== 0 ? diff : b.startTime.localeCompare(a.startTime);
  });

  return (
    <div className="space-y-4">
      {/* Header Banner & Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Previous Classes & Backlogs</h3>
              <p className="text-xs text-slate-500">
                {isTeacher
                  ? `Upload notes & materials within 24 hours of class completion. Window locks automatically afterwards.`
                  : `View past topics covered, clear backlogs, and download attached class notes.`}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topic, title, or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Date range quick filters */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
            {(['all', '7days', '14days', '30days'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  dateFilter === f
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all'
                  ? 'All Past'
                  : f === '7days'
                  ? 'Last 7 Days'
                  : f === '14days'
                  ? 'Last 14 Days'
                  : 'Last 30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Class List */}
      {relevantClasses.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-2">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No previous classes found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || dateFilter !== 'all'
              ? 'Try clearing search keywords or expanding the date filter.'
              : 'Past class sessions will automatically appear here after completion.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {relevantClasses.map((cls) => {
            const classResources = getClassResources(cls.id);
            const locked = isResourceUploadLocked(cls, 24);
            const isExpanded = expandedClassId === cls.id;
            const targetBatch = batches.find((b) => b.id === cls.batchId);

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all hover:border-slate-300"
              >
                <div
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:bg-slate-50/60 transition-colors"
                  onClick={() => setExpandedClassId(isExpanded ? null : cls.id)}
                >
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-indigo-600 flex flex-col items-center justify-center text-white leading-tight">
                    <span className="text-xs font-black">
                      {new Date(cls.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric' })}
                    </span>
                    <span className="text-[9px] font-bold uppercase">
                      {new Date(cls.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{cls.title}</h4>
                      {targetBatch && (
                        <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {targetBatch.name}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                        {cls.classType === 'online' ? '🖥️ Online' : '🏫 In-Person'}
                      </span>
                      {classResources.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          📎 {classResources.length} file{classResources.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Clock className="w-3 h-3" />
                        {cls.startTime} – {cls.endTime}
                      </span>
                      {cls.topicCovered ? (
                        <span className="flex items-center gap-1 text-[10px] text-indigo-600 font-semibold truncate">
                          <BookOpen className="w-3 h-3" />
                          {cls.topicCovered}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No topic logged</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isTeacher && (
                      <span
                        className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-xl border ${
                          locked
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {locked ? <Lock className="w-3 h-3 text-slate-400" /> : <Unlock className="w-3 h-3 text-amber-600" />}
                        {locked ? '🔒 Locked (24h Expired)' : timeUntilLock(cls, 24)}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/50 space-y-4 animate-in fade-in duration-150">
                    {/* Topic Covered Section */}
                    {isTeacher && (
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                          Topic Covered in Class
                        </p>
                        {editingTopicId === cls.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              type="text"
                              placeholder="e.g. Quadratic equations — completing the square method"
                              value={topicDraft}
                              onChange={(e) => setTopicDraft(e.target.value)}
                              className="flex-1 px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <button
                              onClick={() => {
                                if (topicDraft.trim()) updateClassTopic(cls.id, topicDraft.trim());
                                setEditingTopicId(null);
                                setTopicDraft('');
                              }}
                              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTopicId(null);
                                setTopicDraft('');
                              }}
                              className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                            <p className="text-xs font-semibold text-slate-700 flex-1">
                              {cls.topicCovered || <span className="text-slate-400 italic">Not logged yet — click edit to log topic.</span>}
                            </p>
                            <button
                              onClick={() => {
                                setEditingTopicId(cls.id);
                                setTopicDraft(cls.topicCovered || '');
                              }}
                              className="p-1.5 bg-slate-50 text-slate-500 border border-slate-200 hover:text-indigo-600 hover:border-indigo-300 rounded-lg transition-colors"
                              title="Edit topic"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {!isTeacher && (
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                          Topic Covered
                        </p>
                        <p className="text-xs font-semibold text-indigo-700 bg-indigo-50/80 px-3.5 py-2.5 rounded-xl border border-indigo-100 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>{cls.topicCovered || 'Topic description pending teacher log.'}</span>
                        </p>
                      </div>
                    )}

                    {/* Attached Resources Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Attached Notes & Study Material
                        </p>
                        {isTeacher && !locked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadModalClass(cls);
                            }}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-xl transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Upload Notes
                          </button>
                        )}
                        {isTeacher && locked && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl">
                            <Lock className="w-3 h-3" /> 24h Lock Window Expired
                          </span>
                        )}
                      </div>

                      {classResources.length === 0 ? (
                        <div className="py-5 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                          <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-slate-400">
                            {isTeacher
                              ? locked
                                ? 'Upload window closed (24 hours post-class).'
                                : 'No notes uploaded yet. Upload within 24 hours of class end.'
                              : 'No study material attached for this class session.'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {classResources.map((res) => (
                            <div
                              key={res.id}
                              className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-3 group hover:shadow-sm transition-all"
                            >
                              {res.compressedDataUrl ? (
                                <img
                                  src={res.compressedDataUrl}
                                  alt={res.title}
                                  className="w-12 h-10 object-cover rounded-lg border border-slate-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4 text-indigo-600" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">
                                  {res.title}
                                </p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <span>{res.fileSize || 'Attached File'}</span>
                                  {res.uploadedBy && <span>• by {res.uploadedBy}</span>}
                                </p>
                              </div>

                              <a
                                href={res.compressedDataUrl || res.fileUrl}
                                download={res.compressedDataUrl ? `${res.title}.jpg` : undefined}
                                target={res.compressedDataUrl ? undefined : '_blank'}
                                rel="noreferrer"
                                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors shrink-0"
                                title="Download Material"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {uploadModalClass && (
        <UploadNotesModal cls={uploadModalClass} onClose={() => setUploadModalClass(null)} />
      )}
    </div>
  );
};

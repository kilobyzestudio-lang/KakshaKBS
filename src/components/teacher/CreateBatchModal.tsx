import React, { useState, useEffect } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import { BookOpen, Users, Calendar, X, Sparkles, AlertCircle } from 'lucide-react';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({ isOpen, onClose }) => {
  const { createBatch } = useKaksha();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [capacity, setCapacity] = useState(50);
  const [validUntil, setValidUntil] = useState('2027-03-31');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form whenever modal opens to stop auto-fill from previous batch creation
  useEffect(() => {
    if (isOpen) {
      setName('');
      setSubject('Mathematics');
      setCapacity(50);
      setValidUntil('2027-03-31');
      setDescription('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Please enter a valid batch name.');
      return;
    }

    const result = createBatch(cleanName, subject, capacity, validUntil, description);

    if (!result.success) {
      // Duplicate batch name or validation failure: Reject creation process and show error alert
      setErrorMsg(result.message);
      return;
    }

    // Success: Reset form state and close modal
    setName('');
    setDescription('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Create New Batch</h3>
            <p className="text-xs text-slate-500">Generates unique Batch Code for your students</p>
          </div>
        </div>

        {/* Rejection Alert Banner */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Batch Name * <span className="text-[10px] text-slate-400 font-normal">(Must be unique)</span>
            </label>
            <input
              type="text"
              name="batchName_new"
              autoComplete="off"
              placeholder="e.g. Class 10 Mathematics (Board Batch)"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="English">English</option>
                <option value="Social Science">Social Science</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student Capacity</label>
              <input
                type="number"
                min="1"
                max="500"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Validity Date</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Syllabi</label>
            <textarea
              name="batchDesc_new"
              autoComplete="off"
              placeholder="Brief summary of batch syllabus, timings, guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 flex items-start gap-2 text-xs text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              A unique persistent Batch Code (e.g. <span className="font-mono font-bold text-indigo-700">MATH-7XQ2</span>) will be generated automatically upon creation.
            </p>
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Create Batch Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

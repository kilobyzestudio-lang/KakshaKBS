import React, { useState } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import { KeyRound, CheckCircle2, ShieldAlert, X, Send, ShieldCheck, Clock } from 'lucide-react';

interface JoinBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinBatchModal: React.FC<JoinBatchModalProps> = ({ isOpen, onClose }) => {
  const { joinBatchByCode } = useKaksha();
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPending, setIsPending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = joinBatchByCode(code);
    if (res.success) {
      setSuccessMsg(res.message);
      setIsPending(!!res.isPending);
      setTimeout(() => {
        onClose();
        setCode('');
        setSuccessMsg('');
        setIsPending(false);
      }, 2500);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Join Tuition Batch</h3>
            <p className="text-xs text-slate-500">Enter the unique Batch Code given by your teacher</p>
          </div>
        </div>

        <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <span>
            <strong>Manual Teacher Approval:</strong> Even if a code is shared publicly, your teacher will personally review and approve your request before granting batch access.
          </span>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-3 rounded-xl text-xs flex items-start gap-2">
            {isPending ? <Clock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />}
            <span className="font-semibold leading-relaxed">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Code</label>
            <input
              type="text"
              placeholder="e.g. MATH-7XQ2 or PHYS-99AK"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full tracking-wider uppercase font-mono font-bold text-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
              autoFocus
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold py-3 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Send className="w-4 h-4" />
              <span>Send Join Request to Teacher</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

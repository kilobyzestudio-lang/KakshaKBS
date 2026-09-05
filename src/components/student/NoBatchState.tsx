import React from 'react';
import { PlusCircle, Search, Sparkles, BookOpen } from 'lucide-react';

interface NoBatchStateProps {
  onOpenJoinModal: () => void;
  onOpenMailModal: () => void;
}

export const NoBatchState: React.FC<NoBatchStateProps> = ({
  onOpenJoinModal,
  onOpenMailModal,
}) => {
  return (
    <div className="max-w-2xl mx-auto my-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
        <BookOpen className="w-10 h-10" />
      </div>

      <div>
        <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
          Student Onboarding
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
          You haven't joined any batch yet
        </h2>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
          Kaksha brings all your tuition classes from different teachers into one unified timetable. Ask your tuition teacher for their <strong className="text-slate-800">Batch Code</strong> to get started.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={onOpenJoinModal}
          className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 text-sm transform active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Join a Batch with Code</span>
        </button>

        <button
          onClick={onOpenMailModal}
          className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-3.5 rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Search className="w-4 h-4 text-slate-500" />
          <span>Contact Teacher via Teacher ID</span>
        </button>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left text-xs space-y-2">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>How Kaksha Works for Students:</span>
        </h4>
        <ul className="text-slate-600 space-y-1 pl-5 list-disc">
          <li>Join separate tuition batches for Math, Physics, Chemistry from different teachers.</li>
          <li>Kaksha automatically combines all class schedules into one daily timeline.</li>
          <li>Watch recorded YouTube lectures & join live online Zoom classes directly.</li>
        </ul>
      </div>
    </div>
  );
};

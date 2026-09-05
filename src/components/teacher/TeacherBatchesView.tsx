import React, { useState } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import { BookOpen, Plus, Copy, Check, Users, Search, ChevronRight } from 'lucide-react';

interface TeacherBatchesViewProps {
  onSelectBatch: (batchId: string) => void;
  onOpenCreateBatchModal: () => void;
}

export const TeacherBatchesView: React.FC<{
  onSelectBatch: (batchId: string) => void;
  onOpenCreateBatchModal: () => void;
}> = ({ onSelectBatch, onOpenCreateBatchModal }) => {
  const { currentUser, getTeacherBatches, memberships } = useKaksha();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!currentUser) return null;

  const teacherBatches = getTeacherBatches(currentUser.id);
  const filteredBatches = teacherBatches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Your Batches Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage all persistent teaching groups, capacity limits, and batch codes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search batch or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
          </div>

          <button
            onClick={onOpenCreateBatchModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-sm text-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Batch</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBatches.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No batches match your search.</p>
          </div>
        ) : (
          filteredBatches.map((batch) => {
            const enrolledCount = memberships.filter((m) => m.batchId === batch.id).length;
            const capacityPct = Math.round((enrolledCount / batch.studentCapacity) * 100);

            return (
              <div
                key={batch.id}
                onClick={() => onSelectBatch(batch.id)}
                className="p-6 rounded-3xl border border-slate-200 bg-white hover:shadow-lg hover:border-indigo-200 cursor-pointer transition-all space-y-4 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {batch.subject}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors">
                      {batch.name}
                    </h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{batch.description}</p>

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">
                      Batch Code
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
                    className="p-1.5 bg-white text-slate-600 hover:text-indigo-600 rounded-lg border border-slate-200 transition-colors"
                  >
                    {copiedCode === batch.code ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      Enrolled Students
                    </span>
                    <span>
                      {enrolledCount} / {batch.studentCapacity}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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
          })
        )}
      </div>
    </div>
  );
};

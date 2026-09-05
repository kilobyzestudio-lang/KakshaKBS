import React, { useState } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import { ClassResource } from '../../types';
import {
  FileText,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';

interface ClassResourcesSectionProps {
  batchId: string;
}

export const ClassResourcesSection: React.FC<ClassResourcesSectionProps> = ({ batchId }) => {
  const { currentUser, getBatchResources, addClassResource, deleteClassResource } = useKaksha();
  const batchResources = getBatchResources(batchId);

  const [activeFilter, setActiveFilter] = useState<'all' | 'notes' | 'homework' | 'question_paper'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<ClassResource['type']>('notes');
  const [resUrl, setResUrl] = useState('');
  const [resSize, setResSize] = useState('2.5 MB PDF');

  const filteredResources =
    activeFilter === 'all'
      ? batchResources
      : batchResources.filter((r) => r.type === activeFilter);

  const handleUploadResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle) return;
    addClassResource({
      batchId,
      title: resTitle,
      type: resType,
      fileUrl: resUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileSize: resSize || '1.8 MB PDF',
    });
    setShowAddModal(false);
    setResTitle('');
    setResUrl('');
  };

  const getTypeBadge = (type: ClassResource['type']) => {
    switch (type) {
      case 'notes':
        return <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">Notes 📚</span>;
      case 'homework':
        return <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">Homework 📝</span>;
      case 'question_paper':
        return <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">Question Paper 📄</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">Solution ✓</span>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Class Notes & Homework Resources</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Study materials, handwritten notes, and solved question papers for this batch.
          </p>
        </div>

        {currentUser?.role === 'teacher' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Notes / Homework</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Material ({batchResources.length})
        </button>
        <button
          onClick={() => setActiveFilter('notes')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeFilter === 'notes'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Class Notes
        </button>
        <button
          onClick={() => setActiveFilter('homework')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeFilter === 'homework'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Homework Assignments
        </button>
        <button
          onClick={() => setActiveFilter('question_paper')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeFilter === 'question_paper'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Question Papers
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredResources.length === 0 ? (
          <div className="col-span-2 text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-1" />
            <p className="text-xs font-semibold text-slate-600">No resources uploaded for this filter.</p>
          </div>
        ) : (
          filteredResources.map((res) => (
            <div
              key={res.id}
              className="p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:shadow-md transition-all flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1.5 overflow-hidden">
                <div className="flex items-center gap-2">
                  {getTypeBadge(res.type)}
                  <span className="text-[10px] text-slate-400 font-medium">{res.fileSize}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                  {res.title}
                </h4>
                <p className="text-[10px] text-slate-400">
                  Uploaded: {new Date(res.uploadedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={res.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors"
                  title="Open & Download Material"
                >
                  <Download className="w-4 h-4" />
                </a>

                {currentUser?.role === 'teacher' && (
                  <button
                    onClick={() => deleteClassResource(res.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Upload Notes / Homework Material</h3>

            <form onSubmit={handleUploadResource} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Title</label>
                <input
                  type="text"
                  placeholder="e.g. Quadratic Formula Handwritten Notes PDF"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Material Type</label>
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="notes">Class Notes</option>
                    <option value="homework">Homework</option>
                    <option value="question_paper">Question Paper</option>
                    <option value="solution">Solution</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">File Size Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. 2.4 MB PDF"
                    value={resSize}
                    onChange={(e) => setResSize(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Link (PDF / Google Drive / Cloud URL)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Publish Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

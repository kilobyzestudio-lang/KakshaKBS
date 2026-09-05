import React from 'react';
import { BatchContent } from '../../types';
import { Youtube, ShieldCheck, Lock, X } from 'lucide-react';
import { useKaksha } from '../../store/kakshaStore';

interface ContentPlayerModalProps {
  content: BatchContent | null;
  onClose: () => void;
}

export const ContentPlayerModal: React.FC<ContentPlayerModalProps> = ({ content, onClose }) => {
  const { currentUser } = useKaksha();
  if (!content) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="bg-slate-900 text-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-800 relative space-y-4 select-none"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Youtube className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Protected Kaksha Video Player
              </span>
              <h4 className="text-xs font-bold text-slate-300">{content.batchName}</h4>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 text-[11px] text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Anti-Sharing Shield Active</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Protected Frame Wrapper */}
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-black shadow-2xl border border-slate-800">
          <div
            className="absolute top-0 left-0 right-0 h-14 bg-transparent z-20 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            title="External sharing disabled"
          />

          <iframe
            className="w-full h-full relative z-10"
            src={`https://www.youtube-nocookie.com/embed/${content.youtubeId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&controls=1`}
            title={content.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          <div className="absolute bottom-2 left-2 z-20 bg-slate-950/70 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-400 border border-slate-800 pointer-events-none">
            Kaksha Secured Stream • Student: {currentUser?.kakshaId || 'GUEST'}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mt-1">{content.title}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{content.description}</p>
        </div>
      </div>
    </div>
  );
};

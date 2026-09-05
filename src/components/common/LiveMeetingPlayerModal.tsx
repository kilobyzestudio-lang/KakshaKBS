import React, { useState } from 'react';
import { ScheduleClass } from '../../types';
import { useKaksha } from '../../store/kakshaStore';
import {
  Video,
  PhoneOff,
  ShieldCheck,
  Maximize2,
  Minimize2,
  FileText,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface LiveMeetingPlayerModalProps {
  scheduleClass: ScheduleClass | null;
  onClose: () => void;
}

export const LiveMeetingPlayerModal: React.FC<LiveMeetingPlayerModalProps> = ({
  scheduleClass,
  onClose,
}) => {
  const { currentUser, getBatchResources } = useKaksha();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResourcesBar, setShowResourcesBar] = useState(false);

  if (!scheduleClass || !currentUser) return null;

  const classResources = getBatchResources(scheduleClass.batchId);

  // Generate a clean, unique Jitsi meeting room key per class
  const cleanRoomName = `Kaksha_${scheduleClass.batchCode.replace(/[^a-zA-Z0-9]/g, '')}_${scheduleClass.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  // Real Jitsi Web Engine URL with embedded user display name
  const jitsiMeetingUrl = `https://meet.jit.si/${cleanRoomName}#userInfo.displayName="${encodeURIComponent(currentUser.name)}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div
        className={`bg-slate-900 text-white rounded-3xl w-full flex flex-col shadow-2xl border border-slate-800 overflow-hidden transition-all ${
          isFullscreen ? 'fixed inset-0 rounded-none z-50' : 'max-w-6xl h-[92vh]'
        }`}
      >
        {/* Top Control Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  REAL IN-APP VIDEO CLASS
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  {scheduleClass.batchName}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mt-0.5">{scheduleClass.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {classResources.length > 0 && (
              <button
                onClick={() => setShowResourcesBar(!showResourcesBar)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  showResourcesBar
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Class Notes ({classResources.length})</span>
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Class</span>
            </button>
          </div>
        </div>

        {/* Optional Drawer for Attached Class Notes */}
        {showResourcesBar && classResources.length > 0 && (
          <div className="bg-slate-950 p-3 border-b border-slate-800 flex items-center gap-2 text-xs overflow-x-auto shrink-0">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Class Study Notes & Problem Sets:
            </span>
            {classResources.map((res) => (
              <a
                key={res.id}
                href={res.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-indigo-950 hover:bg-indigo-900 text-indigo-200 px-3 py-1 rounded-lg border border-indigo-800 text-xs font-semibold shrink-0 transition-colors"
              >
                📄 {res.title} ({res.fileSize})
              </a>
            ))}
          </div>
        )}

        {/* Real Embedded In-App Video Engine Frame (Jitsi Web RTC) */}
        <div className="flex-1 bg-black relative overflow-hidden">
          <iframe
            src={jitsiMeetingUrl}
            title={`Live Class: ${scheduleClass.title}`}
            allow="camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media; fullscreen"
            className="w-full h-full border-0 relative z-10"
          />

          {/* Security Watermark */}
          <div className="absolute top-3 left-3 z-20 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 pointer-events-none">
            Kaksha Encrypted Stream • User: {currentUser.name} ({currentUser.kakshaId})
          </div>
        </div>
      </div>
    </div>
  );
};

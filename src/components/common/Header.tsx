import React, { useState } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import {
  GraduationCap,
  Smartphone,
  Mail,
  ChevronDown,
  AlertTriangle,
  LogOut,
  PlusCircle,
  Phone,
  ShieldCheck,
  Camera,
  Upload,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenJoinBatchModal: () => void;
}

const AvatarUploadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUser, updateUserAvatar } = useKaksha();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrorMsg(null);
    setSuccessMsg(null);
    setSelectedFile(null);
    setPreviewUrl(null);

    if (!file) return;

    // Rule 1: PNG or JPG/JPEG format validation
    const allowedMime = ['image/png', 'image/jpeg', 'image/jpg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['png', 'jpg', 'jpeg'];

    if (!allowedMime.includes(file.type) || !ext || !allowedExts.includes(ext)) {
      setErrorMsg(`Upload Rejected! Only PNG (.png) and JPG (.jpg, .jpeg) images are allowed. (Selected format: ${file.type || ext || 'Invalid'})`);
      return;
    }

    // Rule 2: Maximum 200 KB size validation (200 * 1024 = 204,800 bytes)
    const MAX_SIZE_BYTES = 200 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const sizeKB = (file.size / 1024).toFixed(1);
      setErrorMsg(`Upload Rejected! Image size (${sizeKB} KB) exceeds the maximum 200 KB limit.`);
      return;
    }

    // Passed validation
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setPreviewUrl(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = () => {
    if (!previewUrl) return;
    updateUserAvatar(previewUrl);
    setSuccessMsg('Profile picture updated successfully!');
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Upload Profile Picture</h3>
              <p className="text-[10px] text-slate-500">PNG or JPG only • Max 200 KB limit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current & Preview Avatar */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-file-input')?.click()}>
            <img
              src={previewUrl || currentUser?.avatarUrl}
              alt="Avatar Preview"
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md group-hover:opacity-90 transition-opacity"
            />
            <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-xl shadow group-hover:scale-110 transition-transform">
              <Camera className="w-3.5 h-3.5" />
            </span>
          </div>

          {selectedFile && (
            <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ✓ Valid: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB / 200 KB)
            </p>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-700 flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Upload Selection Box */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
          <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-indigo-50 hover:border-indigo-300 transition-all text-slate-700">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Choose Image File</span>
            <input
              id="avatar-file-input"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <p className="text-[10px] text-slate-400 font-medium">
            Strict Validation: PNG or JPG format only • Max 200 KB limit.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!previewUrl || !!errorMsg}
            onClick={handleSaveAvatar}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Set Profile Picture</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenJoinBatchModal,
}) => {
  const { currentUser, logout, sessionWarning, setSessionWarning, mails, getPendingJoinRequestsForTeacher } = useKaksha();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  if (!currentUser) return null;

  const unreadMails = mails.filter(
    (m) => m.receiverId === currentUser.kakshaId && m.status === 'unread'
  ).length;

  const pendingRequestsCount = currentUser.role === 'teacher' ? getPendingJoinRequestsForTeacher(currentUser.kakshaId).length : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Session Security Warning Banner */}
      {sessionWarning && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-100 animate-bounce" />
            <span>{sessionWarning}</span>
          </div>
          <button
            onClick={() => setSessionWarning(null)}
            className="text-amber-100 hover:text-white underline text-xs ml-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & KBS Brand Tagline */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Kaksha<span className="text-indigo-600">.</span>
                </span>
                <span className="bg-amber-50 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
                  by KBS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                One platform for teacher • Unified space for student
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('batches')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'batches'
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {currentUser.role === 'teacher' ? 'My Batches' : 'Enrolled Batches'}
            </button>

            {currentUser.role === 'teacher' && (
              <button
                onClick={() => setActiveTab('students')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'students'
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Students Directory
              </button>
            )}

            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'schedule'
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {currentUser.role === 'student' ? 'Unified Schedule' : 'Teaching Timetable'}
            </button>

            <button
              onClick={() => setActiveTab('mail')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === 'mail'
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <span>Kaksha Mail</span>
                {(unreadMails > 0 || pendingRequestsCount > 0) && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {unreadMails + pendingRequestsCount}
                  </span>
                )}
              </div>
            </button>
          </nav>

          {/* Right Profile & Actions */}
          <div className="flex items-center gap-2">
            {currentUser.role === 'student' && (
              <button
                onClick={onOpenJoinBatchModal}
                className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all transform active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Join Batch</span>
              </button>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 p-1.5 pl-2.5 pr-2 rounded-xl transition-all border border-slate-200"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover ring-2 ring-indigo-500/30"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full text-[8px]" title="Change Avatar">
                    <Camera className="w-2.5 h-2.5" />
                  </span>
                </div>
                <div className="text-left hidden lg:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 max-w-[110px] truncate">
                      {currentUser.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        currentUser.role === 'teacher'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <ShieldCheck className="w-3 h-3 text-indigo-500" />
                    <span>ID: {currentUser.kakshaId}</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Profile Card Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div
                      className="relative cursor-pointer group"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setShowAvatarModal(true);
                      }}
                      title="Click to upload custom picture"
                    >
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/30 group-hover:opacity-80 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">{currentUser.name}</h4>
                      <p className="text-[10px] font-mono text-indigo-600 font-bold">
                        ID: {currentUser.kakshaId}
                      </p>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          setShowAvatarModal(true);
                        }}
                        className="mt-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Upload Picture (PNG/JPG &le;200KB)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentUser.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">Session: {currentUser.activeDeviceId}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden border-t border-slate-100 bg-white px-2 py-1.5 flex justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
            activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
            activeTab === 'batches' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
          }`}
        >
          Batches
        </button>
        {currentUser.role === 'teacher' && (
          <button
            onClick={() => setActiveTab('students')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'students' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
            }`}
          >
            Students
          </button>
        )}
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
            activeTab === 'schedule' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
          }`}
        >
          Schedule
        </button>
        <button
          onClick={() => setActiveTab('mail')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
            activeTab === 'mail' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
          }`}
        >
          <span>Mail</span>
          {unreadMails + pendingRequestsCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-bold px-1 rounded-full">
              {unreadMails + pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Avatar Upload Modal */}
      {showAvatarModal && (
        <AvatarUploadModal onClose={() => setShowAvatarModal(false)} />
      )}
    </header>
  );
};

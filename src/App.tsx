import React, { useState } from 'react';
import { KakshaProvider, useKaksha } from './store/kakshaStore';
import { Header } from './components/common/Header';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { BatchManager } from './components/teacher/BatchManager';
import { TeacherBatchesView } from './components/teacher/TeacherBatchesView';
import { TeacherTimetableView } from './components/teacher/TeacherTimetableView';
import { TeacherStudentsDirectoryView } from './components/teacher/TeacherStudentsDirectoryView';
import { StudentDashboard } from './components/student/StudentDashboard';
import { KakshaMailInbox } from './components/mail/KakshaMailInbox';
import { AuthPage } from './components/auth/AuthPage';
import { JoinBatchModal } from './components/student/JoinBatchModal';
import { CreateBatchModal } from './components/teacher/CreateBatchModal';
import { ScheduleBuilderModal } from './components/teacher/ScheduleBuilderModal';
import { ContentPlayerModal } from './components/student/ContentPlayerModal';
import { LiveMeetingPlayerModal } from './components/common/LiveMeetingPlayerModal';
import { BatchContent, ScheduleClass } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser, isAuthenticated } = useKaksha();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'batches' | 'students' | 'schedule' | 'mail'>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Modals visibility state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDefaultBatchId, setScheduleDefaultBatchId] = useState<string | undefined>(undefined);
  const [playingVideo, setPlayingVideo] = useState<BatchContent | null>(null);
  const [activeLiveClass, setActiveLiveClass] = useState<ScheduleClass | null>(null);

  if (!isAuthenticated || !currentUser) {
    return <AuthPage />;
  }

  const handleOpenScheduleModal = (bId?: string) => {
    setScheduleDefaultBatchId(bId);
    setShowScheduleModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab as any);
          setSelectedBatchId(null);
        }}
        onOpenJoinBatchModal={() => setShowJoinModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <>
            {currentUser.role === 'teacher' ? (
              selectedBatchId ? (
                <BatchManager
                  batchId={selectedBatchId}
                  onBack={() => setSelectedBatchId(null)}
                  onOpenScheduleModal={handleOpenScheduleModal}
                />
              ) : (
                <TeacherDashboard
                  onSelectBatch={(id) => {
                    setSelectedBatchId(id);
                    setActiveTab('batches');
                  }}
                  onOpenCreateBatchModal={() => setShowCreateBatchModal(true)}
                  onOpenScheduleModal={handleOpenScheduleModal}
                  onStartLiveMeeting={(cls) => setActiveLiveClass(cls)}
                  onNavigateToStudents={() => setActiveTab('students')}
                />
              )
            ) : (
              <StudentDashboard
                onOpenJoinBatchModal={() => setShowJoinModal(true)}
                onOpenMailModal={() => setActiveTab('mail')}
                onPlayVideo={(cnt) => setPlayingVideo(cnt)}
                onJoinLiveMeeting={(cls) => setActiveLiveClass(cls)}
              />
            )}
          </>
        )}

        {activeTab === 'batches' && (
          <>
            {currentUser.role === 'teacher' ? (
              selectedBatchId ? (
                <BatchManager
                  batchId={selectedBatchId}
                  onBack={() => setSelectedBatchId(null)}
                  onOpenScheduleModal={handleOpenScheduleModal}
                />
              ) : (
                <TeacherBatchesView
                  onSelectBatch={(id) => setSelectedBatchId(id)}
                  onOpenCreateBatchModal={() => setShowCreateBatchModal(true)}
                />
              )
            ) : (
              <StudentDashboard
                onOpenJoinBatchModal={() => setShowJoinModal(true)}
                onOpenMailModal={() => setActiveTab('mail')}
                onPlayVideo={(cnt) => setPlayingVideo(cnt)}
                onJoinLiveMeeting={(cls) => setActiveLiveClass(cls)}
              />
            )}
          </>
        )}

        {activeTab === 'students' && (
          <>
            {currentUser.role === 'teacher' ? (
              <TeacherStudentsDirectoryView />
            ) : (
              <StudentDashboard
                onOpenJoinBatchModal={() => setShowJoinModal(true)}
                onOpenMailModal={() => setActiveTab('mail')}
                onPlayVideo={(cnt) => setPlayingVideo(cnt)}
                onJoinLiveMeeting={(cls) => setActiveLiveClass(cls)}
              />
            )}
          </>
        )}

        {activeTab === 'schedule' && (
          <>
            {currentUser.role === 'teacher' ? (
              <TeacherTimetableView
                onOpenScheduleModal={() => handleOpenScheduleModal()}
                onStartLiveMeeting={(cls) => setActiveLiveClass(cls)}
              />
            ) : (
              <StudentDashboard
                onOpenJoinBatchModal={() => setShowJoinModal(true)}
                onOpenMailModal={() => setActiveTab('mail')}
                onPlayVideo={(cnt) => setPlayingVideo(cnt)}
                onJoinLiveMeeting={(cls) => setActiveLiveClass(cls)}
              />
            )}
          </>
        )}

        {activeTab === 'mail' && <KakshaMailInbox />}
      </main>

      {/* Global Modals */}
      <JoinBatchModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
      <CreateBatchModal isOpen={showCreateBatchModal} onClose={() => setShowCreateBatchModal(false)} />
      <ScheduleBuilderModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        defaultBatchId={scheduleDefaultBatchId}
      />
      <ContentPlayerModal content={playingVideo} onClose={() => setPlayingVideo(null)} />
      <LiveMeetingPlayerModal scheduleClass={activeLiveClass} onClose={() => setActiveLiveClass(null)} />
    </div>
  );
};

export default function App() {
  return (
    <KakshaProvider>
      <MainAppContent />
    </KakshaProvider>
  );
}

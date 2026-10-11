/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginModal } from './components/auth/LoginModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { MeetingsListView } from './components/meetings/MeetingsListView';
import { MeetingDetailView } from './components/meetings/MeetingDetailView';
import { MeetingModal } from './components/meetings/MeetingModal';
import { AiLinksView } from './components/aiLinks/AiLinksView';
import { MinutesListView } from './components/minutes/MinutesListView';
import { UsersListView } from './components/users/UsersListView';
import { DriveFilesView } from './components/drive/DriveFilesView';
import { SettingsView } from './components/settings/SettingsView';
import { PendingDeleteNotificationBar } from './components/common/PendingDeleteNotificationBar';
import { Meeting } from './types';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, selectedMeetingId, meetings, currentUser } = useApp();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingToEdit, setMeetingToEdit] = useState<Meeting | null>(null);

  const handleOpenCreateMeeting = () => {
    setMeetingToEdit(null);
    setIsMeetingModalOpen(true);
  };

  const handleOpenEditMeeting = (meeting: Meeting) => {
    setMeetingToEdit(meeting);
    setIsMeetingModalOpen(true);
  };

  // NẾU CHƯA ĐĂNG NHẬP: BẮT BUỘC PHẢI ĐĂNG NHẬP BẰNG TÀI KHOẢN VÀ MẬT KHẨU ĐÃ ĐƯỢC CẤP
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900/60 backdrop-blur-xs flex flex-col justify-center items-center p-3 sm:p-4">
        <ToastContainer />
        <LoginModal
          isOpen={true}
          canDismiss={false}
          onClose={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Main Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenCreateMeetingModal={handleOpenCreateMeeting}
      />

      {/* Safety Pending Delete Notification Bar */}
      <PendingDeleteNotificationBar />

      {/* Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Navigation Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenCreateMeetingModal={handleOpenCreateMeeting}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView onOpenCreateMeeting={handleOpenCreateMeeting} />
          )}

          {activeTab === 'meetings' && (
            <MeetingsListView
              onOpenCreateMeeting={handleOpenCreateMeeting}
              onOpenEditMeeting={handleOpenEditMeeting}
            />
          )}

          {activeTab === 'meeting-detail' && (
            <MeetingDetailView
              onBack={() => setActiveTab('meetings')}
              onEditMeeting={() => {
                const meet = meetings.find((m) => m.id === selectedMeetingId);
                if (meet) {
                  setMeetingToEdit(meet);
                  setIsMeetingModalOpen(true);
                }
              }}
            />
          )}

          {activeTab === 'ai-links' && <AiLinksView />}

          {activeTab === 'drive' && <DriveFilesView />}

          {activeTab === 'minutes' && <MinutesListView />}

          {activeTab === 'users' && <UsersListView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <MeetingModal
        isOpen={isMeetingModalOpen}
        meetingToEdit={meetingToEdit}
        onClose={() => {
          setIsMeetingModalOpen(false);
          setMeetingToEdit(null);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

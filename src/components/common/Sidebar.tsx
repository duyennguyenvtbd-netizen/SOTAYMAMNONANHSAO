import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  FileText,
  Users,
  HardDrive,
  Settings,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

import {
  canCreateMeeting,
  isGroupLeader,
  isVicePrincipal,
  getUserMeetingRoleBadge,
} from '../../utils/permissionUtils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateMeetingModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpenCreateMeetingModal,
}) => {
  const { activeTab, setActiveTab, currentUser, meetings, aiLinks, minutes, driveFiles } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const canCreate = canCreateMeeting(currentUser);
  const roleBadge = getUserMeetingRoleBadge(currentUser);

  const upcomingCount = meetings.filter((m) => m.status === 'upcoming' || m.status === 'ongoing').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan hệ thống',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'meetings',
      label: 'Quản lý cuộc họp',
      icon: CalendarDays,
      badge: upcomingCount > 0 ? `${upcomingCount}` : null,
      badgeClass: 'bg-amber-100 text-amber-800 font-bold',
    },
    {
      id: 'drive',
      label: 'Kho tài liệu Google Drive',
      icon: HardDrive,
      badge: `${driveFiles.length}`,
      badgeClass: 'bg-emerald-100 text-emerald-800 font-bold',
      highlight: true,
    },
    {
      id: 'ai-links',
      label: 'Kho liên kết Google AI Studio',
      icon: Sparkles,
      badge: `${aiLinks.length}`,
      badgeClass: 'bg-orange-100 text-orange-800 font-bold',
    },
    {
      id: 'minutes',
      label: 'Sổ biên bản lưu trữ',
      icon: FileText,
      badge: `${minutes.length}`,
    },
    {
      id: 'users',
      label: 'Cán bộ & Giáo viên',
      icon: Users,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Cài đặt & Sao lưu',
      icon: Settings,
      badge: null,
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-amber-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="p-4 border-b border-amber-100 flex items-center justify-between lg:hidden bg-amber-50/50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="text-xs font-bold text-amber-900">MN ÁNH SAO - PHƯỜNG RẠCH DỪA</div>
              <div className="text-[11px] text-slate-500">Sổ tay điện tử họp trường</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Quick Action Button for Allowed Roles */}
        <div className="p-4 pb-2">
          {canCreate ? (
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  onOpenCreateMeetingModal();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {isGroupLeader(currentUser)
                    ? `Tạo cuộc họp ${currentUser?.group || 'tổ, khối'}`
                    : isVicePrincipal(currentUser)
                    ? 'Tạo cuộc họp chuyên môn / bán trú'
                    : 'Tạo cuộc họp mới'}
                </span>
              </button>
              <div className="text-[11px] text-amber-900 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200/70 leading-tight">
                {roleBadge.scopeText}
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
              <span className="font-bold">⭐ Tài khoản Giáo viên</span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Xem cuộc họp, tự điểm danh và gửi ý kiến đóng góp.
              </p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Danh mục làm việc
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/20'
                      : 'bg-amber-100 text-amber-950 font-extrabold shadow-xs'
                    : item.highlight
                    ? 'text-orange-700 hover:bg-orange-50/70 border border-orange-200/70'
                    : 'text-slate-600 hover:bg-amber-50/60 hover:text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? item.highlight
                          ? 'text-white'
                          : 'text-amber-700'
                        : item.highlight
                        ? 'text-orange-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                      isActive && item.highlight
                        ? 'bg-white/30 text-white'
                        : item.badgeClass || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* School Info Footer */}
        <div className="p-4 border-t border-amber-100 bg-amber-50/30">
          <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
            <span>🏫</span>
            <span className="truncate">MN Ánh Sao - P. Rạch Dừa</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 leading-snug">
            Phường Rạch Dừa, TP. Vũng Tàu · Họp Hội đồng, Họp Chuyên môn & Kho AI Studio.
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-200/50 flex items-center justify-between text-[11px] text-amber-800 font-medium">
            <span>Phiên bản: 2.5 (2026)</span>
            <span className="text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Trực tuyến
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

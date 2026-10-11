import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import {
  Menu,
  Sparkles,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Calendar,
  Clock,
  ExternalLink,
  PlusCircle,
  KeyRound,
  Settings,
  Save,
  RotateCcw,
} from 'lucide-react';

import {
  canCreateMeeting,
  getUserMeetingRoleBadge,
} from '../../utils/permissionUtils';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenLoginModal: () => void;
  onOpenCreateMeetingModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenLoginModal,
  onOpenCreateMeetingModal,
}) => {
  const {
    currentUser,
    logout,
    setActiveTab,
    loginAsUser,
    users,
    pendingDeletions,
    commitPendingDeletion,
    revertPendingDeletion,
  } = useApp();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
          ' · ' +
          now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isAdmin = currentUser?.role === 'admin';
  const canCreate = canCreateMeeting(currentUser);
  const roleBadge = getUserMeetingRoleBadge(currentUser);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left: Mobile hamburger & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <span className="text-xl sm:text-2xl select-none">⭐</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                    MN Ánh Sao · P. Rạch Dừa
                  </span>
                  <span className="hidden sm:inline-block text-[11px] text-slate-400">
                    Năm học 2026-2027
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors leading-tight">
                  SỔ TAY TRƯỜNG MN ÁNH SAO PHƯỜNG RẠCH DỪA
                </h1>
              </div>
            </button>
          </div>

          {/* Center: Live clock on desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-amber-50/70 border border-amber-200/60 px-3.5 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="capitalize">{currentTime}</span>
            </div>
          </div>

          {/* Right: Quick actions & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pending Deletion Save Button */}
            {pendingDeletions.length > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-300 p-1 rounded-2xl animate-pulse">
                <button
                  onClick={() => revertPendingDeletion()}
                  className="px-2.5 py-1 rounded-xl bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold border border-slate-200 flex items-center gap-1 shadow-xs cursor-pointer"
                  title="Hủy xóa - Quay về ban đầu"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden lg:inline">Quay về ban đầu</span>
                </button>
                <button
                  onClick={() => commitPendingDeletion()}
                  className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm shadow-emerald-600/20 cursor-pointer"
                  title="Lưu lại - Lưu trữ thông tin thành viên vĩnh viễn"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu lại ({pendingDeletions.length})</span>
                </button>
              </div>
            )}

            {/* Quick AI Studio Button */}
            <button
              onClick={() => setActiveTab('ai-links')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all shadow-xs"
              title="Mở Kho liên kết Google AI Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Kho AI Studio</span>
            </button>

            {/* Quick Create Meeting Button for Allowed Roles */}
            {canCreate && (
              <button
                onClick={onOpenCreateMeetingModal}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-600/20 transition-all cursor-pointer"
                title={roleBadge.scopeText}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tạo cuộc họp</span>
              </button>
            )}

            {/* User Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl hover:bg-amber-50/80 border border-transparent hover:border-amber-200 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-lg shadow-inner shrink-0">
                    {currentUser.avatar || (isAdmin ? '👩‍💼' : '👩‍🏫')}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                      {currentUser.name}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] leading-tight font-medium">
                      <span className="font-bold text-amber-900 truncate max-w-[110px]">
                        {roleBadge.label}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 truncate max-w-[80px]">
                        {currentUser.group}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {showUserDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowUserDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-3 border-b border-slate-100 bg-amber-50/50 rounded-xl mb-1">
                        <div className="text-xs font-bold text-slate-900">
                          {currentUser.name}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                          {currentUser.title}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isAdmin
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isAdmin ? '👑 VAI TRÒ QUẢN TRỊ' : '⭐ VAI TRÒ THÀNH VIÊN'}
                          </span>
                        </div>
                      </div>

                      {/* Personal account info */}
                      <div className="py-2.5 px-3 bg-slate-50 rounded-xl my-1 text-xs space-y-1.5 border border-slate-100">
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Tài khoản cá nhân:</span>
                          <span className="font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{currentUser.username}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Tổ / Bộ phận:</span>
                          <span className="text-slate-800 font-medium truncate max-w-[130px]">{currentUser.group}</span>
                        </div>
                        <div className="text-[11px] text-emerald-800 font-medium pt-1.5 border-t border-slate-200 flex items-center gap-1">
                          <span>🔒</span>
                          <span>Đã xác thực mật khẩu cá nhân</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            setIsChangePasswordOpen(true);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-amber-900 hover:bg-amber-50 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>Đổi mật khẩu</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            setActiveTab('settings');
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5 text-amber-600" />
                          <span>Cài đặt & Sao lưu hệ thống</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenLoginModal();
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>Đăng nhập tài khoản khác</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            logout();
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
};

import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarDays,
  Clock,
  Users,
  FileText,
  Sparkles,
  ArrowRight,
  PlusCircle,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

import {
  canCreateMeeting,
  isGroupLeader,
  isVicePrincipal,
  getUserMeetingRoleBadge,
} from '../../utils/permissionUtils';

interface DashboardViewProps {
  onOpenCreateMeeting: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenCreateMeeting }) => {
  const {
    meetings,
    users,
    minutes,
    aiLinks,
    currentUser,
    selectMeeting,
    setActiveTab,
    addToast,
    incrementLinkViews,
    getMeetingEffectiveStatus,
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const canCreate = canCreateMeeting(currentUser);
  const roleBadge = getUserMeetingRoleBadge(currentUser);

  // Metrics using real-time calculated status
  const totalMeetings = meetings.length;
  const ongoingMeetings = meetings.filter((m) => getMeetingEffectiveStatus(m) === 'ongoing');
  const upcomingMeetings = meetings.filter((m) => getMeetingEffectiveStatus(m) === 'upcoming');
  const completedMeetings = meetings.filter((m) => getMeetingEffectiveStatus(m) === 'completed');

  // Next meeting (ongoing first, or next upcoming)
  const nextMeeting = ongoingMeetings[0] || upcomingMeetings[0] || meetings[0];

  const handleCopyLink = async (url: string, name: string) => {
    try {
      await navigator.clipboard.writeText(url);
      addToast(`Đã sao chép liên kết "${name}"!`, 'success');
    } catch {
      addToast(`Đã sao chép liên kết "${name}"!`, 'success');
    }
  };

  const handleOpenLink = (id: string, url: string) => {
    incrementLinkViews(id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-amber-500/10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-100 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full w-fit mb-3">
            <span>⭐</span>
            <span>Trường Mầm Non Ánh Sao Phường Rạch Dừa</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Xin chào, {currentUser ? currentUser.name : 'Quý Thầy Cô'}!
            </h1>
            {currentUser && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-xs ${roleBadge.badgeClass}`}>
                {roleBadge.label}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs sm:text-sm md:text-base text-amber-100 max-w-2xl leading-relaxed">
            {roleBadge.scopeText}. Nơi quản lý lịch họp hội đồng, họp chuyên môn các tổ khối, điểm danh trực tuyến và kết nối các ứng dụng thông minh từ <strong>Google AI Studio</strong>.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {canCreate && (
              <button
                onClick={onOpenCreateMeeting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-amber-900 font-extrabold text-xs sm:text-sm shadow-md hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-600" />
                <span>
                  {isGroupLeader(currentUser)
                    ? `Tạo cuộc họp ${currentUser?.group || 'tổ, khối'}`
                    : 'Tạo cuộc họp mới'}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('ai-links')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/20 hover:bg-black/30 backdrop-blur-xs text-white font-bold text-xs sm:text-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Mở Kho AI Studio ({aiLinks.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Key Stat Cards Required by Prompt */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Tổng số cuộc họp */}
        <div
          onClick={() => setActiveTab('meetings')}
          className="bg-white rounded-2xl p-4 border border-amber-100 hover:border-amber-300 shadow-xs cursor-pointer transition-all hover:bg-amber-50/20"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tổng cuộc họp
            </span>
            <CalendarDays className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalMeetings}</div>
          <div className="text-[11px] text-slate-500 mt-1">Toàn trường</div>
        </div>

        {/* 2. Cuộc họp sắp diễn ra */}
        <div
          onClick={() => setActiveTab('meetings')}
          className="bg-white rounded-2xl p-4 border border-amber-200/80 hover:border-amber-400 shadow-xs cursor-pointer transition-all bg-amber-50/30"
        >
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Sắp diễn ra
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800">
            {upcomingMeetings.length}
          </div>
          <div className="text-[11px] text-amber-700">Đang chuẩn bị</div>
        </div>

        {/* 3. Cuộc họp đang diễn ra */}
        <div
          onClick={() => setActiveTab('meetings')}
          className="bg-white rounded-2xl p-4 border border-emerald-200 hover:border-emerald-400 shadow-xs cursor-pointer transition-all bg-emerald-50/30"
        >
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Đang diễn ra
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {ongoingMeetings.length}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold">Trực tuyến / Hội trường</div>
        </div>

        {/* 4. Số thành viên */}
        <div
          onClick={() => setActiveTab('users')}
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-amber-300 shadow-xs cursor-pointer transition-all hover:bg-amber-50/20"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Thành viên
            </span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{users.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Cán bộ & GV</div>
        </div>

        {/* 5. Số biên bản đã lưu */}
        <div
          onClick={() => setActiveTab('minutes')}
          className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-amber-300 shadow-xs cursor-pointer transition-all hover:bg-amber-50/20"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Biên bản lưu
            </span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{minutes.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Đã lưu trữ</div>
        </div>

        {/* 6. Số liên kết tài liệu (Google AI Studio) */}
        <div
          onClick={() => setActiveTab('ai-links')}
          className="bg-white rounded-2xl p-4 border border-orange-200 hover:border-orange-400 shadow-xs cursor-pointer transition-all bg-orange-50/30"
        >
          <div className="flex items-center justify-between text-orange-600 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800">
              Kho AI Studio
            </span>
            <Sparkles className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-extrabold text-orange-700">{aiLinks.length}</div>
          <div className="text-[11px] text-orange-700 font-bold">Ứng dụng số</div>
        </div>
      </div>

      {/* Lịch họp gần nhất (Next schedule banner) */}
      {nextMeeting && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-lg">
                📌 Lịch họp gần nhất
              </span>
              {getMeetingEffectiveStatus(nextMeeting) === 'ongoing' ? (
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1.5 animate-pulse shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Đang diễn ra cuộc họp
                </span>
              ) : getMeetingEffectiveStatus(nextMeeting) === 'completed' ? (
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Cuộc họp đã kết thúc
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  Sắp diễn ra
                </span>
              )}
            </div>

            <button
              onClick={() => selectMeeting(nextMeeting.id)}
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <span>Vào phòng họp & Điểm danh</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
            {nextMeeting.title}
          </h2>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>
                <strong>Thời gian:</strong> {nextMeeting.startTime} - {nextMeeting.endTime} (Ngày {nextMeeting.date})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span className="truncate">
                <strong>Địa điểm:</strong> {nextMeeting.location}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-600" />
              <span className="truncate">
                <strong>Chủ trì:</strong> {nextMeeting.host}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Meetings Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Các Cuộc Họp Gần Đây
            </h2>
            <p className="text-xs text-slate-500">
              Danh sách các cuộc họp hội đồng, chuyên môn và tổ khối mới nhất.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('meetings')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 p-1"
          >
            <span>Xem tất cả ({meetings.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {meetings.slice(0, 4).map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white rounded-3xl border border-amber-100 hover:border-amber-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                    {meeting.type}
                  </span>
                  {meeting.status === 'ongoing' && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Đang họp
                    </span>
                  )}
                  {meeting.status === 'upcoming' && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Sắp họp
                    </span>
                  )}
                  {meeting.status === 'completed' && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Đã xong
                    </span>
                  )}
                </div>

                <h3
                  onClick={() => selectMeeting(meeting.id)}
                  className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 cursor-pointer text-sm sm:text-base leading-snug"
                >
                  {meeting.title}
                </h3>

                <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {meeting.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                    <span>{meeting.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{meeting.startTime} - {meeting.endTime}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">Chủ trì: {meeting.host}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                  📍 {meeting.location}
                </span>

                <button
                  onClick={() => selectMeeting(meeting.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Highlight: Kho ứng dụng Google AI Studio nổi bật */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🤖
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Kho Liên Kết Google AI Studio Tiêu Biểu
              </h2>
              <p className="text-xs text-slate-600">
                Các trợ lý AI hỗ trợ giáo án STEAM, thực đơn dinh dưỡng và truyện thơ cho bé.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('ai-links')}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-white border border-amber-200 px-3 py-1.5 rounded-xl shadow-2xs"
          >
            Vào kho ứng dụng →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {aiLinks.slice(0, 3).map((link) => (
            <div
              key={link.id}
              className="bg-white rounded-2xl p-4 border border-amber-100 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                    {link.category}
                  </span>
                  <span className="text-emerald-700 font-semibold">Đang hoạt động</span>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                  {link.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {link.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(link.url, link.name)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-amber-300 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Sao chép liên kết"
                >
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Sao chép</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenLink(link.id, link.url)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 transition-all"
                  title="Mở ứng dụng trong tab mới"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Mở ứng dụng</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

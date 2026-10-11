import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Meeting, MeetingType, MeetingStatus } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  CalendarDays,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowRight,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Users,
  Layers,
  Sparkles,
  Lock,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import { UploadMinuteModal } from './UploadMinuteModal';

import {
  canCreateMeeting,
  canManageMeeting,
  canDeleteMeeting,
  canUserAccessMeeting,
  getMeetingAssignedGroup,
  isGroupLeader,
  isVicePrincipal,
  isBoardOfDirectors,
  getUserMeetingRoleBadge,
} from '../../utils/permissionUtils';

interface MeetingsListViewProps {
  onOpenCreateMeeting: () => void;
  onOpenEditMeeting: (meeting: Meeting) => void;
}

export const MeetingsListView: React.FC<MeetingsListViewProps> = ({
  onOpenCreateMeeting,
  onOpenEditMeeting,
}) => {
  const {
    meetings,
    currentUser,
    selectMeeting,
    deleteMeeting,
    getMeetingAttendance,
    getMeetingMinutes,
    getMeetingEffectiveStatus,
    addToast,
  } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const canCreate = canCreateMeeting(currentUser);
  const roleBadge = getUserMeetingRoleBadge(currentUser);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hostFilter, setHostFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'accessible' | 'my_group'>('all');

  // Confirmation modal
  const [deleteMeetingId, setDeleteMeetingId] = useState<string | null>(null);
  const [uploadMinuteMeeting, setUploadMinuteMeeting] = useState<Meeting | null>(null);

  // Distinct hosts for filter
  const distinctHosts = Array.from(new Set(meetings.map((m) => m.host)));

  // Filter logic
  const filteredMeetings = meetings.filter((meeting) => {
    const effectiveStatus = getMeetingEffectiveStatus(meeting);
    const matchesSearch =
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.host.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || meeting.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    const matchesHost = hostFilter === 'all' || meeting.host === hostFilter;

    return matchesSearch && matchesType && matchesStatus && matchesHost;
  });

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border-2 border-emerald-300 shadow-xs animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Đang diễn ra cuộc họp
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Sắp diễn ra
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            Cuộc họp đã kết thúc
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Đã hủy
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Quản Lý Cuộc Họp Nhà Trường
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Họp Hội đồng Sư phạm, họp chuyên môn các tổ khối Mầm, Chồi, Lá và các cuộc họp nội bộ MN Ánh Sao Phường Rạch Dừa.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={onOpenCreateMeeting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {isGroupLeader(currentUser)
                ? `Tạo cuộc họp ${currentUser?.group || 'tổ, khối'}`
                : isVicePrincipal(currentUser)
                ? 'Tạo cuộc họp chuyên môn / bán trú'
                : 'Tạo cuộc họp mới'}
            </span>
          </button>
        )}
      </div>

      {/* Role permission info banner */}
      {canCreate && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">
              {isGroupLeader(currentUser) ? '⭐' : isVicePrincipal(currentUser) ? '📘' : '👑'}
            </span>
            <div className="min-w-0">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <span>{currentUser?.name}</span>
                <span className="text-slate-500 font-normal">({currentUser?.title} · {currentUser?.group})</span>
              </div>
              <div className="text-amber-900 font-medium text-[11px] mt-0.5">
                {roleBadge.scopeText}
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border shrink-0 ${roleBadge.badgeClass}`}>
            {roleBadge.label}
          </span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm cuộc họp theo tên, nội dung, chủ trì hoặc địa điểm..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {/* Loại cuộc họp */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Loại cuộc họp:
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-amber-500"
            >
              <option value="all">Tất cả loại cuộc họp</option>
              <option value="Họp hội đồng trường">Họp hội đồng trường</option>
              <option value="Họp chuyên môn">Họp chuyên môn</option>
              <option value="Họp tổ chuyên môn">Họp tổ chuyên môn</option>
              <option value="Họp đột xuất">Họp đột xuất</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Trạng thái:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-amber-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ongoing">Đang diễn ra</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Người chủ trì */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Người chủ trì:
            </label>
            <select
              value={hostFilter}
              onChange={(e) => setHostFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-amber-500"
            >
              <option value="all">Tất cả cán bộ chủ trì</option>
              {distinctHosts.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredMeetings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-amber-200">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-base font-bold text-slate-800">
            Không tìm thấy cuộc họp nào phù hợp
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Vui lòng thử bỏ lọc hoặc tìm kiếm với từ khóa khác.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredMeetings.map((m) => {
            const att = getMeetingAttendance(m.id);
            const present = att.filter((a) => a.status === 'present').length;
            const total = att.length;

            const mMinutes = getMeetingMinutes(m.id);
            const hasDriveMinutes = mMinutes.some(
              (min) => (min.files && min.files.length > 0) || min.notes?.includes('Google Drive')
            );

            return (
              <div
                key={m.id}
                className="bg-white rounded-3xl border border-amber-100 hover:border-amber-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 sm:p-6">
                  {/* Top Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                        {m.type}
                      </span>
                      {m.targetGroup && m.targetGroup !== 'Toàn trường' && m.targetGroup !== 'all' ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>👥</span>
                          <span>{m.targetGroup}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>🏫</span>
                          <span>Toàn trường</span>
                        </span>
                      )}
                      {hasDriveMinutes && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs" title="Đã có tệp biên bản lưu trên Google Drive">
                          <span>☁️</span>
                          <span>Biên bản Drive</span>
                        </span>
                      )}
                    </div>
                    {getStatusBadge(getMeetingEffectiveStatus(m))}
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => selectMeeting(m.id)}
                    className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug cursor-pointer line-clamp-2"
                  >
                    {m.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {m.description || 'Chưa có thông tin mô tả chi tiết.'}
                  </p>

                  {/* Details grid */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Ngày: <strong>{m.date}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{m.startTime} - {m.endTime}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{m.location}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{m.host}</span>
                    </div>
                  </div>

                  {/* Attendance snippet */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Điểm danh:
                    </span>
                    <span className="font-bold text-slate-800">
                      {present}/{total} thành viên có mặt
                    </span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 pt-3 border-t border-amber-100 bg-amber-50/20 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {canManageMeeting(currentUser, m) && (
                      <button
                        onClick={() => setUploadMinuteMeeting(m)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                        title="Đẩy biên bản cuộc họp lên Google Drive & Sổ tay"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-700" />
                        <span>Đẩy biên bản</span>
                      </button>
                    )}
                    {canManageMeeting(currentUser, m) && (
                      <button
                        onClick={() => onOpenEditMeeting(m)}
                        className="p-2 rounded-xl text-slate-600 hover:text-amber-700 hover:bg-amber-100/60 transition-colors cursor-pointer"
                        title="Chỉnh sửa cuộc họp"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDeleteMeeting(currentUser, m) && (
                      <button
                        onClick={() => setDeleteMeetingId(m.id)}
                        className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa cuộc họp"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {(hasDriveMinutes || mMinutes.length > 0) && (
                      <button
                        type="button"
                        onClick={() => selectMeeting(m.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        title="Mở xem trực tiếp biên bản cuộc họp"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-700" />
                        <span>Xem biên bản</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => selectMeeting(m.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <span>Chi tiết</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Minute Modal */}
      {uploadMinuteMeeting && (
        <UploadMinuteModal
          isOpen={true}
          meeting={uploadMinuteMeeting}
          onClose={() => setUploadMinuteMeeting(null)}
        />
      )}

      {/* Delete Meeting Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteMeetingId !== null}
        title="Xác nhận xóa cuộc họp?"
        message="Hành động này sẽ xóa hoàn toàn cuộc họp và toàn bộ dữ liệu điểm danh, biên bản liên quan."
        onConfirm={() => {
          if (deleteMeetingId) {
            deleteMeeting(deleteMeetingId);
            setDeleteMeetingId(null);
          }
        }}
        onCancel={() => setDeleteMeetingId(null)}
      />
    </div>
  );
};

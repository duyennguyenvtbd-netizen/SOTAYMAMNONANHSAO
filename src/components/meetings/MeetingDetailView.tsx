import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AttendanceStatus,
  FeedbackStatus,
  MeetingMinute,
  MeetingFeedback,
  MinuteFileAttachment,
} from '../../types';
import { MinuteEditorModal } from '../minutes/MinuteEditorModal';
import { UploadMinuteModal } from './UploadMinuteModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { DocumentDirectViewer } from './DocumentDirectViewer';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Copy,
  Send,
  Search,
  Check,
  Share2,
  ShieldAlert,
  CornerDownRight,
  ListFilter,
  CheckCheck,
  Upload,
  Download,
  FileSpreadsheet,
  FileImage,
  FileCode,
  Paperclip,
  Sparkles,
  Eye,
  HardDrive,
  ExternalLink,
  Cloud,
  Maximize2,
} from 'lucide-react';
import {
  canManageMeeting,
  canDeleteMeeting,
  canUserAccessMeeting,
  getUserMeetingRoleBadge,
} from '../../utils/permissionUtils';

interface MeetingDetailViewProps {
  onBack: () => void;
  onEditMeeting: () => void;
}

export const MeetingDetailView: React.FC<MeetingDetailViewProps> = ({
  onBack,
  onEditMeeting,
}) => {
  const {
    meetings,
    selectedMeetingId,
    currentUser,
    users,
    getMeetingAttendance,
    updateAttendance,
    selfCheckIn,
    getMeetingMinutes,
    deleteMinute,
    deleteMinuteFile,
    addMinuteFile,
    getMeetingFeedbacks,
    addFeedback,
    updateFeedbackStatus,
    deleteFeedback,
    addToast,
    deleteMeeting,
    isDriveConnected,
    connectDrive,
    uploadFeedbackSummaryDirectToDrive,
  } = useApp();

  const meeting = meetings.find((m) => m.id === selectedMeetingId);
  const isAdmin = currentUser?.role === 'admin';
  const canManage = meeting ? canManageMeeting(currentUser, meeting) : isAdmin;
  const canDelete = meeting ? canDeleteMeeting(currentUser, meeting) : isAdmin;
  const roleBadge = getUserMeetingRoleBadge(currentUser);

  // Active Tab within Meeting Detail
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'minutes' | 'feedback'>(
    'info'
  );

  // Minute editor modal state
  const [isMinuteModalOpen, setIsMinuteModalOpen] = useState(false);
  const [isUploadMinuteModalOpen, setIsUploadMinuteModalOpen] = useState(false);
  const [editingMinute, setEditingMinute] = useState<MeetingMinute | null>(null);
  const [deleteMinuteId, setDeleteMinuteId] = useState<string | null>(null);
  const [selectedMinuteForView, setSelectedMinuteForView] = useState<MeetingMinute | null>(
    null
  );

  // Feedback form
  const [newFeedbackContent, setNewFeedbackContent] = useState('');
  const [deleteFeedbackId, setDeleteFeedbackId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<{ [key: string]: string }>({});

  // Attendance search & filter
  const [attSearch, setAttSearch] = useState('');
  const [attFilter, setAttFilter] = useState<'all' | AttendanceStatus>('all');

  // Delete Meeting confirmation modal
  const [isDeleteMeetingModalOpen, setIsDeleteMeetingModalOpen] = useState(false);

  // File Attachment Preview modal (Google Drive / Word / PDF / Images)
  const [viewingAttachment, setViewingAttachment] = useState<MinuteFileAttachment | null>(null);
  // Inline direct viewer for PDF & Images right inside the meeting details
  const [selectedInlineFile, setSelectedInlineFile] = useState<MinuteFileAttachment | null>(null);
  const [isDirectViewerExpanded, setIsDirectViewerExpanded] = useState<boolean>(true);

  const getFileBadge = (ext: string) => {
    const lower = ext.toLowerCase();
    if (lower.includes('doc')) {
      return { icon: <FileText className="w-5 h-5 text-blue-600" />, label: 'Word (.doc/.docx)', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (lower.includes('pdf')) {
      return { icon: <FileText className="w-5 h-5 text-rose-600" />, label: 'PDF (.pdf)', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (['jpg', 'jpeg', 'png', 'webp'].some((img) => lower.includes(img))) {
      return { icon: <FileImage className="w-5 h-5 text-purple-600" />, label: 'Hình ảnh scan/chụp', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (lower.includes('xls')) {
      return { icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />, label: 'Bảng tính Excel', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return { icon: <FileText className="w-5 h-5 text-amber-600" />, label: 'Tệp văn bản', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  };

  if (!meeting) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-bold text-slate-800">Không tìm thấy cuộc họp</h3>
        <p className="text-xs text-slate-500 mt-1">Cuộc họp có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </button>
      </div>
    );
  }

  const access = canUserAccessMeeting(currentUser, meeting);
  if (!access.allowed) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-rose-200 shadow-sm max-w-2xl mx-auto space-y-4 my-8">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-700 mx-auto flex items-center justify-center text-3xl shadow-inner">
          🔒
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            Không Có Quyền Tham Gia Cuộc Họp Này
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            {access.reason}
          </p>
        </div>
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 text-left space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-amber-950">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Quy định phân quyền cuộc họp nhà trường:</span>
          </div>
          <p>• <strong>Giáo viên:</strong> Chỉ tham gia cuộc họp hội đồng trường, cuộc họp chuyên môn trường và cuộc họp chuyên môn tổ của <strong>tổ mình ({currentUser?.group || 'tổ hiện tại'})</strong>.</p>
          <p>• <strong>Giáo viên tổ khác:</strong> Không thể tham gia hoặc xem nội dung cuộc họp chuyên môn của các tổ khác.</p>
          <p>• <strong>Ban Giám Hiệu:</strong> Có toàn quyền tham gia tất cả các cuộc họp trong trường.</p>
        </div>
        <div className="pt-2">
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách cuộc họp</span>
          </button>
        </div>
      </div>
    );
  }

  const attendanceList = getMeetingAttendance(meeting.id);
  const meetingMinutes = getMeetingMinutes(meeting.id);
  const meetingFeedbacks = getMeetingFeedbacks(meeting.id);
  const allMinuteFiles: MinuteFileAttachment[] = meetingMinutes.flatMap((min) => min.files || []);

  // Determine active file for direct inline viewing (prefer PDF or Image)
  const activeInlineFile: MinuteFileAttachment | null =
    selectedInlineFile && allMinuteFiles.some((f) => f.id === selectedInlineFile.id)
      ? selectedInlineFile
      : allMinuteFiles.length > 0
      ? allMinuteFiles.find((f) => {
          const l = ((f.name || '') + (f.type || '')).toLowerCase();
          return (
            l.includes('pdf') ||
            ['jpg', 'jpeg', 'png', 'webp'].some((ext) => l.includes(ext))
          );
        }) || allMinuteFiles[0]
      : null;

  // Attendance metrics
  const totalAttendees = attendanceList.length;
  const presentCount = attendanceList.filter((a) => a.status === 'present').length;
  const excusedCount = attendanceList.filter((a) => a.status === 'excused').length;
  const unexcusedCount = attendanceList.filter((a) => a.status === 'unexcused').length;
  const presenceRate =
    totalAttendees > 0 ? Math.round((presentCount / totalAttendees) * 100) : 0;

  // Filtered attendance records
  const filteredAttendance = attendanceList.filter((record) => {
    const matchesFilter = attFilter === 'all' || record.status === attFilter;
    const matchesSearch =
      record.userName.toLowerCase().includes(attSearch.toLowerCase()) ||
      record.userTitle.toLowerCase().includes(attSearch.toLowerCase()) ||
      record.userGroup.toLowerCase().includes(attSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Current user's attendance record
  const myAttendance = currentUser
    ? attendanceList.find((a) => a.userId === currentUser.id)
    : null;

  const handleSelfCheckIn = () => {
    selfCheckIn(meeting.id);
  };

  const handlePrintMinutes = (min: MeetingMinute) => {
    setSelectedMinuteForView(min);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleCopyMinutesSummary = (min: MeetingMinute) => {
    const text = `SỔ TAY TRƯỜNG MẦM NON ÁNH SAO PHƯỜNG RẠCH DỪA - BIÊN BẢN CUỘC HỌP
Tiêu đề: ${min.title}
Cuộc họp: ${meeting.title}
Thời gian: ${meeting.startTime} - ${meeting.endTime}, Ngày ${meeting.date}
Địa điểm: ${meeting.location}
Chủ trì: ${meeting.host} | Thư ký: ${meeting.secretary}

1. NỘI DUNG CUỘC HỌP:
${min.meetingContent}

2. CÁC NỘI DUNG ĐÃ TRIỂN KHAI:
${min.deployedContent}

3. Ý KIẾN ĐÓNG GÓP:
${min.contributions}

4. KẾT LUẬN CỦA BAN GIÁM HIỆU:
${min.conclusions}

5. PHÂN CÔNG NHIỆM VỤ:
${min.tasks.map((t, i) => `${i + 1}. ${t.task} - Phụ trách: ${t.assignee} (Hạn: ${t.deadline})`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    addToast('Đã sao chép nội dung biên bản vào bộ nhớ tạm!', 'success');
  };

  const handleDownloadFile = (fileName: string, dataUrl?: string) => {
    if (!dataUrl) {
      addToast('Không tìm thấy nội dung tệp tin để tải về', 'warning');
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast(`Đang tải tệp "${fileName}"...`, 'success');
  };

  const handleCopyFeedbacksSummary = () => {
    const topic = `Ý kiến đóng góp trong cuộc họp: ${meeting.title}`;
    const header = `SỔ TAY TRƯỜNG MẦM NON ÁNH SAO PHƯỜNG RẠCH DỪA
TIÊU MỤC: ${topic.toUpperCase()}
Cuộc họp: ${meeting.title}
Thời gian: ${meeting.startTime} - ${meeting.endTime}, Ngày ${meeting.date}
Chủ trì: ${meeting.host} | Địa điểm: ${meeting.location}
Tổng số ý kiến đã đóng góp: ${meetingFeedbacks.length}

---------------------------------------------------------
DANH SÁCH Ý KIẾN ĐÓNG GÓP CHI TIẾT:
`;
    const body =
      meetingFeedbacks.length === 0
        ? 'Chưa có ý kiến nào được ghi nhận.'
        : meetingFeedbacks
            .map(
              (fb, idx) =>
                `${idx + 1}. [${fb.authorName} - ${fb.authorTitle} (${fb.authorGroup})]
Thời gian: ${new Date(fb.createdAt).toLocaleTimeString('vi-VN')} ngày ${new Date(fb.createdAt).toLocaleDateString('vi-VN')}
Tiêu mục: ${fb.topicTitle || topic}
Trạng thái: ${fb.status === 'resolved' ? 'Đã xử lý' : fb.status === 'acknowledged' ? 'Đã tiếp thu' : 'Chờ tiếp thu'}
Nội dung ý kiến:
${fb.content}
${fb.adminReply ? `\nPhản hồi của Chủ trì / BGH:\n${fb.adminReply}` : ''}`
            )
            .join('\n\n---------------------------------------------------------\n\n');

    navigator.clipboard.writeText(header + body);
    addToast(
      `Đã sao chép toàn bộ ý kiến đóng góp cho cuộc họp "${meeting.title}"!`,
      'success',
      'Sao chép thành công'
    );
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackContent.trim() || !meeting) return;
    const topicTitle = `Ý kiến đóng góp trong cuộc họp - ${meeting.title}`;
    addFeedback(meeting.id, newFeedbackContent.trim(), topicTitle);

    // Nếu Google Drive đã kết nối, tự động lưu trữ tài liệu ý kiến đóng góp lên Drive
    if (isDriveConnected) {
      try {
        const currentList = [
          ...meetingFeedbacks,
          {
            id: 'temp-' + Date.now(),
            meetingId: meeting.id,
            authorId: currentUser?.id || 'unknown',
            authorName: currentUser?.name || 'Thành viên',
            authorTitle: currentUser?.title || 'Giáo viên',
            authorGroup: currentUser?.group || 'Tổ chuyên môn',
            content: newFeedbackContent.trim(),
            topicTitle,
            status: 'pending' as FeedbackStatus,
            createdAt: new Date().toISOString(),
          },
        ];
        uploadFeedbackSummaryDirectToDrive(meeting, currentList).catch((err) =>
          console.warn('Auto drive feedback save notice:', err)
        );
      } catch (err) {
        console.warn('Lỗi tự động lưu ý kiến Drive:', err);
      }
    }

    setNewFeedbackContent('');
  };

  const handleArchiveFeedbackToDrive = async () => {
    if (!meeting) return;
    if (!isDriveConnected) {
      addToast('Đang kết nối tài khoản Google Drive...', 'info');
      try {
        await connectDrive();
      } catch {
        return;
      }
    }

    try {
      await uploadFeedbackSummaryDirectToDrive(meeting, meetingFeedbacks);
    } catch (err: any) {
      console.warn('Lỗi lưu trữ ý kiến vào Drive:', err);
    }
  };

  const handleAdminReplySubmit = (feedbackId: string) => {
    const reply = adminReplyText[feedbackId];
    if (!reply || !reply.trim()) return;
    updateFeedbackStatus(feedbackId, 'resolved', reply.trim());
    setAdminReplyText((prev) => ({ ...prev, [feedbackId]: '' }));
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border-2 border-emerald-300 shadow-xs animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            Đang diễn ra cuộc họp
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Sắp diễn ra
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            Cuộc họp đã kết thúc
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Đã hủy
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-amber-700 px-3 py-1.5 rounded-xl hover:bg-amber-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách cuộc họp</span>
          </button>

          <div className="flex items-center gap-2">
            {getStatusLabel(meeting.status)}
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              {meeting.type}
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              {canManage && (
                <button
                  onClick={() => setIsUploadMinuteModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Người chủ trì đẩy biên bản cuộc họp lên"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Đẩy biên bản lên</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('feedback')}
                className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Đóng góp ý kiến cho cuộc họp"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Góp ý</span>
              </button>
              {canManage && (
                <button
                  onClick={onEditMeeting}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Chỉnh sửa cuộc họp"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sửa</span>
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setIsDeleteMeetingModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Xóa cuộc họp"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Meeting Title & Meta */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
            {meeting.title}
          </h1>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-600 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Ngày:</strong> {meeting.date}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Giờ:</strong> {meeting.startTime} - {meeting.endTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">
                <strong>Địa điểm:</strong> {meeting.location}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">
                <strong>Chủ trì:</strong> {meeting.host}
              </span>
            </div>
          </div>
        </div>

        {/* Self Check-in Banner for Members */}
        {currentUser && (
          <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
                {currentUser.avatar || '👩‍🏫'}
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950">
                  {currentUser.name} ({currentUser.title})
                </div>
                <div className="text-[11px] text-slate-600">
                  {myAttendance?.status === 'present' ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-600" />
                      Đã điểm danh: {myAttendance.checkInTime || 'Hợp lệ'}
                    </span>
                  ) : myAttendance?.status === 'excused' ? (
                    <span className="text-amber-700 font-bold">
                      Trạng thái: Vắng có phép ({myAttendance.note || 'Đã xin phép'})
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Chưa điểm danh cuộc họp này. Vui lòng bấm xác nhận bên cạnh.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {myAttendance?.status !== 'present' ? (
                <button
                  type="button"
                  onClick={handleSelfCheckIn}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Tôi xác nhận có mặt</span>
                </button>
              ) : (
                <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-700" />
                  Đã ghi nhận có mặt
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-6 flex items-center gap-2 border-b border-slate-200 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'info'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Thông tin cuộc họp</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'attendance'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Điểm danh thành viên</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              {presentCount}/{totalAttendees}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('minutes')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'minutes'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Biên bản cuộc họp</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              {meetingMinutes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'feedback'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ý kiến đóng góp</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              {meetingFeedbacks.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: THÔNG TIN CUỘC HỌP */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Người chủ trì: Đẩy biên bản cuộc họp lên banner */}
            {canManage && (
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl p-5 sm:p-6 text-white shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shrink-0">
                    📤
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
                      Mục Biên Bản Cuộc Họp · Người chủ trì: {meeting.host}
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold">
                      Đẩy Biên Bản Cuộc Họp Lên
                    </h3>
                    <p className="text-xs text-amber-100 mt-0.5 max-w-lg leading-relaxed">
                      Người chủ trì có thể tải tệp biên bản (Word, PDF, ảnh scan) hoặc soạn thảo biên bản. Biên bản sẽ được <strong>tự động lưu trữ với tên là "Biên bản cuộc họp"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadMinuteModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-amber-800 font-extrabold text-xs sm:text-sm shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-amber-600" />
                    <span>Đẩy biên bản lên</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMinute(null);
                      setIsMinuteModalOpen(true);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-800/60 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Soạn chi tiết</span>
                  </button>
                </div>
              </div>
            )}

            {/* THẺ BIÊN BẢN CUỘC HỌP CHO TOÀN TRƯỜNG THAM GIA XEM (KẾT NỐI GOOGLE DRIVE) */}
            {allMinuteFiles.length > 0 && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-200/90 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                      📄
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                        Toàn Trường Tham Gia · Tài Liệu Biên Bản Cuộc Họp
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                        Biên Bản Cuộc Họp Đã Được Đẩy Lên (Lưu Trữ Google Drive)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Người chủ trì đã tải tệp biên bản lên và kết nối với Google Drive của trường. Toàn thể cán bộ, giáo viên có thể bấm vào xem nội dung biên bản ngay bên dưới.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('minutes')}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Xem sổ biên bản ({meetingMinutes.length})</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {allMinuteFiles.map((file) => {
                    const badge = getFileBadge(file.type);
                    return (
                      <div
                        key={file.id}
                        className="p-3.5 rounded-2xl border border-amber-100 hover:border-amber-300 bg-amber-50/20 hover:bg-amber-50/50 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0">
                            {badge.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4
                              onClick={() => setViewingAttachment(file)}
                              className="font-bold text-slate-900 text-xs sm:text-sm hover:text-amber-700 cursor-pointer line-clamp-1"
                              title={file.name}
                            >
                              {file.name}
                            </h4>
                            <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
                                {badge.label}
                              </span>
                              <span>{file.size}</span>
                              <span>·</span>
                              <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                                ☁️ Google Drive
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Đăng bởi: {file.uploadedBy} · {new Date(file.uploadedAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-amber-100/60 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInlineFile(file);
                              setViewingAttachment(file);
                            }}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem nội dung biên bản</span>
                          </button>

                          {file.driveWebViewLink && (
                            <a
                              href={file.driveWebViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-white text-slate-700 hover:text-amber-800 text-xs font-bold transition-colors inline-flex items-center gap-1"
                              title="Mở tài liệu trên Google Drive"
                            >
                              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">Drive</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDownloadFile(file.name, file.dataUrl || file.driveDownloadLink || file.driveWebViewLink)}
                            className="p-2 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-white text-slate-700 hover:text-amber-800 transition-colors cursor-pointer"
                            title="Tải tệp xuống máy"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {file.driveWebViewLink && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(file.driveWebViewLink!);
                                addToast('Đã sao chép liên kết Google Drive của biên bản!', 'success');
                              }}
                              className="p-2 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-white text-slate-700 hover:text-amber-800 transition-colors cursor-pointer"
                              title="Sao chép liên kết Google Drive"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* TRÌNH XEM TRỰC TIẾP BIÊN BẢN (PDF & HÌNH ẢNH SCAN) - TOÀN TRƯỜNG MỞ RA LÀ XEM ĐƯỢC NGAY */}
                {activeInlineFile && (
                  <div className="pt-3 border-t border-amber-100/90 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-1.5">
                          <span>👁️</span>
                          <span>Trực Tiếp Xem Nội Dung Biên Bản: {activeInlineFile.name}</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Xem ngay không cần tải tệp
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingAttachment(activeInlineFile)}
                          className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Mở toàn màn hình</span>
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setIsDirectViewerExpanded(!isDirectViewerExpanded)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          {isDirectViewerExpanded ? 'Thu gọn khung' : 'Mở rộng khung'}
                        </button>
                      </div>
                    </div>

                    {isDirectViewerExpanded && (
                      <DocumentDirectViewer
                        file={activeInlineFile}
                        allFiles={allMinuteFiles}
                        onSelectFile={(f) => setSelectedInlineFile(f)}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Nội dung / Mục đích */}
            <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Nội dung & Mục đích cuộc họp
              </h3>
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-amber-50/30 p-4 rounded-2xl border border-amber-100/60 font-medium">
                {meeting.description || 'Chưa cập nhật nội dung chi tiết.'}
              </p>

              {/* Thành phần tham dự */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Thành phần tham dự:
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  {meeting.attendeesText || 'Toàn thể giáo viên và cán bộ quản lý'}
                </div>
              </div>

              {/* Ghi chú */}
              {meeting.notes && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Ghi chú của người chủ trì:
                  </h4>
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 font-medium">
                    📌 {meeting.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Tóm tắt nhanh điểm danh & biên bản */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setActiveTab('attendance')}
                className="bg-white rounded-2xl p-5 border border-amber-100 hover:border-amber-300 shadow-xs cursor-pointer transition-all hover:bg-amber-50/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Điểm danh</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {presenceRate}% có mặt
                  </span>
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {presentCount} / {totalAttendees} thành viên
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Vắng có phép: {excusedCount} · Chưa điểm danh: {unexcusedCount}
                </div>
              </div>

              <div
                onClick={() => setActiveTab('minutes')}
                className="bg-white rounded-2xl p-5 border border-amber-100 hover:border-amber-300 shadow-xs cursor-pointer transition-all hover:bg-amber-50/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Biên bản họp</span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    {meetingMinutes.length} bản lưu
                  </span>
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {meetingMinutes.length > 0 ? 'Đã lưu biên bản' : 'Chưa có biên bản'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Bấm để xem chi tiết, tải tệp hoặc đẩy biên bản mới lên.
                </div>
              </div>
            </div>

            {/* Ô ĐÓNG GÓP Ý KIẾN TRONG CUỘC HỌP */}
            <div className="bg-white rounded-3xl p-6 border-2 border-amber-200/80 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base shrink-0">
                    💬
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                      Ý Kiến Đóng Góp Trong Cuộc Họp: {meeting.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Người tham dự đóng góp ý kiến trong quá trình diễn ra cuộc họp. Mọi ý kiến sẽ tự động được lưu trữ vào hệ thống với tiêu mục: <strong>Ý kiến đóng góp trong cuộc họp - {meeting.title}</strong>.
                    </p>
                  </div>
                </div>

                {meetingFeedbacks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('feedback')}
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                  >
                    <span>Xem diễn đàn ({meetingFeedbacks.length})</span>
                    <span>→</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSendFeedback} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={newFeedbackContent}
                  onChange={(e) => setNewFeedbackContent(e.target.value)}
                  placeholder={
                    currentUser
                      ? `Chào cô ${currentUser.name}, xin mời cô nhập ý kiến, đề xuất hoặc phản hồi cho cuộc họp...`
                      : 'Vui lòng đăng nhập tài khoản cá nhân để gửi ý kiến đóng góp cho cuộc họp...'
                  }
                  disabled={!currentUser}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm bg-amber-50/20"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    {currentUser ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>
                          Gửi với tư cách: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.title} - {currentUser.group})
                        </span>
                      </>
                    ) : (
                      <span className="text-rose-500 font-medium">
                        * Bạn cần đăng nhập tài khoản cá nhân để gửi ý kiến.
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!currentUser || !newFeedbackContent.trim()}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi ý kiến đóng góp</span>
                  </button>
                </div>
              </form>

              {/* Danh sách ý kiến gần đây của cuộc họp */}
              {meetingFeedbacks.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Ý kiến đã đóng góp gần đây ({meetingFeedbacks.length}):</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {meetingFeedbacks.slice(0, 3).map((fb) => (
                      <div
                        key={fb.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {fb.authorName} <span className="text-slate-400 font-normal">({fb.authorTitle})</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(fb.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 line-clamp-2">{fb.content}</p>
                        {fb.adminReply && (
                          <div className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded-lg border border-amber-200/60 font-medium flex items-center gap-1">
                            <CornerDownRight className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>BGH: {fb.adminReply}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar info */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Cán bộ phụ trách
              </h3>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-lg shrink-0">
                  👑
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{meeting.host}</div>
                  <div className="text-[11px] text-slate-500">Người chủ trì cuộc họp</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-900 flex items-center justify-center font-bold text-lg shrink-0">
                  📝
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{meeting.secretary}</div>
                  <div className="text-[11px] text-slate-500">Thư ký ghi biên bản</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-2">
                <div>
                  <strong className="text-slate-700">Ngày tạo:</strong>{' '}
                  {new Date(meeting.createdAt).toLocaleDateString('vi-VN')}
                </div>
                <div>
                  <strong className="text-slate-700">Cập nhật:</strong>{' '}
                  {new Date(meeting.updatedAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ĐIỂM DANH */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Tổng danh sách</div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {totalAttendees}
              </div>
              <div className="text-[11px] text-slate-500">Cán bộ / Giáo viên</div>
            </div>

            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 shadow-xs">
              <div className="text-[11px] font-bold text-emerald-800 uppercase">Có mặt</div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1">
                {presentCount}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold">
                Tỷ lệ: {presenceRate}%
              </div>
            </div>

            <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 shadow-xs">
              <div className="text-[11px] font-bold text-amber-800 uppercase">Vắng có phép</div>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-1">
                {excusedCount}
              </div>
              <div className="text-[11px] text-amber-700">Đã gửi đơn/báo BGH</div>
            </div>

            <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-200 shadow-xs">
              <div className="text-[11px] font-bold text-rose-800 uppercase">Vắng không phép</div>
              <div className="text-xl sm:text-2xl font-extrabold text-rose-700 mt-1">
                {unexcusedCount}
              </div>
              <div className="text-[11px] text-rose-700">Chưa xác nhận</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={attSearch}
                onChange={(e) => setAttSearch(e.target.value)}
                placeholder="Tìm tên giáo viên, chức vụ, khối/tổ..."
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setAttFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  attFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({totalAttendees})
              </button>
              <button
                onClick={() => setAttFilter('present')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  attFilter === 'present'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Có mặt ({presentCount})
              </button>
              <button
                onClick={() => setAttFilter('excused')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  attFilter === 'excused'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Vắng có phép ({excusedCount})
              </button>
              <button
                onClick={() => setAttFilter('unexcused')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  attFilter === 'unexcused'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Chưa có mặt ({unexcusedCount})
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-3xl border border-amber-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-amber-50/70 border-b border-amber-200/60 text-slate-700 font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-4">Chức vụ / Khối</th>
                    <th className="py-3 px-4 text-center">Trạng thái tham dự</th>
                    <th className="py-3 px-4">Thời gian / Người xác nhận</th>
                    {canManage && <th className="py-3 px-4 text-right">Quản trị thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.map((rec, index) => {
                    const isPresent = rec.status === 'present';
                    const isExcused = rec.status === 'excused';
                    const isUnexcused = rec.status === 'unexcused';

                    return (
                      <tr key={rec.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-4 text-center font-medium text-slate-500">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{rec.userName}</div>
                          {rec.note && (
                            <div className="text-[11px] text-amber-700 mt-0.5">
                              Lý do: {rec.note}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{rec.userTitle}</div>
                          <div className="text-[11px] text-slate-500">{rec.userGroup}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPresent && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Có mặt
                            </span>
                          )}
                          {isExcused && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              Vắng có phép
                            </span>
                          )}
                          {isUnexcused && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Vắng không phép
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {rec.checkInTime ? (
                            <div>
                              <div className="font-semibold text-slate-800">
                                {rec.checkInTime}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Bởi: {rec.checkedBy || 'Tự điểm danh'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Chưa xác nhận</span>
                          )}
                        </td>

                        {/* Quick toggle buttons for Manager / Admin */}
                        {canManage && (
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() =>
                                  updateAttendance(
                                    meeting.id,
                                    rec.userId,
                                    'present',
                                    undefined,
                                    currentUser?.name
                                  )
                                }
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                                title="Đánh dấu Có mặt"
                              >
                                Có mặt
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Nhập lý do xin vắng có phép:');
                                  if (reason !== null) {
                                    updateAttendance(
                                      meeting.id,
                                      rec.userId,
                                      'excused',
                                      reason || 'Có đơn xin phép',
                                      currentUser?.name
                                    );
                                  }
                                }}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                  isExcused
                                    ? 'bg-amber-600 text-white'
                                    : 'border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                                }`}
                                title="Đánh dấu Vắng có phép"
                              >
                                Có phép
                              </button>
                              <button
                                onClick={() =>
                                  updateAttendance(
                                    meeting.id,
                                    rec.userId,
                                    'unexcused',
                                    'Vắng không lý do',
                                    currentUser?.name
                                  )
                                }
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                  isUnexcused
                                    ? 'bg-rose-600 text-white'
                                    : 'border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                                }`}
                                title="Đánh dấu Vắng không phép"
                              >
                                Vắng KP
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BIÊN BẢN CUỘC HỌP */}
      {activeTab === 'minutes' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Sổ Biên Bản Lưu Trữ Cho Cuộc Họp Này
              </h3>
              <p className="text-xs text-slate-500">
                Lưu trữ đầy đủ các nội dung thảo luận, chỉ đạo và phân công nhiệm vụ cụ thể.
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => {
                  setEditingMinute(null);
                  setIsMinuteModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Lập biên bản cuộc họp</span>
              </button>
            )}
          </div>

          {meetingMinutes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-amber-200">
              <div className="text-4xl mb-3">📝</div>
              <h4 className="text-base font-bold text-slate-800">
                Chưa có biên bản nào được lập cho cuộc họp này
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Quản trị viên, phó hiệu trưởng hoặc tổ trưởng/thư ký có thể lập biên bản ghi lại tiến trình và các nhiệm vụ phân công.
              </p>
              {canManage && (
                <button
                  onClick={() => {
                    setEditingMinute(null);
                    setIsMinuteModalOpen(true);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lập biên bản ngay</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {meetingMinutes.map((minute) => (
                <div
                  key={minute.id}
                  className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden"
                >
                  {/* Minute Card Header */}
                  <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                        Biên bản chính thức · MN Ánh Sao Phường Rạch Dừa
                      </div>
                      <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">
                        {minute.title}
                      </h4>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>Lập bởi: {minute.createdBy}</span>
                        <span>·</span>
                        <span>
                          Ngày lập: {new Date(minute.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyMinutesSummary(minute)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-300 bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                        title="Sao chép toàn bộ biên bản"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sao chép</span>
                      </button>

                      <button
                        onClick={() => handlePrintMinutes(minute)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-300 bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                        title="In hoặc xuất PDF biên bản"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>In / Xuất PDF</span>
                      </button>

                      {canManage && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMinute(minute);
                              setIsMinuteModalOpen(true);
                            }}
                            className="p-2 rounded-xl text-slate-600 hover:text-amber-700 hover:bg-amber-100/60 transition-colors cursor-pointer"
                            title="Sửa biên bản"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteMinuteId(minute.id)}
                            className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Xóa biên bản"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Minute Card Content */}
                  <div className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
                    {/* Diễn biến cuộc họp */}
                    <div>
                      <h5 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5 text-amber-800">
                        <span>1.</span> Diễn biến cuộc họp
                      </h5>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        {minute.meetingContent}
                      </p>
                    </div>

                    {/* Nội dung đã triển khai */}
                    <div>
                      <h5 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5 text-amber-800">
                        <span>2.</span> Các nội dung đã triển khai & thống nhất
                      </h5>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        {minute.deployedContent}
                      </p>
                    </div>

                    {/* Ý kiến đóng góp */}
                    {minute.contributions && (
                      <div>
                        <h5 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5 text-amber-800">
                          <span>3.</span> Ý kiến thảo luận và đóng góp
                        </h5>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                          {minute.contributions}
                        </p>
                      </div>
                    )}

                    {/* Kết luận */}
                    <div>
                      <h5 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-1.5 flex items-center gap-1.5 text-amber-800">
                        <span>4.</span> Kết luận của Ban Giám hiệu / Chủ tọa
                      </h5>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 font-medium text-amber-950">
                        {minute.conclusions}
                      </p>
                    </div>

                    {/* Nhiệm vụ được giao (Action Items) */}
                    {minute.tasks && minute.tasks.length > 0 && (
                      <div>
                        <h5 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-2 flex items-center gap-1.5 text-amber-800">
                          <span>5.</span> Phân công nhiệm vụ thực hiện ({minute.tasks.length})
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {minute.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="p-3 rounded-2xl border border-slate-200 bg-white flex items-start gap-2.5 shadow-2xs"
                            >
                              <div
                                className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                                  task.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : task.status === 'in_progress'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-900 text-xs leading-snug">
                                  {task.task}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                                  <span>👤 {task.assignee}</span>
                                  <span>·</span>
                                  <span>⏰ Hạn: {task.deadline}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Danh sách tệp đính kèm của biên bản (Kết nối Google Drive) */}
                    {minute.files && minute.files.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5 text-amber-800">
                            <span>📎</span> Tệp tài liệu biên bản đính kèm ({minute.files.length})
                          </h5>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            ☁️ Đã lưu trữ Google Drive
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {minute.files.map((file) => {
                            const badge = getFileBadge(file.type);
                            return (
                              <div
                                key={file.id}
                                className="p-3 rounded-2xl border border-slate-200 hover:border-amber-300 bg-slate-50/70 hover:bg-white transition-all flex flex-col justify-between gap-2.5 shadow-2xs"
                              >
                                <div className="flex items-start gap-2.5">
                                  <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0">
                                    {badge.icon}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div
                                      onClick={() => setViewingAttachment(file)}
                                      className="font-bold text-slate-900 text-xs truncate hover:text-amber-700 cursor-pointer"
                                      title={file.name}
                                    >
                                      {file.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${badge.color}`}>
                                        {badge.label}
                                      </span>
                                      <span>{file.size}</span>
                                      <span>·</span>
                                      <span>{file.uploadedBy}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => setViewingAttachment(file)}
                                    className="flex-1 py-1 px-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Xem nội dung</span>
                                  </button>

                                  {file.driveWebViewLink && (
                                    <a
                                      href={file.driveWebViewLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors"
                                      title="Mở trên Google Drive"
                                    >
                                      <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(file.name, file.dataUrl || file.driveDownloadLink || file.driveWebViewLink)}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors cursor-pointer"
                                    title="Tải tệp xuống"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>

                                  {file.driveWebViewLink && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(file.driveWebViewLink!);
                                        addToast('Đã sao chép liên kết Google Drive của biên bản!', 'success');
                                      }}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-800 transition-colors cursor-pointer"
                                      title="Sao chép liên kết Google Drive"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Ghi chú */}
                    {minute.notes && (
                      <div className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-100">
                        Ghi chú: {minute.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Ý KIẾN ĐÓNG GÓP */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Diễn Đàn Thảo Luận & Ý Kiến Đóng Góp Cuộc Họp
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ý kiến được lưu trữ với tiêu mục: <strong>Ý kiến đóng góp trong cuộc họp - {meeting.title}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleArchiveFeedbackToDrive}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
                title="Xuất và lưu trữ toàn bộ ý kiến đóng góp lên Google Drive"
              >
                <span>☁️ Lưu trữ ý kiến vào Google Drive</span>
              </button>
            </div>

            {/* Input Box for Feedback */}
            <form onSubmit={handleSendFeedback} className="mt-4 space-y-3">
              <textarea
                rows={3}
                required
                value={newFeedbackContent}
                onChange={(e) => setNewFeedbackContent(e.target.value)}
                placeholder={
                  currentUser
                    ? `Chào ${currentUser.name}, hãy nhập ý kiến hoặc đề xuất của bạn về cuộc họp này...`
                    : 'Đăng nhập để gửi ý kiến đóng góp...'
                }
                disabled={!currentUser}
                className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm bg-white"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {currentUser ? `Đang gửi với tư cách: ${currentUser.name} (${currentUser.title})` : 'Vui lòng đăng nhập trước khi gửi'}
                </span>

                <button
                  type="submit"
                  disabled={!currentUser || !newFeedbackContent.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi ý kiến đóng góp</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Feedbacks */}
          <div className="space-y-4">
            {meetingFeedbacks.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200 text-slate-500 text-xs">
                Chưa có ý kiến nào được gửi cho cuộc họp này.
              </div>
            ) : (
              meetingFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg font-bold">
                        👩‍🏫
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {fb.authorName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {fb.authorTitle} · {fb.authorGroup} ·{' '}
                          {new Date(fb.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          {new Date(fb.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          fb.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : fb.status === 'acknowledged'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {fb.status === 'resolved'
                          ? 'Đã xử lý'
                          : fb.status === 'acknowledged'
                          ? 'Đã tiếp thu'
                          : 'Chờ tiếp thu'}
                      </span>

                      {canManage && (
                        <button
                          onClick={() => setDeleteFeedbackId(fb.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa ý kiến"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feedback text */}
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {fb.content}
                  </p>

                  {/* Admin Reply Display */}
                  {fb.adminReply && (
                    <div className="ml-4 sm:ml-6 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs space-y-1">
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-amber-700" />
                        <span>Phản hồi từ Ban Giám Hiệu / Chủ trì cuộc họp:</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed font-medium">
                        {fb.adminReply}
                      </p>
                    </div>
                  )}

                  {/* Manager Action: Change status & reply */}
                  {canManage && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-500">Trạng thái:</span>
                        <select
                          value={fb.status}
                          onChange={(e) =>
                            updateFeedbackStatus(fb.id, e.target.value as FeedbackStatus)
                          }
                          className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white"
                        >
                          <option value="pending">Chờ tiếp thu</option>
                          <option value="acknowledged">Đã tiếp thu</option>
                          <option value="resolved">Đã xử lý</option>
                        </select>
                      </div>

                      <div className="flex-1 max-w-md flex items-center gap-1.5">
                        <input
                          type="text"
                          value={adminReplyText[fb.id] || ''}
                          onChange={(e) =>
                            setAdminReplyText({
                              ...adminReplyText,
                              [fb.id]: e.target.value,
                            })
                          }
                          placeholder="Nhập câu trả lời của BGH..."
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                        />
                        <button
                          onClick={() => handleAdminReplySubmit(fb.id)}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                        >
                          Gửi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Minute Editor Modal */}
      <MinuteEditorModal
        isOpen={isMinuteModalOpen}
        meetingId={meeting.id}
        minuteToEdit={editingMinute}
        onClose={() => {
          setIsMinuteModalOpen(false);
          setEditingMinute(null);
        }}
      />

      {/* Delete Minute Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteMinuteId !== null}
        title="Xác nhận xóa biên bản cuộc họp?"
        message="Hành động này sẽ xóa vĩnh viễn biên bản đã lưu trong sổ tay. Bạn có chắc chắn muốn xóa không?"
        onConfirm={() => {
          if (deleteMinuteId) {
            deleteMinute(deleteMinuteId);
            setDeleteMinuteId(null);
          }
        }}
        onCancel={() => setDeleteMinuteId(null)}
      />

      {/* Delete Feedback Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteFeedbackId !== null}
        title="Xác nhận xóa ý kiến đóng góp?"
        message="Ý kiến này sẽ bị gỡ bỏ khỏi diễn đàn cuộc họp."
        onConfirm={() => {
          if (deleteFeedbackId) {
            deleteFeedback(deleteFeedbackId);
            setDeleteFeedbackId(null);
          }
        }}
        onCancel={() => setDeleteFeedbackId(null)}
      />

      {/* Delete Meeting Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteMeetingModalOpen}
        title="Xác nhận xóa toàn bộ cuộc họp?"
        message={`Hành động này sẽ xóa cuộc họp "${meeting.title}" cùng tất cả điểm danh, biên bản và ý kiến liên quan. Không thể khôi phục sau khi xóa.`}
        onConfirm={() => {
          setIsDeleteMeetingModalOpen(false);
          deleteMeeting(meeting.id);
        }}
        onCancel={() => setIsDeleteMeetingModalOpen(false)}
      />

      {/* File Attachment Viewer Modal for ALL school members with rich interactive preview */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-hidden animate-in fade-in duration-150">
          <div className="w-full max-w-5xl h-[90vh] flex flex-col">
            <DocumentDirectViewer
              file={viewingAttachment}
              allFiles={allMinuteFiles}
              onSelectFile={(f) => setViewingAttachment(f)}
              isModal={true}
              onClose={() => setViewingAttachment(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

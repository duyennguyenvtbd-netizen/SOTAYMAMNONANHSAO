import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Meeting, MeetingType, MeetingStatus, MinuteFileAttachment } from '../../types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Lock,
  Upload,
  HardDrive,
  Cloud,
  CloudOff,
  Trash2,
  FileSpreadsheet,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  Check,
  Link as LinkIcon,
  HelpCircle,
  Info,
} from 'lucide-react';
import { parseGoogleDriveUrl } from '../../services/googleDriveService';
import {
  isGroupLeader,
  isVicePrincipalAcademic,
  isVicePrincipalBoarding,
  isVicePrincipal,
  isPrincipal,
  isBoardOfDirectors,
  getUserMeetingRoleBadge,
} from '../../utils/permissionUtils';

interface MeetingModalProps {
  isOpen: boolean;
  meetingToEdit?: Meeting | null;
  onClose: () => void;
}

export const MeetingModal: React.FC<MeetingModalProps> = ({
  isOpen,
  meetingToEdit,
  onClose,
}) => {
  const {
    addMeeting,
    updateMeeting,
    users,
    currentUser,
    isDriveConnected,
    driveUser,
    connectDrive,
    uploadFileToGoogleDrive,
    addToast,
    addMinute,
  } = useApp();

  const isGroupLeaderOnly = isGroupLeader(currentUser) && !isBoardOfDirectors(currentUser);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<MeetingType>('Họp chuyên môn');
  const [targetGroup, setTargetGroup] = useState<string>('Toàn trường');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('Phòng Hội đồng Sư phạm (Trực tiếp)');
  const [host, setHost] = useState('');
  const [secretary, setSecretary] = useState('');
  const [description, setDescription] = useState('');
  const [attendeesText, setAttendeesText] = useState('Toàn thể Cán bộ Quản lý và Giáo viên các khối Mầm, Chồi, Lá');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<MeetingStatus>('upcoming');

  // Minute File Attachment State (Google Drive sync)
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{
      id: string;
      file: File;
      name: string;
      size: string;
      type: string;
      dataUrl: string;
    }>
  >([]);
  const [autoSyncDrive, setAutoSyncDrive] = useState(true);
  const [isUploadingMinute, setIsUploadingMinute] = useState(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isDraggingMinute, setIsDraggingMinute] = useState(false);

  const roleBadge = getUserMeetingRoleBadge(currentUser);

  useEffect(() => {
    if (meetingToEdit) {
      setTitle(meetingToEdit.title);
      setType(meetingToEdit.type);
      setTargetGroup(meetingToEdit.targetGroup || (meetingToEdit.type === 'Họp tổ chuyên môn' ? (currentUser?.group || 'Tổ Lá') : 'Toàn trường'));
      setDate(meetingToEdit.date);
      setStartTime(meetingToEdit.startTime);
      setEndTime(meetingToEdit.endTime);
      setLocation(meetingToEdit.location);
      setHost(meetingToEdit.host);
      setSecretary(meetingToEdit.secretary);
      setDescription(meetingToEdit.description);
      setAttendeesText(meetingToEdit.attendeesText);
      setNotes(meetingToEdit.notes || '');
      setStatus(meetingToEdit.status);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setStartTime('08:00');
      setEndTime('10:30');
      setStatus('upcoming');

      // Tùy biến thông minh theo quyền của người tạo cuộc họp:
      if (isGroupLeaderOnly) {
        // Tổ trưởng chỉ được tổ chức họp tổ chuyên môn của tổ mình
        const groupName = currentUser?.group || 'Tổ chuyên môn';
        setTitle(`Họp sinh hoạt chuyên môn định kỳ ${groupName}`);
        setType('Họp tổ chuyên môn');
        setTargetGroup(groupName);
        setLocation(`Phòng Sinh hoạt Chuyên môn ${groupName} (Trực tiếp)`);
        setHost(`${currentUser?.name} - ${currentUser?.title}`);
        setSecretary(users.find((u) => u.group === currentUser?.group && u.id !== currentUser?.id)?.name || 'Thư ký cuộc họp tổ');
        setDescription(`Sinh hoạt chuyên môn định kỳ theo kế hoạch của ${groupName}, thảo luận đổi mới bài học và đánh giá trẻ.`);
        setAttendeesText(`Toàn thể giáo viên và nhân viên ${groupName}`);
        setNotes('Đề nghị các cô mang theo giáo án và sổ ghi chép chuyên môn.');
      } else if (isVicePrincipalAcademic(currentUser)) {
        // Phó Hiệu trưởng Chuyên môn có quyền tạo cuộc họp chuyên môn
        setTitle('Họp Chuyên môn: Đổi mới phương pháp dạy học & Ứng dụng công nghệ AI');
        setType('Họp chuyên môn');
        setTargetGroup('Toàn trường');
        setLocation('Phòng Hội đồng Chuyên môn tầng 2 & Trực tuyến');
        setHost(`${currentUser?.name} - Phó Hiệu trưởng Chuyên môn`);
        setSecretary(users[1]?.name ? `${users[1].name} - Thư ký Hội đồng` : 'Thư ký cuộc họp');
        setDescription('Đánh giá chất lượng thực hiện chương trình GDMN, triển khai hoạt động STEAM và công nghệ số.');
        setAttendeesText('Ban Giám hiệu, Toàn bộ Giáo viên các khối Mầm, Chồi, Lá, Nhà trẻ');
        setNotes('Chuẩn bị máy tính cá nhân để thực hành ứng dụng công nghệ.');
      } else if (isVicePrincipalBoarding(currentUser)) {
        // Phó Hiệu trưởng Bán trú / Nuôi dưỡng có quyền tạo cuộc họp bán trú
        setTitle('Họp Công tác Bán trú & Nuôi dưỡng: Đảm bảo vệ sinh an toàn thực phẩm');
        setType('Họp chuyên môn');
        setTargetGroup('Toàn trường');
        setLocation('Phòng Họp Bán trú & Cơ sở vật chất');
        setHost(`${currentUser?.name} - Phó Hiệu trưởng Bán trú & CSVC`);
        setSecretary('Cán bộ Y tế học đường');
        setDescription('Kiểm tra quy trình giao nhận thực phẩm, định lượng suất ăn bán trú và an toàn tuyệt đối cho trẻ.');
        setAttendeesText('Ban Giám hiệu, Tổ Nuôi dưỡng cấp dưỡng, Cán bộ Y tế và Giáo viên các lớp');
        setNotes('Kiểm tra thực tế khu sơ chế và bếp nấu trước buổi họp.');
      } else {
        // Hiệu trưởng / Quản trị viên
        setTitle('Họp Hội đồng Sư phạm tháng: Triển khai nhiệm vụ trọng tâm');
        setType('Họp hội đồng trường');
        setTargetGroup('Toàn trường');
        setLocation('Hội trường Hoa Hướng Dương (Trực tiếp)');
        setHost(currentUser?.name ? `${currentUser.name} - ${currentUser.title}` : (users[0]?.name ? `${users[0].name} - ${users[0].title}` : 'Ban Giám hiệu'));
        setSecretary(users[1]?.name ? `${users[1].name} - Thư ký Hội đồng` : 'Thư ký cuộc họp');
        setDescription('Đánh giá công tác tháng vừa qua và triển khai kế hoạch giáo dục toàn trường.');
        setAttendeesText('Toàn thể Cán bộ Quản lý, Giáo viên và Nhân viên Trường MN Ánh Sao Phường Rạch Dừa');
        setNotes('Đề nghị các đồng chí tham gia đúng giờ, trang phục chỉnh tề.');
      }
    }
  }, [meetingToEdit, users, currentUser, isOpen, isGroupLeaderOnly]);

  if (!isOpen) return null;

  const handleProcessMinuteFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const sizeStr =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;
        const ext = file.name.split('.').pop()?.toLowerCase() || 'docx';

        setAttachedFiles((prev) => [
          ...prev,
          {
            id: 'file-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            file,
            name: file.name,
            size: sizeStr,
            type: ext,
            dataUrl,
          },
        ]);
        addToast(`Đã đính kèm tệp biên bản: ${file.name}`, 'info');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const getFileBadge = (ext: string) => {
    const lower = ext.toLowerCase();
    if (lower.includes('doc')) {
      return { icon: <FileText className="w-4 h-4 text-blue-600" />, label: 'Word (.doc/.docx)', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (lower.includes('pdf')) {
      return { icon: <FileText className="w-4 h-4 text-rose-600" />, label: 'PDF (.pdf)', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (['jpg', 'jpeg', 'png', 'webp'].some((img) => lower.includes(img))) {
      return { icon: <ImageIcon className="w-4 h-4 text-purple-600" />, label: 'Hình ảnh scan/chụp', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (lower.includes('xls')) {
      return { icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />, label: 'Bảng tính Excel', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return { icon: <FileText className="w-4 h-4 text-amber-600" />, label: 'Tệp văn phòng', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    // Ép kiểu theo quy định: Tổ trưởng CHỈ tổ chức cuộc họp tổ chuyên môn của tổ mình
    const finalType: MeetingType = isGroupLeaderOnly ? 'Họp tổ chuyên môn' : type;
    const finalTargetGroup = isGroupLeaderOnly ? (currentUser?.group || 'Tổ Lá') : targetGroup;

    setIsUploadingMinute(true);

    try {
      const uploadedAttachments: MinuteFileAttachment[] = [];
      let isSyncedToDrive = false;

      // Xử lý tải các tệp biên bản lên Google Drive (nếu có tệp đính kèm)
      if (attachedFiles.length > 0) {
        if (autoSyncDrive) {
          if (!isDriveConnected) {
            try {
              setIsConnectingDrive(true);
              await connectDrive();
            } catch (driveErr) {
              console.warn('Kết nối Google Drive chưa hoàn tất:', driveErr);
            } finally {
              setIsConnectingDrive(false);
            }
          }

          for (const item of attachedFiles) {
            try {
              const driveRecord = await uploadFileToGoogleDrive(item.file, {
                customName: `Biên bản cuộc họp - ${title.trim()} - ${item.name}`,
                category: 'Biên bản cuộc họp',
                description: `Biên bản cuộc họp: ${title.trim()}, chủ trì: ${host.trim() || currentUser?.name}`,
                tags: ['Biên bản cuộc họp', finalType, 'Trường MN Ánh Sao', 'Toàn trường'],
                meetingTitle: title.trim(),
                sharingStatus: 'anyone',
              });

              uploadedAttachments.push({
                id: 'min-file-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                name: driveRecord.name,
                size: driveRecord.size,
                type: item.type,
                dataUrl: item.dataUrl,
                driveFileId: driveRecord.driveFileId,
                driveWebViewLink: driveRecord.webViewLink,
                driveDownloadLink: driveRecord.webContentLink,
                uploadedAt: new Date().toISOString(),
                uploadedBy: currentUser?.name || host.trim() || 'Người chủ trì',
              });
              isSyncedToDrive = true;
            } catch (uploadErr) {
              console.warn('Lỗi tải tệp lên Google Drive:', uploadErr);
              uploadedAttachments.push({
                id: 'min-file-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                name: item.name,
                size: item.size,
                type: item.type,
                dataUrl: item.dataUrl,
                uploadedAt: new Date().toISOString(),
                uploadedBy: currentUser?.name || host.trim() || 'Người chủ trì',
              });
            }
          }
        } else {
          // Lưu tệp cục bộ
          attachedFiles.forEach((item) => {
            uploadedAttachments.push({
              id: 'min-file-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
              name: item.name,
              size: item.size,
              type: item.type,
              dataUrl: item.dataUrl,
              uploadedAt: new Date().toISOString(),
              uploadedBy: currentUser?.name || host.trim() || 'Người chủ trì',
            });
          });
        }
      }

      // Chuẩn bị initialMinute nếu có tệp biên bản đính kèm
      const initialMinute =
        uploadedAttachments.length > 0
          ? {
              title: `Biên bản cuộc họp - ${title.trim()}`,
              meetingContent: `Cuộc họp: ${title.trim()}\nNgười chủ trì: ${host.trim()}\nThư ký: ${secretary.trim()}\nThời gian: ${startTime} - ${endTime}, ngày ${date}\nĐịa điểm: ${location.trim()}`,
              deployedContent: description.trim() || 'Nội dung và phân công chi tiết được đính kèm trong tệp biên bản cuộc họp.',
              contributions: 'Toàn thể giáo viên và cán bộ tham dự cuộc họp thảo luận và đóng góp ý kiến.',
              conclusions: `Chủ trì (${host.trim() || currentUser?.name}): Thống nhất thông qua toàn bộ nội dung biên bản cuộc họp.`,
              tasks: [],
              notes: isSyncedToDrive
                ? 'Tệp biên bản đã được kết nối và lưu trữ an toàn trên Google Drive trường.'
                : 'Tệp biên bản lưu trữ trên hệ thống.',
              files: uploadedAttachments,
              createdBy: currentUser?.name || host.trim() || 'Người chủ trì',
            }
          : undefined;

      if (meetingToEdit) {
        updateMeeting({
          ...meetingToEdit,
          title: title.trim(),
          type: finalType,
          targetGroup: finalTargetGroup,
          date,
          startTime,
          endTime,
          location: location.trim(),
          host: host.trim(),
          secretary: secretary.trim(),
          description: description.trim(),
          attendeesText: attendeesText.trim(),
          notes: notes.trim(),
          status,
        });

        // Nếu người dùng bổ sung tệp biên bản khi sửa cuộc họp
        if (initialMinute) {
          addMinute({
            ...initialMinute,
            meetingId: meetingToEdit.id,
          });
        }
      } else {
        addMeeting(
          {
            title: title.trim(),
            type: finalType,
            targetGroup: finalTargetGroup,
            date,
            startTime,
            endTime,
            location: location.trim(),
            host: host.trim(),
            secretary: secretary.trim(),
            description: description.trim(),
            attendeesText: attendeesText.trim(),
            notes: notes.trim(),
            status,
          },
          initialMinute
        );
      }

      if (isSyncedToDrive) {
        addToast(
          'Đã lưu trữ tệp biên bản lên Google Drive và tạo liên kết cho toàn trường xem!',
          'success',
          'Đã kết nối Google Drive'
        );
      }

      onClose();
    } catch (err: any) {
      console.error('Lỗi khi lưu cuộc họp:', err);
      addToast('Có lỗi xảy ra khi lưu cuộc họp, vui lòng thử lại', 'error');
    } finally {
      setIsUploadingMinute(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-500 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-amber-200">
              Trường Mầm Non Ánh Sao Phường Rạch Dừa
            </div>
            <h2 className="text-lg sm:text-xl font-bold">
              {meetingToEdit ? 'Chỉnh Sửa Cuộc Họp' : 'Tạo Cuộc Họp Mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Thông báo quyền tạo cuộc họp */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-950 flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-lg shrink-0 mt-0.5">
              {isGroupLeader(currentUser) ? '⭐' : isVicePrincipal(currentUser) ? '📘' : '👑'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-900">{currentUser?.name}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadge.badgeClass}`}>
                  {roleBadge.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                {isGroupLeaderOnly ? (
                  <>
                    <strong>Quy định Tổ trưởng:</strong> Bạn chỉ tổ chức được cuộc họp <strong>Tổ chuyên môn</strong> của tổ/khối <strong>{currentUser?.group}</strong> của mình; không tổ chức được cuộc họp hội đồng hay cuộc họp chuyên môn trường.
                  </>
                ) : isVicePrincipalAcademic(currentUser) ? (
                  <>
                    <strong>Quyền Phó Hiệu trưởng Chuyên môn:</strong> Ban Giám Hiệu có quyền tham gia tất cả các cuộc họp; khởi tạo và chỉ đạo các cuộc họp chuyên môn, sinh hoạt tổ khối và toàn trường.
                  </>
                ) : isVicePrincipalBoarding(currentUser) ? (
                  <>
                    <strong>Quyền Phó Hiệu trưởng Bán trú & CSVC:</strong> Ban Giám Hiệu có quyền tham gia tất cả các cuộc họp; khởi tạo các cuộc họp công tác bán trú, nuôi dưỡng, ATTP và CSVC.
                  </>
                ) : (
                  <>
                    <strong>Quyền Hiệu trưởng:</strong> Toàn quyền tham gia tất cả các cuộc họp, duyệt và khởi tạo mọi cuộc họp trường; nắm quyền phân quyền quản trị admin.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Tên cuộc họp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tên cuộc họp <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Họp Hội đồng Sư phạm tháng 10 - Đổi mới phương pháp STEAM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-medium transition-all"
            />
          </div>

          {/* Loại cuộc họp, Tổ áp dụng & Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Loại cuộc họp <span className="text-rose-500">*</span>
              </label>
              {isGroupLeaderOnly ? (
                <div>
                  <div className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50/70 text-amber-950 text-xs sm:text-sm font-bold flex items-center justify-between">
                    <span>Họp tổ chuyên môn</span>
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  </div>
                  <span className="text-[10px] text-amber-800 font-medium block mt-1">
                    Tổ trưởng chỉ tổ chức họp tổ chuyên môn
                  </span>
                </div>
              ) : (
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MeetingType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm bg-white"
                >
                  <option value="Họp hội đồng trường">Họp hội đồng trường</option>
                  <option value="Họp chuyên môn">Họp chuyên môn</option>
                  <option value="Họp tổ chuyên môn">Họp tổ chuyên môn</option>
                  <option value="Họp đột xuất">Họp đột xuất</option>
                  <option value="Khác">Khác</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tổ / Khối áp dụng <span className="text-rose-500">*</span>
              </label>
              {isGroupLeaderOnly ? (
                <div>
                  <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-between">
                    <span>{currentUser?.group || 'Tổ chuyên môn'}</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Áp dụng cho tổ của bạn
                  </span>
                </div>
              ) : (
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm bg-white"
                >
                  <option value="Toàn trường">Toàn trường (Tất cả tổ khối)</option>
                  <option value="Tổ Lá">Tổ Lá (Khối 5-6 tuổi)</option>
                  <option value="Tổ Chồi">Tổ Chồi (Khối 4-5 tuổi)</option>
                  <option value="Tổ Mầm">Tổ Mầm (Khối 3-4 tuổi)</option>
                  <option value="Tổ Nhà trẻ">Tổ Nhà trẻ (24-36 tháng)</option>
                  <option value="Tổ Văn phòng & Y tế">Tổ Văn phòng & Y tế</option>
                  <option value="Tổ Năng khiếu">Tổ Năng khiếu</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Trạng thái cuộc họp
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MeetingStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm bg-white"
              >
                <option value="upcoming">Sắp diễn ra</option>
                <option value="ongoing">Đang diễn ra</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Ngày & Giờ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ngày họp <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm bg-white"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bắt đầu
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kết thúc
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm bg-white"
              />
            </div>
          </div>

          {/* Địa điểm hoặc hình thức họp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Địa điểm hoặc hình thức họp
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="VD: Phòng Hội đồng Sư phạm, Phòng Chuyên môn 1, Trực tuyến Google Meet"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
            />
          </div>

          {/* Người chủ trì & Người ghi biên bản */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Người chủ trì
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="VD: Cô Nguyễn Thị Thu Duyên - Hiệu trưởng"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Người ghi biên bản
              </label>
              <input
                type="text"
                value={secretary}
                onChange={(e) => setSecretary(e.target.value)}
                placeholder="VD: Cô Lê Hoàng Bảo Ngọc - Thư ký"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
              />
            </div>
          </div>

          {/* Nội dung / Mục đích cuộc họp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nội dung / Mục đích cuộc họp
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tóm tắt mục đích cuộc họp, các vấn đề cốt lõi cần giải quyết..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
            />
          </div>

          {/* Thành phần tham dự */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Thành phần tham dự
            </label>
            <input
              type="text"
              value={attendeesText}
              onChange={(e) => setAttendeesText(e.target.value)}
              placeholder="VD: Toàn thể giáo viên, BGH, Tổ trưởng chuyên môn..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
            />
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ghi chú thêm
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Giáo viên mang theo máy tính cá nhân để thực hành..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
            />
          </div>

          {/* MỤC: ĐẨY TỆP BIÊN BẢN CUỘC HỌP LÊN & KẾT NỐI GOOGLE DRIVE */}
          <div className="pt-2">
            <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    📁
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-amber-950 uppercase tracking-wide">
                      Đẩy Tệp Biên Bản Cuộc Họp Lên (Google Drive)
                    </h3>
                    <p className="text-[11px] text-amber-800">
                      Người chủ trì tải tệp biên bản lên để toàn trường tham gia có thể bấm vào và xem được nội dung.
                    </p>
                  </div>
                </div>

                {/* Google Drive Status & Connect */}
                <div className="flex items-center gap-2">
                  {isDriveConnected ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Drive đã kết nối ({driveUser?.displayName || driveUser?.email || 'Tài khoản trường'})</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setIsConnectingDrive(true);
                          await connectDrive();
                        } finally {
                          setIsConnectingDrive(false);
                        }
                      }}
                      disabled={isConnectingDrive}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isConnectingDrive ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang kết nối...</span>
                        </>
                      ) : (
                        <>
                          <HardDrive className="w-3.5 h-3.5" />
                          <span>Kết nối Google Drive</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingMinute(true);
                }}
                onDragLeave={() => setIsDraggingMinute(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingMinute(false);
                  handleProcessMinuteFiles(e.dataTransfer.files);
                }}
                className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
                  isDraggingMinute
                    ? 'border-amber-500 bg-amber-100/70 scale-[1.01]'
                    : 'border-amber-300 hover:border-amber-400 bg-white/80 hover:bg-white'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept=".doc,.docx,.pdf,.png,.jpg,.jpeg,.webp,.xls,.xlsx"
                  onChange={(e) => handleProcessMinuteFiles(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Kéo thả tệp biên bản vào đây hoặc <span className="text-amber-600 underline">Chọn từ máy tính</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Hỗ trợ Word (.docx, .doc), PDF, Hình ảnh scan (.jpg, .png, .webp), Excel (.xlsx, .xls)
                    </p>
                  </div>
                </div>
              </div>

              {/* Attached Files List */}
              {attachedFiles.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                    <span>Tệp đính kèm sẽ lưu lên Google Drive ({attachedFiles.length}):</span>
                    <span className="text-emerald-700 font-bold">☁️ Tự động liên kết cuộc họp</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {attachedFiles.map((item) => {
                      const badge = getFileBadge(item.type);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-amber-300 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-slate-50 shrink-0">
                              {badge.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${badge.color}`}>
                                  {badge.label}
                                </span>
                                <span>{item.size}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFile(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                            title="Xóa tệp này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sync Options Toggle */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSyncDrive}
                    onChange={(e) => setAutoSyncDrive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Lưu trữ vào Google Drive và tạo liên kết truy cập cho toàn trường
                  </span>
                </label>
                <span className="text-[11px] text-amber-700 font-medium">
                  {isDriveConnected ? '✓ Sẵn sàng đồng bộ' : 'ℹ️ Sẽ nhắc kết nối khi lưu'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploadingMinute}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isUploadingMinute}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isUploadingMinute ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải lên Google Drive & lưu...</span>
                </>
              ) : (
                <span>{meetingToEdit ? 'Lưu thay đổi' : 'Tạo cuộc họp'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

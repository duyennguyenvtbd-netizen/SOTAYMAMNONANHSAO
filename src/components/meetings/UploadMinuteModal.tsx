import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Meeting, MinuteFileAttachment } from '../../types';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileImage,
  FileSpreadsheet,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface UploadMinuteModalProps {
  isOpen: boolean;
  meeting: Meeting;
  onClose: () => void;
}

export const UploadMinuteModal: React.FC<UploadMinuteModalProps> = ({
  isOpen,
  meeting,
  onClose,
}) => {
  const {
    addMinute,
    currentUser,
    addToast,
    isDriveConnected,
    connectDrive,
    uploadMinuteDirectToDrive,
    uploadFileToGoogleDrive,
  } = useApp();

  // Tên mặc định theo yêu cầu: "Biên bản cuộc họp" hoặc "Biên bản cuộc họp - [Tên cuộc họp]"
  const [minuteTitle, setMinuteTitle] = useState('Biên bản cuộc họp');
  const [meetingSummary, setMeetingSummary] = useState(
    `Biên bản ghi nhận diễn biến và các nội dung đã triển khai trong ${meeting.title}.`
  );
  const [deployedNotes, setDeployedNotes] = useState('');
  const [conclusions, setConclusions] = useState('');
  const [files, setFiles] = useState<MinuteFileAttachment[]>([]);
  const [rawFiles, setRawFiles] = useState<{ [id: string]: File }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveDrive, setAutoSaveDrive] = useState(true);

  if (!isOpen) return null;

  const handleFileProcess = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const sizeStr =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;

        const ext = file.name.split('.').pop()?.toLowerCase() || 'other';

        const newAttachment: MinuteFileAttachment = {
          id: fileId,
          name: file.name,
          size: sizeStr,
          type: ext,
          dataUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser?.name || meeting.host || 'Người chủ trì',
        };

        setRawFiles((prev) => ({ ...prev, [fileId]: file }));
        setFiles((prev) => [...prev, newAttachment]);
        addToast(`Đã tải lên tệp: ${file.name}`, 'info');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileProcess(e.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileProcess(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setRawFiles((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const getFileIcon = (type: string) => {
    if (type.includes('doc')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-rose-600" />;
    if (type.includes('xls')) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (['png', 'jpg', 'jpeg'].includes(type))
      return <FileImage className="w-5 h-5 text-purple-600" />;
    return <FileCode className="w-5 h-5 text-amber-600" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minuteTitle.trim()) {
      addToast('Vui lòng nhập tên biên bản cuộc họp', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const fullContent =
        meetingSummary.trim() ||
        `Cuộc họp: ${meeting.title}\nThời gian: ${meeting.startTime} - ${meeting.endTime}, ngày ${meeting.date}\nĐịa điểm: ${meeting.location}\nChủ trì: ${meeting.host}`;

      let finalFiles: MinuteFileAttachment[] = [...files];
      let driveSyncSuccess = false;

      // Tự động lưu trữ vào Google Drive nếu người dùng chọn
      if (autoSaveDrive) {
        if (!isDriveConnected) {
          addToast(
            'Đang kết nối tài khoản Google Drive để lưu trữ tự động biên bản...',
            'info'
          );
          try {
            await connectDrive();
          } catch {
            console.warn('Người dùng chưa cấp quyền Google Drive, biên bản vẫn được lưu trên sổ tay.');
          }
        }

        // Tải từng tệp đính kèm lên Google Drive
        finalFiles = await Promise.all(
          files.map(async (f) => {
            const rawFile = rawFiles[f.id];
            if (rawFile) {
              try {
                const driveRes = await uploadFileToGoogleDrive(rawFile, {
                  customName: `Biên bản cuộc họp - ${meeting.title} - ${rawFile.name}`,
                  category: 'Biên bản cuộc họp',
                  meetingId: meeting.id,
                  meetingTitle: meeting.title,
                  sharingStatus: 'anyone',
                  description: `Biên bản cuộc họp: ${meeting.title}, chủ trì: ${meeting.host}`,
                  tags: ['Biên bản', 'Cuộc họp', 'Google Drive', meeting.type],
                });
                driveSyncSuccess = true;
                return {
                  ...f,
                  driveFileId: driveRes.driveFileId,
                  driveWebViewLink: driveRes.webViewLink,
                  driveDownloadLink: driveRes.webContentLink,
                };
              } catch (err) {
                console.warn('Lỗi tải tệp đính kèm lên Drive:', err);
                return f;
              }
            }
            return f;
          })
        );

        try {
          await uploadMinuteDirectToDrive(
            meeting,
            minuteTitle.trim() || 'Biên bản cuộc họp',
            `${fullContent}\n\nNội dung triển khai:\n${deployedNotes || 'Đã thông qua'}\n\nKết luận:\n${conclusions || 'Thống nhất thực hiện'}`,
            finalFiles
          );
          driveSyncSuccess = true;
        } catch (driveErr: any) {
          console.warn('Lỗi lưu văn bản Google Drive:', driveErr);
        }
      }

      addMinute({
        meetingId: meeting.id,
        title: minuteTitle.trim(),
        meetingContent: fullContent,
        deployedContent: deployedNotes.trim() || 'Các nội dung chuyên môn đã được thông qua.',
        contributions: 'Đã tổng hợp đầy đủ các ý kiến đóng góp của giáo viên tham dự.',
        conclusions:
          conclusions.trim() ||
          `Kết luận của chủ trì (${meeting.host}): Thống nhất thực hiện theo kế hoạch đã đề ra.`,
        tasks: [],
        notes: driveSyncSuccess
          ? `Biên bản đã kết nối và lưu trữ an toàn trên Google Drive.`
          : `Biên bản do người chủ trì (${currentUser?.name || meeting.host}) đẩy lên hệ thống.`,
        files: finalFiles,
        createdBy: currentUser?.name || meeting.host || 'Người chủ trì',
      });

      addToast(
        driveSyncSuccess
          ? `Đã lưu trữ biên bản và tệp đính kèm lên Google Drive cho toàn trường xem!`
          : `Đã lưu biên bản với tên "${minuteTitle.trim()}"!`,
        'success',
        'Lưu trữ biên bản thành công'
      );

      onClose();
    } catch {
      addToast('Có lỗi xảy ra khi lưu biên bản, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0">
              📤
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">
                Dành cho người chủ trì cuộc họp
              </div>
              <h3 className="text-base sm:text-lg font-bold leading-tight">
                Đẩy Biên Bản Cuộc Họp Lên
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Target Meeting Info */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
            <div className="font-extrabold flex items-center gap-1.5 text-amber-900 text-sm">
              <span>📋 Cuộc họp:</span>
              <span>{meeting.title}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
              <span>
                <strong>Chủ trì:</strong> {meeting.host}
              </span>
              <span>•</span>
              <span>
                <strong>Thời gian:</strong> {meeting.startTime} - {meeting.endTime}, {meeting.date}
              </span>
              <span>•</span>
              <span>
                <strong>Địa điểm:</strong> {meeting.location}
              </span>
            </div>
          </div>

          {/* Minute Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tên biên bản cuộc họp lưu trữ <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMinuteTitle('Biên bản cuộc họp')}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 transition-colors"
                >
                  "Biên bản cuộc họp"
                </button>
                <button
                  type="button"
                  onClick={() => setMinuteTitle(`Biên bản cuộc họp - ${meeting.title}`)}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 transition-colors"
                >
                  Kèm tên cuộc họp
                </button>
              </div>
            </div>
            <input
              type="text"
              required
              value={minuteTitle}
              onChange={(e) => setMinuteTitle(e.target.value)}
              placeholder="VD: Biên bản cuộc họp"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-bold text-slate-900"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Biên bản này sẽ được tự động lưu trữ vào hệ thống với tên là <strong>{minuteTitle || 'Biên bản cuộc họp'}</strong>.
            </p>
          </div>

          {/* Google Drive Auto-Sync Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                ☁️
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 flex-wrap">
                  <span>Tự động lưu trữ vào Google Drive</span>
                  {isDriveConnected ? (
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">
                      Đã kết nối
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
                      Sẵn sàng kết nối
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-emerald-800 truncate">
                  Tên tệp trên Drive: <strong>{minuteTitle || 'Biên bản cuộc họp'}</strong>
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoSaveDrive}
                onChange={(e) => setAutoSaveDrive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* File Upload Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tải tệp biên bản đính kèm (Word .docx, PDF, hình ảnh chụp/scan)
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20'
              }`}
            >
              <input
                type="file"
                id="minute-file-input"
                multiple
                accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <label htmlFor="minute-file-input" className="cursor-pointer block">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2.5">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Kéo thả tệp tin biên bản vào đây hoặc <span className="text-amber-700 underline">bấm để chọn tệp</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hỗ trợ Word (.docx, .doc), PDF (.pdf), Excel, ảnh chụp biên bản họp (.png, .jpg)
                </p>
              </label>
            </div>

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-bold text-slate-700">
                  Tệp đính kèm sẽ lưu trữ ({files.length}):
                </div>
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getFileIcon(file.type)}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">{file.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {file.size} • Tải lên bởi: {file.uploadedBy}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Gỡ tệp"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diễn biến / Tóm tắt nội dung cuộc họp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Diễn biến & Nội dung chính cuộc họp
            </label>
            <textarea
              rows={3}
              value={meetingSummary}
              onChange={(e) => setMeetingSummary(e.target.value)}
              placeholder="Tóm tắt nội dung, diễn biến cuộc họp..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm bg-white"
            />
          </div>

          {/* Nội dung đã triển khai */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Các nội dung đã triển khai & thống nhất
            </label>
            <textarea
              rows={2}
              value={deployedNotes}
              onChange={(e) => setDeployedNotes(e.target.value)}
              placeholder="Các văn bản, kế hoạch chuyên môn đã triển khai và thống nhất..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm bg-white"
            />
          </div>

          {/* Kết luận của người chủ trì */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Kết luận & chỉ đạo của người chủ trì ({meeting.host})
            </label>
            <textarea
              rows={2}
              value={conclusions}
              onChange={(e) => setConclusions(e.target.value)}
              placeholder="Kết luận chỉ đạo trọng tâm của người chủ trì..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm bg-white"
            />
          </div>

          {/* Automatic Storage Note */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Biên bản này được tự động lưu trữ an toàn trong sổ tay điện tử của Trường Mầm non Ánh Sao Phường Rạch Dừa. Ban Giám Hiệu và các thành viên được phân quyền có thể xem, tải tệp hoặc in ấn bất kỳ lúc nào.
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu trữ...' : 'Đẩy biên bản lên & Lưu trữ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

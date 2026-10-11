import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DriveFileRecord, DriveSharingStatus } from '../../types';
import { X, Copy, Check, Lock, Globe, ExternalLink, ShieldCheck } from 'lucide-react';
import { updateDriveSharing } from '../../services/googleDriveService';

interface DriveShareModalProps {
  file: DriveFileRecord | null;
  onClose: () => void;
}

export const DriveShareModal: React.FC<DriveShareModalProps> = ({ file, onClose }) => {
  const { updateDriveFileRecord, addToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!file) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(file.webViewLink);
    setCopied(true);
    addToast('Đã sao chép liên kết tài liệu Google Drive!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleSharing = async (newStatus: DriveSharingStatus) => {
    if (newStatus === file.sharingStatus) return;

    setIsUpdating(true);
    try {
      if (newStatus === 'anyone') {
        await updateDriveSharing(file.driveFileId, 'anyone');
      }
      await updateDriveFileRecord(file.id, { sharingStatus: newStatus });
      addToast(
        newStatus === 'anyone'
          ? 'Đã chuyển tệp sang chế độ "Bất kỳ ai có liên kết đều có thể xem"!'
          : 'Đã chuyển tệp về chế độ "Hạn chế truy cập"!',
        'success'
      );
    } catch (err: any) {
      console.error('Lỗi cập nhật chia sẻ:', err);
      addToast(err?.message || 'Không thể cập nhật quyền chia sẻ', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chia Sẻ & Quyền Truy Cập Tệp
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">{file.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Link Box */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Liên kết Google Drive
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={file.webViewLink}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 truncate focus:outline-hidden"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Access Mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Phạm vi quyền truy cập
            </label>

            {/* Restricted Option */}
            <div
              onClick={() => !isUpdating && handleToggleSharing('restricted')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                file.sharingStatus === 'restricted'
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Hạn chế (Restricted)</span>
                  {file.sharingStatus === 'restricted' && (
                    <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full">
                      Đang áp dụng
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chỉ những người dùng được cấp quyền cụ thể trên Google Drive mới có thể mở và xem tệp tin này.
                </p>
              </div>
            </div>

            {/* Anyone with link Option */}
            <div
              onClick={() => !isUpdating && handleToggleSharing('anyone')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                file.sharingStatus === 'anyone'
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Bất kỳ ai có liên kết</span>
                  {file.sharingStatus === 'anyone' && (
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                      Đang áp dụng
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bất kỳ ai có liên kết này đều có quyền xem tài liệu (chế độ chỉ đọc). Phù hợp khi chia sẻ tài liệu công khai trong trường.
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Người tải lên:</span>
              <span className="font-semibold text-slate-800">{file.uploadedBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Thư mục Drive:</span>
              <span className="font-semibold text-slate-800">{file.folderName}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-bold hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Mở tệp trên Drive</span>
            </a>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

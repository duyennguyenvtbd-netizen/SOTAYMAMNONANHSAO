import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DriveFileRecord } from '../../types';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

interface DriveDeleteConfirmModalProps {
  file: DriveFileRecord | null;
  onClose: () => void;
}

export const DriveDeleteConfirmModal: React.FC<DriveDeleteConfirmModalProps> = ({
  file,
  onClose,
}) => {
  const { deleteDriveFileRecord } = useApp();
  const [deleteMode, setDeleteMode] = useState<'metadata_only' | 'permanent_drive'>('metadata_only');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!file) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDriveFileRecord(file.id, deleteMode === 'permanent_drive');
      onClose();
    } catch {
      // Toast handled
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-900">
                Xác Nhận Xóa Tài Liệu
              </h3>
              <p className="text-xs text-rose-700 truncate max-w-xs">{file.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-rose-200/60 text-rose-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Vui lòng chọn hình thức xóa tài liệu <strong>"{file.name}"</strong>:
          </p>

          <div className="space-y-3">
            {/* Option 1: Delete metadata only */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                deleteMode === 'metadata_only'
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="deleteMode"
                value="metadata_only"
                checked={deleteMode === 'metadata_only'}
                onChange={() => setDeleteMode('metadata_only')}
                className="mt-1 text-amber-600 focus:ring-amber-500"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900">
                  Chỉ gỡ khỏi sổ tay điện tử (Khuyến nghị)
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Chỉ xóa bản ghi thông tin trong hệ thống ứng dụng. Tệp gốc trên Google Drive của bạn vẫn được giữ nguyên vẹn an toàn.
                </div>
              </div>
            </label>

            {/* Option 2: Delete permanently on Google Drive */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                deleteMode === 'permanent_drive'
                  ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="deleteMode"
                value="permanent_drive"
                checked={deleteMode === 'permanent_drive'}
                onChange={() => setDeleteMode('permanent_drive')}
                className="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div className="text-xs">
                <div className="font-bold text-rose-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Xóa vĩnh viễn trên Google Drive & Hệ thống</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Hệ thống sẽ gọi trực tiếp Google Drive API để xóa tệp tin này khỏi kho Drive của bạn. Hành động này không thể hoàn tác!
                </div>
              </div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                deleteMode === 'permanent_drive'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Đang xóa...' : deleteMode === 'permanent_drive' ? 'Xóa vĩnh viễn' : 'Xóa bản ghi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

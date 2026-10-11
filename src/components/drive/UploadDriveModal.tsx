import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DriveFileCategory, DriveSharingStatus } from '../../types';
import {
  Upload,
  X,
  FileText,
  FileSpreadsheet,
  Image,
  AlertCircle,
  Folder,
  Lock,
  Globe,
  Tag,
  CheckCircle2,
} from 'lucide-react';

interface UploadDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadDriveModal: React.FC<UploadDriveModalProps> = ({ isOpen, onClose }) => {
  const { uploadFileToGoogleDrive, isDriveConnected, connectDrive, addToast } = useApp();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [category, setCategory] = useState<DriveFileCategory>('Tài liệu chuyên môn');
  const [folderName, setFolderName] = useState('Sổ Tay Trường MN Ánh Sao');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [sharingStatus, setSharingStatus] = useState<DriveSharingStatus>('restricted');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!customName.trim()) {
      setCustomName(file.name);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast('Vui lòng chọn tệp tin cần tải lên!', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      if (!isDriveConnected) {
        addToast('Đang kết nối tài khoản Google Drive...', 'info');
        await connectDrive();
      }

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await uploadFileToGoogleDrive(selectedFile, {
        customName: customName.trim() || selectedFile.name,
        category,
        description: description.trim(),
        tags,
        folderName: folderName.trim() || 'Sổ Tay Trường MN Ánh Sao',
        sharingStatus,
      });

      onClose();
      // Reset form
      setSelectedFile(null);
      setCustomName('');
      setDescription('');
      setTagsInput('');
    } catch (err: any) {
      console.error('Lỗi tải tệp lên Drive:', err);
      // Toast error is handled inside AppContext or here
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['doc', 'docx'].includes(ext || ''))
      return <FileText className="w-8 h-8 text-blue-600" />;
    if (ext === 'pdf')
      return <FileText className="w-8 h-8 text-rose-600" />;
    if (['xls', 'xlsx'].includes(ext || ''))
      return <FileSpreadsheet className="w-8 h-8 text-emerald-600" />;
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || ''))
      return <Image className="w-8 h-8 text-purple-600" />;
    return <FileText className="w-8 h-8 text-amber-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shrink-0">
              ☁️
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">
                Google Drive API v3
              </div>
              <h3 className="text-base sm:text-lg font-bold leading-tight">
                Tải Tài Liệu Lên Google Drive
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* File Picker Drag & Drop */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Chọn tệp tin (Word, PDF, Excel, Hình ảnh) <span className="text-rose-500">*</span>
            </label>
            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDragging
                    ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-amber-400 bg-slate-50/50'
                }`}
              >
                <Upload className="w-10 h-10 mx-auto text-amber-600 mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  Kéo thả tệp tin vào đây, hoặc nhấn để duyệt tệp
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hỗ trợ: Word (.docx, .doc), PDF (.pdf), Excel (.xlsx), Ảnh (.png, .jpg, .webp)
                </p>
                <input
                  type="file"
                  id="drive-upload-input"
                  className="hidden"
                  accept=".docx,.doc,.pdf,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.pptx"
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="drive-upload-input"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Chọn tệp từ thiết bị</span>
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 border border-amber-200 shadow-xs">
                    {getFileIcon(selectedFile)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Tệp nhị phân'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setCustomName('');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                  title="Chọn tệp khác"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Custom Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Tên tệp hiển thị trên Google Drive <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="VD: Biên bản cuộc họp, Kế hoạch tháng 10..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs text-slate-800 bg-white"
              required
            />
          </div>

          {/* Category & Folder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Danh mục tài liệu
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DriveFileCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs text-slate-800 bg-white"
              >
                <option value="Biên bản cuộc họp">Biên bản cuộc họp</option>
                <option value="Tài liệu chuyên môn">Tài liệu chuyên môn</option>
                <option value="Kế hoạch giáo dục">Kế hoạch giáo dục</option>
                <option value="Hình ảnh hoạt động">Hình ảnh hoạt động</option>
                <option value="Ý kiến đóng góp">Ý kiến đóng góp</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Thư mục lưu trữ trên Drive
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Sổ Tay Trường MN Ánh Sao"
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs text-slate-800 bg-white"
                />
                <Folder className="w-4 h-4 text-amber-600 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Sharing Status Policy */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>🔒 Chính sách bảo mật và quyền truy cập tệp</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  sharingStatus === 'restricted'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-medium'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="sharingStatus"
                  value="restricted"
                  checked={sharingStatus === 'restricted'}
                  onChange={() => setSharingStatus('restricted')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div className="text-[11px] leading-snug">
                  <div className="font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Hạn chế truy cập (Mặc định)</span>
                  </div>
                  <div className="text-slate-500 text-[10px] mt-0.5">
                    Chỉ những tài khoản được bạn cấp quyền mới xem được tệp.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  sharingStatus === 'anyone'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-medium'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="sharingStatus"
                  value="anyone"
                  checked={sharingStatus === 'anyone'}
                  onChange={() => setSharingStatus('anyone')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div className="text-[11px] leading-snug">
                  <div className="font-bold flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bất kỳ ai có liên kết (Chỉ xem)</span>
                  </div>
                  <div className="text-slate-500 text-[10px] mt-0.5">
                    Cho phép giáo viên/phụ huynh có liên kết xem được tài liệu.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Mô tả nội dung tệp
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Biên bản họp triển khai chuyên đề nuôi dạy trẻ quý IV..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs text-slate-800 bg-white"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Từ khóa tìm kiếm (phân cách bởi dấu phẩy)
            </label>
            <div className="relative">
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="VD: Biên bản, Chuyên môn, Khối Lá, Tháng 10..."
                className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs text-slate-800 bg-white"
              />
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải lên Google Drive...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Tải lên Google Drive</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

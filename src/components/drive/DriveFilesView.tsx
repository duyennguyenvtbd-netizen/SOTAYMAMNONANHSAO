import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DriveFileRecord, DriveFileCategory } from '../../types';
import {
  HardDrive,
  Upload,
  Search,
  Filter,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Folder,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  LayoutGrid,
  List,
  Lock,
  Globe,
  Tag,
  Calendar,
  User,
  ShieldCheck,
  CloudOff,
  Cloud,
} from 'lucide-react';
import { UploadDriveModal } from './UploadDriveModal';
import { DrivePreviewModal } from './DrivePreviewModal';
import { DriveShareModal } from './DriveShareModal';
import { DriveEditModal } from './DriveEditModal';
import { DriveDeleteConfirmModal } from './DriveDeleteConfirmModal';

export const DriveFilesView: React.FC = () => {
  const {
    driveFiles,
    isDriveConnected,
    driveUser,
    connectDrive,
    disconnectDrive,
    syncDriveWithFirestore,
    addToast,
    currentUser,
  } = useApp();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [selectedSharing, setSelectedSharing] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<DriveFileRecord | null>(null);
  const [shareFile, setShareFile] = useState<DriveFileRecord | null>(null);
  const [editFile, setEditFile] = useState<DriveFileRecord | null>(null);
  const [deleteFile, setDeleteFile] = useState<DriveFileRecord | null>(null);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return driveFiles.filter((file) => {
      // Search
      const matchesSearch =
        !searchTerm.trim() ||
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (file.tags && file.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        file.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());

      // Category
      const matchesCategory =
        selectedCategory === 'all' || file.category === selectedCategory;

      // File Type
      let matchesType = true;
      if (selectedFileType === 'word') {
        matchesType =
          file.mimeType.includes('word') ||
          file.name.endsWith('.docx') ||
          file.name.endsWith('.doc');
      } else if (selectedFileType === 'pdf') {
        matchesType = file.mimeType.includes('pdf') || file.name.endsWith('.pdf');
      } else if (selectedFileType === 'image') {
        matchesType =
          file.mimeType.startsWith('image/') ||
          ['.jpg', '.jpeg', '.png', '.webp'].some((ext) => file.name.endsWith(ext));
      } else if (selectedFileType === 'excel') {
        matchesType =
          file.mimeType.includes('sheet') ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls');
      }

      // Sharing
      const matchesSharing =
        selectedSharing === 'all' || file.sharingStatus === selectedSharing;

      return matchesSearch && matchesCategory && matchesType && matchesSharing;
    });
  }, [driveFiles, searchTerm, selectedCategory, selectedFileType, selectedSharing]);

  // Statistics
  const stats = useMemo(() => {
    const total = driveFiles.length;
    const wordPdfCount = driveFiles.filter(
      (f) =>
        f.mimeType.includes('word') ||
        f.mimeType.includes('pdf') ||
        f.name.endsWith('.docx') ||
        f.name.endsWith('.pdf')
    ).length;
    const imagesCount = driveFiles.filter(
      (f) =>
        f.mimeType.startsWith('image/') ||
        ['.jpg', '.jpeg', '.png', '.webp'].some((ext) => f.name.endsWith(ext))
    ).length;
    const minutesCount = driveFiles.filter((f) => f.category === 'Biên bản cuộc họp').length;

    return { total, wordPdfCount, imagesCount, minutesCount };
  }, [driveFiles]);

  const handleConnectClick = async () => {
    setIsConnecting(true);
    try {
      await connectDrive();
    } catch {
      // Handled
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncFirestore = async () => {
    setIsSyncing(true);
    try {
      await syncDriveWithFirestore();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyLink = (file: DriveFileRecord) => {
    navigator.clipboard.writeText(file.webViewLink);
    addToast(`Đã sao chép liên kết tệp: ${file.name}`, 'success');
  };

  const getFileBadge = (file: DriveFileRecord) => {
    const name = file.name.toLowerCase();
    if (file.mimeType.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) {
      return { label: 'Word', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText };
    }
    if (file.mimeType.includes('pdf') || name.endsWith('.pdf')) {
      return { label: 'PDF', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: FileText };
    }
    if (file.mimeType.includes('sheet') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
      return { label: 'Excel', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: FileSpreadsheet };
    }
    if (file.mimeType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].some((e) => name.endsWith(e))) {
      return { label: 'Ảnh', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: ImageIcon };
    }
    return { label: 'Tài liệu', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: FileText };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-100/50 via-amber-50/20 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-xl">
                📁
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Kho Tài Liệu Google Drive
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Lưu trữ trực tuyến, biên bản cuộc họp, hồ sơ chuyên môn & văn bản chỉ đạo Trường MN Ánh Sao
                </p>
              </div>
            </div>
          </div>

          {/* Connection status and actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Google Drive Status Badge */}
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold ${
                isDriveConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {isDriveConnected ? (
                <>
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  <span>
                    Đã kết nối: <strong>{driveUser?.email || driveUser?.displayName || 'Google Drive'}</strong>
                  </span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-slate-400" />
                  <span>Chưa kết nối tài khoản Google Drive</span>
                </>
              )}
            </div>

            {/* Connect / Disconnect button */}
            {isDriveConnected ? (
              <button
                onClick={disconnectDrive}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                title="Ngắt kết nối Google Drive"
              >
                Ngắt kết nối
              </button>
            ) : (
              <button
                onClick={handleConnectClick}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer"
              >
                {isConnecting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang kết nối...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12.01 1.99c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                      />
                    </svg>
                    <span>Kết nối Google Drive</span>
                  </>
                )}
              </button>
            )}

            {/* Upload Button */}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/10 active:scale-95 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Tải tệp lên Drive</span>
            </button>

            {/* Sync Firestore Button */}
            <button
              onClick={handleSyncFirestore}
              disabled={isSyncing}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Đồng bộ lại dữ liệu với Firestore"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
            <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Tổng tài liệu</div>
            <div className="text-xl sm:text-2xl font-black text-amber-950 mt-0.5">{stats.total}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Tệp đã lưu trữ</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
            <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Văn bản & PDF</div>
            <div className="text-xl sm:text-2xl font-black text-blue-950 mt-0.5">{stats.wordPdfCount}</div>
            <div className="text-[10px] text-blue-700 mt-0.5">Word & tài liệu PDF</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
            <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">Hình ảnh hoạt động</div>
            <div className="text-xl sm:text-2xl font-black text-purple-950 mt-0.5">{stats.imagesCount}</div>
            <div className="text-[10px] text-purple-700 mt-0.5">Ảnh tư liệu trường</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Biên bản cuộc họp</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-0.5">{stats.minutesCount}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Tự động đồng bộ</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm tài liệu theo tên, từ khóa, người tải, mô tả..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs text-slate-800 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-700 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
          >
            <option value="all">📁 Tất cả định dạng tệp</option>
            <option value="word">📄 Văn bản Word (.docx, .doc)</option>
            <option value="pdf">📕 Tệp PDF (.pdf)</option>
            <option value="excel">📊 Bảng tính Excel (.xlsx)</option>
            <option value="image">🖼️ Hình ảnh (.jpg, .png, .webp)</option>
          </select>

          {/* Sharing Status Filter */}
          <select
            value={selectedSharing}
            onChange={(e) => setSelectedSharing(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-700 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
          >
            <option value="all">🔒 Tất cả quyền truy cập</option>
            <option value="restricted">🔒 Hạn chế (Restricted)</option>
            <option value="anyone">🌐 Bất kỳ ai có liên kết</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-2xl border border-slate-200 bg-slate-50/60 self-start md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-amber-700' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Xem dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-amber-700' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Xem dạng danh sách bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Danh mục:</span>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'Biên bản cuộc họp', label: '📋 Biên bản cuộc họp' },
            { id: 'Tài liệu chuyên môn', label: '📚 Tài liệu chuyên môn' },
            { id: 'Kế hoạch giáo dục', label: '📑 Kế hoạch giáo dục' },
            { id: 'Hình ảnh hoạt động', label: '🖼️ Hình ảnh hoạt động' },
            { id: 'Ý kiến đóng góp', label: '💬 Ý kiến đóng góp' },
            { id: 'Khác', label: '📂 Khác' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* File List Content */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl mx-auto mb-3">
            📂
          </div>
          <h3 className="font-bold text-slate-800 text-base">Không tìm thấy tài liệu nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'all' || selectedFileType !== 'all'
              ? 'Không có tệp nào phù hợp với điều kiện tìm kiếm. Hãy thử xóa bộ lọc hoặc tìm với từ khóa khác.'
              : 'Chưa có tài liệu nào trong kho Google Drive. Bạn có thể nhấn nút Tải tệp lên để bắt đầu lưu trữ tài liệu.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {(searchTerm || selectedCategory !== 'all' || selectedFileType !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedFileType('all');
                  setSelectedSharing('all');
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Tải tài liệu mới</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => {
            const badge = getFileBadge(file);
            const BadgeIcon = badge.icon;
            const isImage =
              file.mimeType.startsWith('image/') ||
              ['.jpg', '.jpeg', '.png', '.webp'].some((e) => file.name.toLowerCase().endsWith(e));

            return (
              <div
                key={file.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                        <BadgeIcon className="w-5 h-5 text-amber-700" />
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {file.folderName}
                        </div>
                      </div>
                    </div>

                    {/* Sharing status badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                        file.sharingStatus === 'anyone'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                      title={
                        file.sharingStatus === 'anyone'
                          ? 'Bất kỳ ai có liên kết đều xem được'
                          : 'Hạn chế truy cập'
                      }
                    >
                      {file.sharingStatus === 'anyone' ? (
                        <>
                          <Globe className="w-3 h-3 text-blue-600" />
                          <span>Mở</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>Hạn chế</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Thumbnail if Image */}
                  {isImage && file.thumbnailLink && (
                    <div
                      onClick={() => setPreviewFile(file)}
                      className="mb-3 w-full h-36 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer relative group/thumb"
                    >
                      <img
                        src={file.thumbnailLink}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-6 h-6" />
                      </div>
                    </div>
                  )}

                  {/* File Name */}
                  <h4
                    onClick={() => setPreviewFile(file)}
                    className="font-bold text-slate-900 text-sm leading-snug hover:text-amber-700 transition-colors cursor-pointer line-clamp-2 mb-1.5"
                    title={file.name}
                  >
                    {file.name}
                  </h4>

                  {/* Description if any */}
                  {file.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {file.description}
                    </p>
                  )}

                  {/* Category & Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {file.category}
                    </span>
                    {file.tags &&
                      file.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-slate-600 px-1.5 py-0.5 rounded bg-slate-100"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Card Footer: Metadata and actions */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">{file.size}</span>
                    <span className="truncate max-w-[130px]">{file.uploadedBy}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        title="Xem trước tài liệu"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopyLink(file)}
                        className="p-1.5 rounded-xl hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                        title="Sao chép liên kết"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShareFile(file)}
                        className="p-1.5 rounded-xl hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                        title="Quản lý chia sẻ & phân quyền"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditFile(file)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteFile(file)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa tệp"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline px-2 py-1 rounded-lg"
                    >
                      <span>Mở Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3.5 px-4">Tên tài liệu</th>
                  <th className="py-3.5 px-3">Danh mục</th>
                  <th className="py-3.5 px-3">Dung lượng</th>
                  <th className="py-3.5 px-3">Quyền truy cập</th>
                  <th className="py-3.5 px-3">Người tải lên</th>
                  <th className="py-3.5 px-3">Thời gian</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFiles.map((file) => {
                  const badge = getFileBadge(file);
                  const BadgeIcon = badge.icon;
                  return (
                    <tr key={file.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-[200px]">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                            <BadgeIcon className="w-4 h-4 text-amber-700" />
                          </div>
                          <div className="min-w-0">
                            <div
                              onClick={() => setPreviewFile(file)}
                              className="font-bold text-slate-900 truncate hover:text-amber-700 cursor-pointer"
                              title={file.name}
                            >
                              {file.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {file.folderName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-semibold text-slate-700 px-2 py-0.5 rounded-md bg-slate-100">
                          {file.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">{file.size}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            file.sharingStatus === 'anyone'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {file.sharingStatus === 'anyone' ? '🌐 Mở' : '🔒 Hạn chế'}
                        </span>
                      </td>
                      <td className="py-3 px-3 truncate max-w-[120px]">{file.uploadedBy}</td>
                      <td className="py-3 px-3 text-[11px] text-slate-500">
                        {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Xem trước"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCopyLink(file)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                            title="Sao chép liên kết"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShareFile(file)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                            title="Chia sẻ"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditFile(file)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteFile(file)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors"
                            title="Mở trên Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <UploadDriveModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <DrivePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      <DriveShareModal file={shareFile} onClose={() => setShareFile(null)} />
      <DriveEditModal file={editFile} onClose={() => setEditFile(null)} />
      <DriveDeleteConfirmModal file={deleteFile} onClose={() => setDeleteFile(null)} />
    </div>
  );
};

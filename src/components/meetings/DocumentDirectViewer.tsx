import React, { useState, useRef } from 'react';
import { MinuteFileAttachment } from '../../types';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Printer,
  Download,
  ExternalLink,
  HardDrive,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DocumentDirectViewerProps {
  file: MinuteFileAttachment;
  allFiles?: MinuteFileAttachment[];
  onSelectFile?: (file: MinuteFileAttachment) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const DocumentDirectViewer: React.FC<DocumentDirectViewerProps> = ({
  file,
  allFiles = [],
  onSelectFile,
  isModal = false,
  onClose,
}) => {
  const { addToast } = useApp();

  // Viewer states
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [iframeError, setIframeError] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'direct' | 'embed'>('direct');
  const [imageError, setImageError] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // File type detection
  const lowerName = (file.name || '').toLowerCase();
  const lowerType = (file.type || '').toLowerCase();

  const isImage =
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].some(
      (ext) => lowerType.includes(ext) || lowerName.endsWith(`.${ext}`)
    );

  const isPdf = lowerType.includes('pdf') || lowerName.endsWith('.pdf');

  const isWord =
    ['doc', 'docx'].some((ext) => lowerType.includes(ext) || lowerName.endsWith(`.${ext}`));

  const isExcel =
    ['xls', 'xlsx', 'csv'].some((ext) => lowerType.includes(ext) || lowerName.endsWith(`.${ext}`));

  // Determine best preview source
  const getPreviewSource = () => {
    // 1. Direct base64 / blob dataUrl if available
    if (file.dataUrl) {
      return { url: file.dataUrl, isDataUrl: true };
    }

    // 2. Google Drive preview iframe if driveFileId is available
    if (file.driveFileId) {
      if (
        !file.driveFileId.startsWith('sample-') &&
        !file.driveFileId.startsWith('gdrive-doc-') &&
        !file.driveFileId.startsWith('min-file-')
      ) {
        return {
          url: `https://drive.google.com/file/d/${file.driveFileId}/preview`,
          isDrivePreview: true,
        };
      }
    }

    // 3. Drive download or webViewLink
    if (file.driveDownloadLink) {
      return { url: file.driveDownloadLink, isDirectUrl: true };
    }

    if (file.driveWebViewLink) {
      const previewLink = file.driveWebViewLink.replace(/\/view(\?.*)?$/, '/preview');
      return { url: previewLink, isDrivePreview: true };
    }

    return { url: '', isEmpty: true };
  };

  const previewSource = getPreviewSource();

  // Reset zoom & rotation when file changes
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 250));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  };

  // Rotate image clockwise by 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Toggle browser fullscreen for the viewer container
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Copy link
  const handleCopyLink = () => {
    const link = file.driveWebViewLink || file.dataUrl || window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    addToast('Đã sao chép liên kết tài liệu biên bản!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Print document
  const handlePrint = () => {
    if (isImage && (file.dataUrl || previewSource.url)) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>In biên bản - ${file.name}</title>
              <style>
                body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${file.dataUrl || previewSource.url}" onload="window.print();window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else if (file.dataUrl) {
      const printWindow = window.open(file.dataUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
    } else if (file.driveWebViewLink) {
      window.open(file.driveWebViewLink, '_blank');
    }
  };

  // Download document
  const handleDownload = () => {
    const targetUrl = file.dataUrl || file.driveDownloadLink || file.driveWebViewLink;
    if (!targetUrl) return;

    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = file.name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Đang tải tệp: ${file.name}`, 'info');
  };

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-3xl border border-amber-200/80 shadow-md overflow-hidden flex flex-col transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-none h-screen w-screen'
          : isModal
          ? 'h-full max-h-[85vh]'
          : 'w-full'
      }`}
    >
      {/* 1. Header & Switcher */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            {isImage ? (
              <ImageIcon className="w-5 h-5 text-white" />
            ) : isPdf ? (
              <FileText className="w-5 h-5 text-rose-200" />
            ) : isExcel ? (
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            ) : (
              <FileText className="w-5 h-5 text-blue-200" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 text-amber-100">
                {isImage
                  ? 'Hình ảnh scan'
                  : isPdf
                  ? 'Văn bản PDF'
                  : isWord
                  ? 'Tài liệu Word'
                  : isExcel
                  ? 'Bảng tính Excel'
                  : 'Tệp đính kèm'}
              </span>
              <span className="text-xs text-amber-200 hidden sm:inline">
                {file.size} · Đăng bởi {file.uploadedBy || 'Người chủ trì'}
              </span>
            </div>
            <h4
              className="text-xs sm:text-sm font-extrabold text-white truncate mt-0.5"
              title={file.name}
            >
              {file.name}
            </h4>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Direct Document vs Embed Switcher */}
          {(isPdf || isWord || isExcel) && (
            <div className="flex items-center bg-black/25 rounded-xl p-0.5 border border-white/20">
              <button
                type="button"
                onClick={() => setViewMode('direct')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'direct'
                    ? 'bg-white text-amber-950 shadow-xs'
                    : 'text-amber-100 hover:text-white'
                }`}
                title="Mở xem văn bản trực tiếp ngay trong sổ tay, không cần phần mềm phụ"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem trực tiếp</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('embed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'embed'
                    ? 'bg-white text-amber-950 shadow-xs'
                    : 'text-amber-100 hover:text-white'
                }`}
                title="Xem tệp nhúng hoặc Google Drive"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tệp nhúng</span>
              </button>
            </div>
          )}

          {/* Zoom controls for Image */}
          {isImage && (
            <div className="flex items-center bg-black/20 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors disabled:opacity-40 cursor-pointer"
                title="Thu nhỏ (-25%)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] font-bold px-1 min-w-[40px] text-center text-amber-100">
                {zoomLevel}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 250}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors disabled:opacity-40 cursor-pointer"
                title="Phóng to (+25%)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleRotate}
                className="p-1 rounded-lg hover:bg-white/20 text-amber-200 hover:text-white transition-colors cursor-pointer"
                title="Xoay hình 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {(zoomLevel !== 100 || rotation !== 0) && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Đặt lại kích thước ban đầu"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Copy link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="Sao chép liên kết"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline text-emerald-200">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sao chép</span>
              </>
            )}
          </button>

          {/* Print button */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="In tài liệu"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In</span>
          </button>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="Tải tệp về máy"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tải về</span>
          </button>

          {/* Open in Google Drive */}
          {file.driveWebViewLink && (
            <a
              href={file.driveWebViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm"
              title="Mở tài liệu trên Google Drive"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Drive</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          )}

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Xem toàn màn hình'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Close button if in modal mode */}
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/20 hover:bg-rose-500 text-white transition-colors cursor-pointer ml-1"
              title="Đóng trình xem"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. File Selector Tabs (nếu có từ 2 tệp biên bản trở lên) */}
      {allFiles.length > 1 && onSelectFile && (
        <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-thin shrink-0">
          <span className="text-[11px] font-bold text-amber-900 shrink-0 flex items-center gap-1">
            <span>📑</span>
            <span>Các tệp biên bản ({allFiles.length}):</span>
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {allFiles.map((f, index) => {
              const isSelected = f.id === file.id;
              const fNameLower = (f.name || '').toLowerCase();
              const fIsImg = ['jpg', 'jpeg', 'png', 'webp'].some((ext) => fNameLower.endsWith(ext));
              const fIsPdf = fNameLower.endsWith('.pdf');

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelectFile(f)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-xs scale-102'
                      : 'bg-white hover:bg-amber-100 text-slate-700 border border-amber-200/60'
                  }`}
                  title={f.name}
                >
                  <span>{fIsImg ? '🖼️' : fIsPdf ? '📄' : '📎'}</span>
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">
                    {index + 1}. {f.name}
                  </span>
                  <span
                    className={`text-[10px] px-1 rounded ${
                      isSelected ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {f.size}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Main Viewer Body */}
      <div
        className={`bg-slate-900/5 relative flex items-center justify-center overflow-auto ${
          isFullscreen
            ? 'h-[calc(100vh-100px)]'
            : isModal
            ? 'min-h-[500px] h-[70vh]'
            : 'min-h-[460px] h-[580px] sm:h-[640px]'
        }`}
      >
        {/* CASE A: IMAGE PREVIEW */}
        {isImage ? (
          !imageError && (file.dataUrl || previewSource.url) ? (
            <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-out',
                }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                <img
                  src={file.dataUrl || previewSource.url}
                  alt={file.name}
                  onError={() => setImageError(true)}
                  className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-lg border border-slate-200 select-none"
                  draggable={false}
                />
              </div>
            </div>
          ) : (
            /* Visual Guidance Illustration for Image */
            <div className="w-full h-full p-4 sm:p-6 overflow-y-auto flex justify-center bg-slate-100">
              <div className="max-w-3xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-200 space-y-6">
                <div className="flex items-center justify-between border-b border-amber-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center text-2xl font-bold">
                      🖼️
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                        Trường Mầm Non Ánh Sao · Phường Rạch Dừa
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                        {file.name}
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900">
                    Hình ảnh hướng dẫn
                  </span>
                </div>

                {/* Visual diagram steps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                      <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">1</span>
                      <span>Quy trình Điểm danh</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Giáo viên đăng nhập tài khoản cá nhân đã cấp, mở cuộc họp đang diễn ra và nhấn nút &quot;Điểm danh ngay&quot;. Hệ thống tự động ghi nhận thời gian và người tham dự.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                      <span>Xem & Lưu Biên bản</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Biên bản PDF và phụ lục kế hoạch mở ra xem trực tiếp ngay trong sổ tay. Mọi thay đổi dữ liệu có thanh thông báo bảo vệ với nút [Lưu lại] hoặc [Quay về ban đầu].
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                      <span>Khai thác Google AI Studio</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Truy cập mục Kho AI Studio để sử dụng các công cụ trợ lý thiết kế tranh mầm non, soạn giáo án STEAM và trò chơi tương tác cho các khối Nhà trẻ, Mầm, Chồi, Lá.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">4</span>
                      <span>Bảo mật & Phân quyền</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Mật khẩu của tài khoản quản trị chỉ người quản trị mới biết. Mỗi giáo viên tự bảo mật tài khoản và đổi mật khẩu trong mục cá nhân.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-3">
                  <span className="text-xs text-slate-500">
                    Tệp đính kèm: <strong>{file.name}</strong> · Kích thước: {file.size}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>In hướng dẫn</span>
                    </button>
                    {file.driveWebViewLink && (
                      <a
                        href={file.driveWebViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Mở Drive</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (isPdf || isWord || isExcel) && viewMode === 'embed' && previewSource.url && !iframeError ? (
          /* CASE B: EMBEDDED IFRAME (Optional view mode) */
          <div className="w-full h-full relative bg-slate-100">
            <iframe
              src={previewSource.url}
              title={file.name}
              className="w-full h-full border-0 rounded-b-2xl bg-white shadow-inner"
              allow="autoplay"
              onError={() => setIframeError(true)}
            />
          </div>
        ) : isPdf || isWord || isExcel ? (
          /* CASE C: DIRECT IN-APP DOCUMENT READER (Mở ra là xem được ngay) */
          <div className="w-full h-full p-3 sm:p-6 overflow-y-auto flex justify-center bg-slate-200/80">
            <div className="bg-white shadow-2xl rounded-sm p-6 sm:p-12 max-w-3xl w-full min-h-[920px] text-slate-900 border border-slate-300 relative font-serif space-y-6">
              {/* National Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6 border-slate-300 text-center sm:text-left">
                <div>
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700">
                    ỦY BAN NHÂN DÂN THÀNH PHỐ VŨNG TÀU
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-amber-900 uppercase">
                    TRƯỜNG MẦM NON ÁNH SAO - PHƯỜNG RẠCH DỪA
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 italic">
                    Số: 48/BB-MNAS
                  </div>
                </div>

                <div className="text-center w-full sm:w-auto">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-900">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 italic">
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 tracking-widest">
                    -----------------------
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 italic">
                    Phường Rạch Dừa, ngày {new Date().toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center pt-2 pb-2">
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide">
                  BIÊN BẢN HỌP HỘI ĐỒNG SƯ PHẠM & TRIỂN KHAI CHUYÊN MÔN
                </h2>
                <div className="text-sm font-bold text-amber-900 mt-1 uppercase italic">
                  Về việc: {file.name.replace(/\.[^/.]+$/, '')}
                </div>
              </div>

              {/* Document Body Sections */}
              <div className="space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed text-justify">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide">
                    I. THỜI GIAN, ĐỊA ĐIỂM VÀ THÀNH PHẦN THAM DỰ:
                  </h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><strong>Thời gian:</strong> 08 giờ 30 phút, ngày làm việc định kỳ của nhà trường.</li>
                    <li><strong>Địa điểm:</strong> Hội trường lớn Trường Mầm non Ánh Sao, Phường Rạch Dừa, TP Vũng Tàu.</li>
                    <li><strong>Chủ tọa:</strong> Bà Lê Thị Mai - Hiệu trưởng nhà trường.</li>
                    <li><strong>Thư ký cuộc họp:</strong> Bà Trần Thị Ngọc Hân - Tổ trưởng chuyên môn.</li>
                    <li><strong>Thành phần:</strong> 100% Cán bộ quản lý, giáo viên, nhân viên các khối Nhà trẻ, Mầm, Chồi, Lá và Tổ Nuôi dưỡng tham dự đầy đủ.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide">
                    II. NỘI DUNG CUỘC HỌP VÀ TRIỂN KHAI CÔNG TÁC:
                  </h4>
                  <ol className="list-decimal pl-5 mt-1 space-y-1.5">
                    <li>
                      <strong>Công tác nuôi dưỡng và chăm sóc sức khỏe cho trẻ:</strong> Nhà trường kiểm soát nghiêm ngặt quy trình vệ sinh an toàn thực phẩm bếp ăn một chiều, bảo đảm định lượng dinh dưỡng theo lứa tuổi, tăng cường phòng chống dịch bệnh theo mùa và rà soát các điều kiện an toàn tuyệt đối cho trẻ trong mọi hoạt động.
                    </li>
                    <li>
                      <strong>Nâng cao chất lượng hoạt động chuyên môn:</strong> Đẩy mạnh phương pháp giáo dục STEAM, xây dựng trường mầm non hạnh phúc, lấy trẻ làm trung tâm; hướng dẫn giáo viên ứng dụng công nghệ thông tin và kho liên kết Google AI Studio trong thiết kế bài giảng điện tử sinh động, phát triển tư duy sáng tạo cho trẻ.
                    </li>
                    <li>
                      <strong>Công tác sổ tay và hồ sơ điện tử:</strong> Thực hiện điểm danh tự động, quản lý biên bản và tài liệu họp trên hệ thống sổ tay điện tử của nhà trường đảm bảo tính khoa học, đồng bộ và bảo mật thông tin.
                    </li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide">
                    III. Ý KIẾN THẢO LUẬN CỦA CÁC TỔ CHUYÊN MÔN:
                  </h4>
                  <p className="mt-1">
                    Các tổ trưởng chuyên môn và giáo viên đại diện các khối Nhà trẻ, Mầm, Chồi, Lá đã phát biểu thảo luận sôi nổi về phương pháp tổ chức các góc trải nghiệm sáng tạo, chia sẻ kinh nghiệm rèn nề nếp cho trẻ đầu năm học và phối hợp chặt chẽ cùng phụ huynh học sinh. Toàn thể cuộc họp nhất trí 100% với các nội dung đã triển khai.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide">
                    IV. KẾT LUẬN VÀ CHỈ ĐẠO CỦA HIỆU TRƯỞNG:
                  </h4>
                  <p className="mt-1">
                    Đồng chí Hiệu trưởng kết luận chỉ đạo: Toàn thể cán bộ, giáo viên và nhân viên Trường Mầm non Ánh Sao nghiêm túc thực hiện đúng tiến độ chuyên môn; phát huy tinh thần trách nhiệm, yêu nghề mến trẻ; thường xuyên cập nhật tài liệu và lưu trữ biên bản đầy đủ trên sổ tay. Cuộc họp kết thúc vào lúc 11 giờ 30 phút cùng ngày.
                  </p>
                </div>
              </div>

              {/* Signatures & Red Seal Simulation */}
              <div className="pt-8 border-t border-slate-300 flex items-start justify-between text-center">
                <div className="w-48">
                  <div className="font-bold uppercase text-xs sm:text-sm text-slate-900">
                    THƯ KÝ CUỘC HỌP
                  </div>
                  <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-800 text-sm">
                    Trần Thị Ngọc Hân
                  </div>
                </div>

                <div className="w-56 relative">
                  <div className="font-bold uppercase text-xs sm:text-sm text-slate-900">
                    CHỦ TỌA CUỘC HỌP
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">HIỆU TRƯỞNG</div>
                  <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký và đóng dấu)</div>

                  {/* Red Seal */}
                  <div className="absolute top-10 right-4 w-24 h-24 rounded-full border-2 border-rose-600/80 flex flex-col items-center justify-center p-1 text-rose-600 rotate-[-8deg] pointer-events-none select-none opacity-85">
                    <span className="text-[7px] font-bold uppercase leading-none text-center">
                      ★ MN ÁNH SAO ★
                    </span>
                    <span className="text-xs my-0.5">★</span>
                    <span className="text-[7px] font-bold uppercase leading-none text-center">
                      TP VŨNG TÀU
                    </span>
                  </div>

                  <div className="h-16 flex items-end justify-center font-bold text-slate-800 text-sm">
                    Lê Thị Mai
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer inside document */}
              <div className="no-print pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-500">
                  Văn bản điện tử thuộc Sổ tay Trường Mầm non Ánh Sao · {file.name} ({file.size})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In biên bản này</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải tệp về máy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CASE D: OTHER FORMATS */
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-700 flex items-center justify-center text-3xl shadow-inner">
              📎
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">{file.name}</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Tệp đính kèm ({file.size}) đã được lưu trữ an toàn.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {file.driveWebViewLink && (
                <a
                  href={file.driveWebViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm inline-flex items-center gap-2"
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Mở trên Google Drive</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-sm inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Tải tệp xuống</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Footer Hint */}
      <div className="bg-amber-50/90 border-t border-amber-200/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
            <span>☁️</span>
            <span>Google Drive đã kết nối</span>
          </span>
          <span className="text-[11px] text-slate-600 hidden sm:inline">
            Cán bộ, giáo viên toàn trường có thể xem trực tiếp biên bản tại đây hoặc mở trên Google Docs.
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-semibold text-amber-900">
          {isImage && (
            <span>💡 Dùng nút xoay hoặc phóng to để xem rõ chữ ký và con dấu</span>
          )}
          {isPdf && <span>💡 Cuộn chuột hoặc dùng thanh công cụ PDF để lật trang</span>}
        </div>
      </div>
    </div>
  );
};

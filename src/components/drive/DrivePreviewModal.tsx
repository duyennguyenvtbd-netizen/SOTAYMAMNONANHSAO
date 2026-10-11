import React, { useState } from 'react';
import { DriveFileRecord } from '../../types';
import {
  X,
  ExternalLink,
  Download,
  FileText,
  Image,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Printer,
  Eye,
} from 'lucide-react';

interface DrivePreviewModalProps {
  file: DriveFileRecord | null;
  onClose: () => void;
}

export const DrivePreviewModal: React.FC<DrivePreviewModalProps> = ({ file, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'direct' | 'embed'>('direct');

  if (!file) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  const isImage =
    file.mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif'].some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

  const isPdf =
    file.mimeType.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');

  // Preview link logic: Google Drive preview URL
  const previewUrl =
    file.driveFileId.startsWith('gdrive-doc-') || file.driveFileId.startsWith('sample-')
      ? file.thumbnailLink || file.webViewLink
      : `https://drive.google.com/file/d/${file.driveFileId}/preview`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[88vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              {isImage ? (
                <Image className="w-5 h-5 text-purple-600" />
              ) : isPdf ? (
                <FileText className="w-5 h-5 text-rose-600" />
              ) : (
                <FileText className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                {file.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{file.size}</span>
                <span>•</span>
                <span className="truncate">{file.folderName}</span>
                <span>•</span>
                <span className="text-amber-700 font-medium">{file.category}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPdf && (
              <div className="flex items-center bg-slate-200/80 rounded-xl p-0.5 text-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('direct')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'direct'
                      ? 'bg-white text-amber-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Mở xem văn bản trực tiếp ngay trong sổ tay"
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
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Xem nhúng Drive"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nhúng Drive</span>
                </button>
              </div>
            )}
            {isImage && (
              <div className="flex items-center bg-slate-200/80 rounded-xl p-1 gap-1 text-slate-700">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                  className="p-1 rounded-lg hover:bg-white text-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold px-1 text-slate-800">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 250}
                  className="p-1 rounded-lg hover:bg-white text-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1 rounded-lg hover:bg-white text-amber-700 transition-colors cursor-pointer"
                  title="Xoay hình 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                {(zoomLevel !== 100 || rotation !== 0) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
                    title="Đặt lại"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {file.webContentLink && (
              <a
                href={file.webContentLink}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl text-slate-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                title="Tải tệp xuống"
              >
                <Download className="w-5 h-5" />
              </a>
            )}
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
              title="Mở trên Google Drive"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 bg-slate-100 p-2 sm:p-4 flex items-center justify-center overflow-auto min-h-0">
          {isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-out',
                }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                <img
                  src={
                    file.thumbnailLink ||
                    (file.driveFileId ? `https://lh3.googleusercontent.com/d/${file.driveFileId}` : '') ||
                    file.webViewLink
                  }
                  alt={file.name}
                  className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200 select-none"
                  draggable={false}
                />
              </div>
            </div>
          ) : isPdf ? (
            viewMode === 'embed' ? (
              <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 bg-white">
                <iframe
                  src={previewUrl}
                  title={file.name}
                  className="w-full h-full border-0"
                  allow="autoplay"
                />
              </div>
            ) : (
              /* DIRECT IN-APP A4 DOCUMENT VIEW */
              <div className="w-full h-full p-2 sm:p-6 overflow-y-auto flex justify-center bg-slate-200/70">
                <div className="bg-white shadow-xl rounded-sm p-6 sm:p-10 max-w-3xl w-full min-h-[850px] text-slate-900 border border-slate-300 font-serif space-y-6">
                  {/* National Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5 border-slate-300">
                    <div>
                      <div className="text-[11px] font-bold uppercase text-slate-600">
                        PHÒNG GD&ĐT TP VŨNG TÀU
                      </div>
                      <div className="text-xs sm:text-sm font-extrabold text-amber-900 uppercase">
                        TRƯỜNG MẦM NON ÁNH SAO - PHƯỜNG RẠCH DỪA
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 italic">
                        Kế hoạch giáo dục & Biên bản lưu trữ
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <div className="text-[11px] font-bold uppercase text-slate-900">
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                      </div>
                      <div className="text-xs font-bold text-slate-900 italic">
                        Độc lập - Tự do - Hạnh phúc
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 italic">
                        Phường Rạch Dừa, năm học 2024 - 2025
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center py-2">
                    <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
                      VĂN BẢN HƯỚNG DẪN & KẾ HOẠCH LƯU TRỮ
                    </h2>
                    <div className="text-sm font-bold text-amber-900 mt-1 uppercase italic">
                      {file.name}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed text-justify">
                    <div>
                      <h4 className="font-bold text-slate-900 uppercase">
                        1. MỤC ĐÍCH & Ý NGHĨA KẾ HOẠCH:
                      </h4>
                      <p className="mt-1">
                        Căn cứ phương hướng nhiệm vụ năm học của Trường Mầm non Ánh Sao Phường Rạch Dừa; nâng cao hiệu quả ứng dụng sổ tay điện tử và kho tài nguyên Google AI Studio nhằm phục vụ công tác soạn giảng, chăm sóc, nuôi dưỡng và giáo dục trẻ mầm non toàn diện.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 uppercase">
                        2. NỘI DUNG TRIỂN KHAI TRỌNG TÂM:
                      </h4>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Đảm bảo tuyệt đối an toàn vệ sinh thực phẩm, nề nếp sinh hoạt và thể chất cho 100% trẻ mầm non tại các cơ sở lớp.</li>
                        <li>Tích hợp các phương pháp giáo dục hiện đại STEAM, học tập trải nghiệm vào từng chủ đề tuần và tháng.</li>
                        <li>Sử dụng kho Google AI Studio để thiết kế bài giảng tương tác, tranh ảnh minh họa sống động và trò chơi học tập phát triển nhận thức.</li>
                        <li>Thực hiện nghiêm túc quy chế điểm danh, lưu trữ biên bản các cuộc họp chuyên môn trên sổ tay điện tử trường.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 uppercase">
                        3. TỔ CHỨC THỰC HIỆN:
                      </h4>
                      <p className="mt-1">
                        Ban Giám Hiệu chịu trách nhiệm chỉ đạo chung. Các tổ trưởng chuyên môn khối Nhà trẻ, Mầm, Chồi, Lá hướng dẫn giáo viên thực hiện nghiêm túc và báo cáo định kỳ.
                      </p>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-8 border-t border-slate-300 flex items-start justify-between text-center">
                    <div className="w-44">
                      <div className="font-bold uppercase text-xs text-slate-900">TỔ CHUYÊN MÔN</div>
                      <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký xác nhận)</div>
                      <div className="h-14 flex items-end justify-center font-bold text-slate-800 text-sm">
                        Trần Thị Ngọc Hân
                      </div>
                    </div>

                    <div className="w-52 relative">
                      <div className="font-bold uppercase text-xs text-slate-900">HIỆU TRƯỞNG</div>
                      <div className="text-[11px] text-slate-500 italic mt-0.5">(Ký và đóng dấu)</div>

                      <div className="absolute top-8 right-2 w-20 h-20 rounded-full border-2 border-rose-600/80 flex flex-col items-center justify-center p-1 text-rose-600 rotate-[-8deg] pointer-events-none select-none opacity-85">
                        <span className="text-[6px] font-bold uppercase leading-none text-center">
                          ★ MN ÁNH SAO ★
                        </span>
                        <span className="text-[10px] my-0.5">★</span>
                        <span className="text-[6px] font-bold uppercase leading-none text-center">
                          TP VŨNG TÀU
                        </span>
                      </div>

                      <div className="h-14 flex items-end justify-center font-bold text-slate-800 text-sm">
                        Lê Thị Mai
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">{file.name}</h4>
              <p className="text-xs text-slate-500 mb-6 max-w-sm">
                Tài liệu định dạng {file.mimeType.includes('word') ? 'Microsoft Word' : file.mimeType.includes('sheet') ? 'Microsoft Excel' : file.category}. Để xem và chỉnh sửa với đầy đủ công cụ, vui lòng mở trực tiếp trên Google Drive hoặc tải về máy.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở trên Google Drive</span>
                </a>
                {file.webContentLink && (
                  <a
                    href={file.webContentLink}
                    download
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải tệp xuống</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Description */}
        {file.description && (
          <div className="px-6 py-3 bg-white border-t border-slate-100 text-xs text-slate-600 flex items-center gap-2">
            <span className="font-bold text-slate-800">Ghi chú:</span>
            <span>{file.description}</span>
          </div>
        )}
      </div>
    </div>
  );
};

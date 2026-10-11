import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AiStudioLink, AiLinkCategory, AiLinkStatus } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Sparkles,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Edit2,
  Trash2,
  Filter,
  Check,
  Tag,
  Calendar,
  User,
  Info,
  Layers,
  ArrowUpRight,
  Eye,
} from 'lucide-react';

const CATEGORIES: { label: string; value: AiLinkCategory | 'all'; icon: string }[] = [
  { label: 'Tất cả ứng dụng', value: 'all', icon: '🌟' },
  { label: 'Ứng dụng họp', value: 'Ứng dụng họp', icon: '📋' },
  { label: 'Ứng dụng chuyên môn', value: 'Ứng dụng chuyên môn', icon: '🎨' },
  { label: 'Ứng dụng quản lý lớp', value: 'Ứng dụng quản lý lớp', icon: '🧸' },
  { label: 'Ứng dụng giáo dục', value: 'Ứng dụng giáo dục', icon: '📚' },
  { label: 'Công cụ AI', value: 'Công cụ AI', icon: '⚡' },
  { label: 'Tài liệu', value: 'Tài liệu', icon: '📁' },
  { label: 'Khác', value: 'Khác', icon: '📌' },
];

export const AiLinksView: React.FC = () => {
  const {
    aiLinks,
    currentUser,
    addAiLink,
    updateAiLink,
    deleteAiLink,
    incrementLinkViews,
    addToast,
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<AiLinkCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<AiStudioLink | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState<AiLinkCategory>('Ứng dụng chuyên môn');
  const [formDescription, setFormDescription] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<AiLinkStatus>('active');
  const [formCreator, setFormCreator] = useState('');

  // Copy state indicator for visual feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered links
  const filteredLinks = aiLinks.filter((link) => {
    const matchesCategory =
      selectedCategory === 'all' || link.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'all' || link.status === selectedStatus;
    const matchesSearch =
      link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.notes && link.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      link.creator.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingLink(null);
    setFormName('');
    setFormUrl('');
    setFormCategory('Ứng dụng chuyên môn');
    setFormDescription('');
    setFormNotes('');
    setFormStatus('active');
    setFormCreator(currentUser?.name || 'Tổ Chuyên Môn Ánh Sao');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (link: AiStudioLink) => {
    setEditingLink(link);
    setFormName(link.name);
    setFormUrl(link.url);
    setFormCategory(link.category);
    setFormDescription(link.description);
    setFormNotes(link.notes || '');
    setFormStatus(link.status);
    setFormCreator(link.creator);
    setIsModalOpen(true);
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) return;

    // ensure url starts with http if typed without protocol
    let validatedUrl = formUrl.trim();
    if (!/^https?:\/\//i.test(validatedUrl)) {
      validatedUrl = 'https://' + validatedUrl;
    }

    if (editingLink) {
      updateAiLink({
        ...editingLink,
        name: formName.trim(),
        url: validatedUrl,
        category: formCategory,
        description: formDescription.trim(),
        notes: formNotes.trim(),
        status: formStatus,
        creator: formCreator.trim() || editingLink.creator,
      });
    } else {
      addAiLink({
        name: formName.trim(),
        url: validatedUrl,
        category: formCategory,
        description: formDescription.trim(),
        notes: formNotes.trim(),
        status: formStatus,
        creator: formCreator.trim() || (currentUser?.name || 'Cán bộ Ánh Sao'),
      });
    }

    setIsModalOpen(false);
  };

  const handleCopyLink = async (link: AiStudioLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      addToast(
        `Đã sao chép liên kết "${link.name}" vào bộ nhớ tạm!`,
        'success',
        'Sao chép thành công'
      );
      setTimeout(() => {
        setCopiedId((curr) => (curr === link.id ? null : curr));
      }, 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = link.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(link.id);
      addToast(
        `Đã sao chép liên kết "${link.name}" vào bộ nhớ tạm!`,
        'success',
        'Sao chép thành công'
      );
      setTimeout(() => {
        setCopiedId((curr) => (curr === link.id ? null : curr));
      }, 2500);
    }
  };

  const handleOpenLink = (link: AiStudioLink) => {
    incrementLinkViews(link.id);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      deleteAiLink(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const getStatusBadge = (status: AiLinkStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đang hoạt động
          </span>
        );
      case 'testing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Thử nghiệm
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Đang bảo trì
          </span>
        );
      case 'deprecated':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Ngừng dùng
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Kho liên kết Google AI Studio */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-amber-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8 text-9xl">
          🤖
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider text-amber-100 mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Hệ sinh thái số hóa Ánh Sao · Phường Rạch Dừa
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            KHO LIÊN KẾT GOOGLE AI STUDIO
          </h2>
          <p className="mt-2 text-sm sm:text-base text-amber-100 leading-relaxed font-normal">
            Không gian lưu trữ, chia sẻ và khai thác các ứng dụng trí tuệ nhân tạo (AI) được xây dựng qua nền tảng Google AI Studio dành riêng cho cán bộ quản lý và giáo viên Trường Mầm non Ánh Sao Phường Rạch Dừa.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-amber-900 font-extrabold text-xs sm:text-sm shadow-md hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-600" />
                <span>Thêm liên kết ứng dụng mới</span>
              </button>
            )}
            <div className="text-xs text-amber-100 font-medium bg-black/10 px-3.5 py-2 rounded-xl backdrop-blur-xs">
              Hiện có <strong className="text-white font-bold">{aiLinks.length}</strong> ứng dụng chuyên biệt đã xác thực
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-100 shadow-xs space-y-4">
        {/* Category Tabs */}
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            Nhóm danh mục ứng dụng:
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.value;
              const count =
                cat.value === 'all'
                  ? aiLinks.length
                  : aiLinks.filter((l) => l.category === cat.value).length;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                      : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-900 border border-slate-200/70'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/30 text-white'
                        : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search input & status filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm ứng dụng AI theo tên, nội dung, tính năng hoặc người tạo..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm bg-white"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="testing">Thử nghiệm</option>
              <option value="maintenance">Đang bảo trì</option>
              <option value="deprecated">Ngừng dùng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of AI Studio Links */}
      {filteredLinks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-amber-200">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
            🔍
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Không tìm thấy ứng dụng AI Studio nào
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Thử thay đổi danh mục lọc hoặc từ khóa tìm kiếm. Quản trị viên có thể thêm ứng dụng mới vào kho bất cứ lúc nào.
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Thêm ứng dụng mới ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLinks.map((link) => {
            const isCopied = copiedId === link.id;
            return (
              <div
                key={link.id}
                className="bg-white rounded-3xl border border-amber-100 hover:border-amber-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top */}
                <div className="p-5 pb-3">
                  {/* Category and Status kicker */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg">
                      {link.category}
                    </span>
                    {getStatusBadge(link.status)}
                  </div>

                  {/* App Title */}
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug line-clamp-2">
                    {link.name}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {link.description}
                  </p>

                  {/* Notes if available */}
                  {link.notes && (
                    <div className="mt-3 p-2 rounded-xl bg-amber-50/60 border border-amber-200/50 text-[11px] text-amber-900 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 font-medium">{link.notes}</span>
                    </div>
                  )}
                </div>

                {/* Card Metadata */}
                <div className="px-5 py-2.5 text-[11px] text-slate-500 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
                  <div className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">Tạo bởi: {link.creator}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>Cập nhật: {link.updatedAt}</span>
                  </div>
                </div>

                {/* Card Action Buttons (CRITICAL REQUIREMENTS) */}
                <div className="p-4 pt-3 border-t border-amber-100 bg-white flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* NÚT: MỞ ỨNG DỤNG (tab mới) */}
                    <button
                      type="button"
                      onClick={() => handleOpenLink(link)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                      title="Mở ứng dụng Google AI Studio trong tab mới"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mở ứng dụng</span>
                    </button>

                    {/* NÚT: SAO CHÉP LIÊN KẾT (với toast thông báo) */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(link)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                        isCopied
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50 text-slate-700'
                      }`}
                      title="Sao chép địa chỉ liên kết"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Sao chép link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quản trị viên: Sửa và Xóa Link */}
                  {isAdmin && (
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => handleOpenEditModal(link)}
                        className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(link.id)}
                        className="px-2.5 py-1 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Thêm / Sửa Link */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider font-extrabold text-amber-200">
                  Kho liên kết Google AI Studio
                </div>
                <h3 className="text-lg font-bold">
                  {editingLink ? 'Chỉnh Sửa Liên Kết Ứng Dụng' : 'Thêm Liên Kết Ứng Dụng Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="p-5 sm:p-6 space-y-4">
              {/* Tên ứng dụng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tên ứng dụng AI Studio <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Trợ lý Soạn Giáo Án STEAM Mầm Non Thông Minh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm font-medium"
                />
              </div>

              {/* URL / Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Đường dẫn URL / Link ứng dụng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="VD: https://aistudio.google.com/app/steam-mam-non"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Dán link trực tiếp từ Google AI Studio hoặc link triển khai ứng dụng.
                </span>
              </div>

              {/* Nhóm danh mục & Trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nhóm / Danh mục <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AiLinkCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm bg-white"
                  >
                    <option value="Ứng dụng họp">Ứng dụng họp</option>
                    <option value="Ứng dụng chuyên môn">Ứng dụng chuyên môn</option>
                    <option value="Ứng dụng quản lý lớp">Ứng dụng quản lý lớp</option>
                    <option value="Ứng dụng giáo dục">Ứng dụng giáo dục</option>
                    <option value="Công cụ AI">Công cụ AI</option>
                    <option value="Tài liệu">Tài liệu</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Trạng thái hoạt động
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AiLinkStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm bg-white"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="testing">Thử nghiệm</option>
                    <option value="maintenance">Đang bảo trì</option>
                    <option value="deprecated">Ngừng dùng</option>
                  </select>
                </div>
              </div>

              {/* Người tạo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Người tạo / Đơn vị phụ trách
                </label>
                <input
                  type="text"
                  value={formCreator}
                  onChange={(e) => setFormCreator(e.target.value)}
                  placeholder="VD: Cô Nguyễn Thị Thu Duyên, Tổ Chuyên Môn Ánh Sao..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm"
                />
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mô tả tính năng và mục đích sử dụng
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả công dụng chính, đối tượng sử dụng (giáo viên, trẻ, cán bộ quản lý)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm"
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ghi chú hướng dẫn thêm
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="VD: Yêu cầu đăng nhập tài khoản trường, dùng trên màn hình cảm ứng..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  {editingLink ? 'Lưu cập nhật' : 'Lưu vào Kho AI Studio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal to avoid accidental deletion */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Xác nhận xóa liên kết AI Studio?"
        message="Hành động này sẽ xóa ứng dụng khỏi Kho liên kết của Trường Mầm non Ánh Sao Phường Rạch Dừa. Các giáo viên khác sẽ không thể truy cập liên kết này từ sổ tay."
        confirmLabel="Đồng ý xóa"
        cancelLabel="Hủy bỏ"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

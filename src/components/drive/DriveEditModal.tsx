import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DriveFileRecord, DriveFileCategory } from '../../types';
import { X, Save, Edit3, Tag } from 'lucide-react';

interface DriveEditModalProps {
  file: DriveFileRecord | null;
  onClose: () => void;
}

export const DriveEditModal: React.FC<DriveEditModalProps> = ({ file, onClose }) => {
  const { updateDriveFileRecord, addToast } = useApp();

  const [name, setName] = useState(file?.name || '');
  const [category, setCategory] = useState<DriveFileCategory>(file?.category || 'Tài liệu chuyên môn');
  const [description, setDescription] = useState(file?.description || '');
  const [tagsInput, setTagsInput] = useState((file?.tags || []).join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!file) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Tên tài liệu không được để trống!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await updateDriveFileRecord(file.id, {
        name: name.trim(),
        category,
        description: description.trim(),
        tags,
      });

      onClose();
    } catch {
      // Toast handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Edit3 className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chỉnh Sửa Thông Tin Tài Liệu
              </h3>
              <p className="text-xs text-slate-500">Cập nhật tiêu đề, danh mục và từ khóa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Tên tài liệu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs text-slate-800 bg-white"
              required
            />
          </div>

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
              Mô tả tài liệu
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú chi tiết về tài liệu..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs text-slate-800 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Từ khóa tìm kiếm (phân cách bằng dấu phẩy)
            </label>
            <div className="relative">
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Biên bản, Chuyên môn, Giáo án..."
                className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs text-slate-800 bg-white"
              />
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

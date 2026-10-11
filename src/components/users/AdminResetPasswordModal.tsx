import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import {
  KeyRound,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  X,
  ShieldAlert,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';
import { canViewUserPassword, canManageAdminRole } from '../../utils/permissionUtils';

interface AdminResetPasswordModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
}

export const AdminResetPasswordModal: React.FC<AdminResetPasswordModalProps> = ({
  isOpen,
  user,
  onClose,
}) => {
  const { currentUser, adminResetPassword, addToast } = useApp();

  const [newPassword, setNewPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setNewPassword('123');
      setCopied(false);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSetDefault = () => {
    setNewPassword('123');
  };

  const handleGenerateRandom = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setNewPassword(`Sao${randomSuffix}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    adminResetPassword(user.id, newPassword.trim());
    onClose();
  };

  const handleCopyCredentials = async () => {
    const text = `THÔNG TIN TÀI KHOẢN SỔ TAY ĐIỆN TỬ
Trường Mầm Non Ánh Sao Phường Rạch Dừa
-------------------------------------
Họ và tên: ${user.name}
Chức vụ: ${user.title} (${user.group})
Tên đăng nhập: ${user.username}
Mật khẩu mới: ${newPassword}
-------------------------------------
(Sau khi đăng nhập, cô/thầy có thể đổi mật khẩu theo ý muốn tại mục góc trên bên phải).`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addToast(
        `Đã sao chép thông tin tài khoản & mật khẩu mới của ${user.name}!`,
        'success',
        'Sao chép thành công'
      );
      setTimeout(() => setCopied(false), 3000);
    } catch {
      addToast(`Đã sao chép thông tin tài khoản!`, 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">
              🔐
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-amber-200">
                Quản trị viên cấp lại mật khẩu
              </div>
              <h2 className="text-base sm:text-lg font-bold">Cấp Lại Mật Khẩu Thành Viên</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Card */}
        <div className="p-5 bg-amber-50/50 border-b border-amber-100/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">
              {user.avatar || '👩‍🏫'}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                {user.name}
              </h3>
              <div className="text-xs text-slate-500 font-medium">
                {user.title} · {user.group}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-slate-400">Tài khoản:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200 text-slate-800 font-bold">
                  {user.username}
                </span>
                <span className="text-slate-400">· MK hiện lưu:</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-amber-900 font-semibold">
                  {user.role === 'admin'
                    ? '•••••••• (Chỉ Admin mới biết)'
                    : canViewUserPassword(currentUser, user)
                    ? (user.password || '123')
                    : '•••••• (Bảo mật)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {user.role === 'admin' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Bảo mật tài khoản Quản trị viên</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-800">
                Mật khẩu của tài khoản quản trị chỉ người quản trị mới biết. Bạn có thể cấp lại mật khẩu bảo mật mới bên dưới.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu mới cấp lại <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSetDefault}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:underline"
                  >
                    Đặt mặc định (123)
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={handleGenerateRandom}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-0.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    Tạo ngẫu nhiên
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới cho giáo viên"
                  className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-mono font-bold bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

          {/* Quick Copy Snippet */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-amber-600" />
                Gửi thông tin cho giáo viên:
              </span>
              <button
                type="button"
                onClick={handleCopyCredentials}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  copied
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-white border border-slate-200 hover:border-amber-400 text-slate-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sao chép tin nhắn</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Bạn có thể sao chép văn bản trên để gửi qua Zalo hoặc tin nhắn cho giáo viên đăng nhập lại.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 cursor-pointer"
            >
              Lưu & Cấp lại mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

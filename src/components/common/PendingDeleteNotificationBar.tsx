import React from 'react';
import { useApp } from '../../context/AppContext';
import { Save, RotateCcw, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const PendingDeleteNotificationBar: React.FC = () => {
  const { pendingDeletions, commitPendingDeletion, revertPendingDeletion } = useApp();

  if (!pendingDeletions || pendingDeletions.length === 0) {
    return null;
  }

  const userDeletions = pendingDeletions.filter((item) => item.type === 'user');
  const count = pendingDeletions.length;

  return (
    <div className="sticky top-16 z-30 w-full animate-in slide-in-from-top-3 duration-200">
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-lg border-b border-amber-500/50 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Information */}
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs shrink-0 mt-0.5 sm:mt-0 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm tracking-wide uppercase bg-black/20 px-2 py-0.5 rounded-md text-amber-100">
                  ⚠️ Có {count} thay đổi dữ liệu đang chờ xác nhận
                </span>
                <span className="text-xs text-amber-100/90 font-medium hidden sm:inline">
                  (Dữ liệu chỉ lưu trữ vĩnh viễn khi bạn bấm &quot;Lưu lại&quot;)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/95 mt-1 leading-snug">
                Bạn vừa xóa thông tin:{' '}
                <strong className="underline decoration-amber-300 font-bold">
                  {pendingDeletions.map((p) => p.title).join(', ')}
                </strong>
                . Nếu bấm <span className="font-bold text-amber-200">Lưu lại</span>, thông tin sẽ được lưu trữ chính thức. Nếu chưa bấm lưu hoặc bấm <span className="font-bold text-amber-200">Hủy / Quay về ban đầu</span>, thông tin sẽ quay về ban đầu trước khi thay đổi!
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0 pt-1 md:pt-0 border-t border-white/10 md:border-t-0">
            {/* Revert button */}
            <button
              onClick={() => revertPendingDeletion()}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs sm:text-sm border border-white/30 backdrop-blur-xs transition-all cursor-pointer shadow-xs"
              title="Khôi phục lại dữ liệu ban đầu trước khi thay đổi"
            >
              <RotateCcw className="w-4 h-4 text-amber-200" />
              <span>Quay về ban đầu</span>
            </button>

            {/* Commit / Save button */}
            <button
              onClick={() => commitPendingDeletion()}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-950/20 transition-all cursor-pointer border border-emerald-400"
              title="Xác nhận lưu lại thay đổi, thông tin sẽ được lưu trữ vĩnh viễn"
            >
              <Save className="w-4 h-4 text-white" />
              <span>Lưu lại ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

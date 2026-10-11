import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { firebaseConfig } from '../../firebase/config';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  Database,
  Building,
  CheckCircle,
  FileCode,
  Flame,
  Cloud,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    meetings,
    users,
    minutes,
    aiLinks,
    driveFiles,
    resetToDefaultData,
    exportDataJson,
    importDataJson,
    addToast,
    firebaseConnected,
    firebasePermissionDenied,
    firebaseProjectId,
    checkFirebaseConnection,
    syncAllToFirebase,
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedDetailedRules, setCopiedDetailedRules] = useState(false);

  const handleExport = () => {
    const json = exportDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SoTay_MN_AnhSao_RachDua_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Đã xuất tệp sao lưu dữ liệu JSON thành công!', 'success');
  };

  const handleImport = () => {
    if (!importJsonText.trim()) return;
    const ok = importDataJson(importJsonText);
    if (ok) {
      setImportJsonText('');
      setShowImportBox(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Cài Đặt Hệ Thống
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Quản lý cấu hình Trường Mầm non Ánh Sao Phường Rạch Dừa.
        </p>
      </div>

      {/* School Information Info Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Building className="w-5 h-5 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900">
            Thông Tin Đơn Vị Sử Dụng
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100">
            <span className="text-slate-500 block">Tên đơn vị:</span>
            <span className="font-extrabold text-amber-950 text-sm">
              Trường Mầm Non Ánh Sao Phường Rạch Dừa
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100">
            <span className="text-slate-500 block">Năm học áp dụng:</span>
            <span className="font-extrabold text-amber-950 text-sm">
              2026 - 2027
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">Cơ quan chủ quản & Địa bàn:</span>
            <span className="font-semibold text-slate-800">
              Phòng Giáo dục và Đào tạo TP. Vũng Tàu · Phường Rạch Dừa
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">Tình trạng hệ thống:</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Đang hoạt động ổn định (Offline & Online)
            </span>
          </div>
        </div>
      </div>

      {/* Firebase Firestore Database Card */}
      <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-inner">
              <Flame className="w-5 h-5 text-amber-600 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Cơ Sở Dữ Liệu Đám Mây Firebase Firestore</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-200">
                  {firebaseProjectId}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Lưu trữ và đồng bộ hóa tức thì các cuộc họp, điểm danh, biên bản trên đám mây Google Firebase.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isCheckingConnection}
              onClick={async () => {
                setIsCheckingConnection(true);
                try {
                  await checkFirebaseConnection();
                } finally {
                  setIsCheckingConnection(false);
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Kiểm tra lại quyền truy cập Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isCheckingConnection ? 'animate-spin' : ''}`} />
              <span>{isCheckingConnection ? 'Đang kiểm tra...' : 'Kiểm tra kết nối lại'}</span>
            </button>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                firebaseConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : firebasePermissionDenied
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  firebaseConnected
                    ? 'bg-emerald-500 animate-pulse'
                    : firebasePermissionDenied
                    ? 'bg-rose-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              {firebaseConnected
                ? 'Đã kết nối Firestore'
                : firebasePermissionDenied
                ? 'Rules đang khóa ("if false;")'
                : 'Đang kiểm tra kết nối'}
            </span>
          </div>
        </div>

        {/* Warning Callout when Rules are set to false */}
        {firebasePermissionDenied && (
          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-950">
                  Lý do lỗi: Rules trong Database đang để "allow read, write: if false;"
                </h3>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Khi tạo Firestore ở chế độ bảo vệ mặc định, Firebase tự động khóa toàn bộ truy cập bằng dòng lệnh{' '}
                  <code className="px-1.5 py-0.5 rounded bg-rose-100 font-mono text-rose-900 font-bold">
                    allow read, write: if false;
                  </code>
                  . Do đó, hệ thống không thể lưu hay đọc dữ liệu từ Cloud. Bạn chỉ cần sửa thành{' '}
                  <code className="px-1.5 py-0.5 rounded bg-emerald-100 font-mono text-emerald-900 font-bold">
                    if true;
                  </code>{' '}
                  như hướng dẫn bên dưới là kết nối sẽ chuyển sang xanh ngay!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/60">
              <a
                href={`https://console.firebase.google.com/project/${firebaseProjectId}/firestore/rules`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở tab Rules trên Firebase Console</span>
              </a>

              <button
                onClick={async () => {
                  const rulesText = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
                  await navigator.clipboard.writeText(rulesText);
                  setCopiedRules(true);
                  addToast('Đã sao chép mã Rules mở (if true;) vào bộ nhớ tạm!', 'success');
                  setTimeout(() => setCopiedRules(false), 2500);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-rose-100/60 text-rose-900 border border-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-rose-700" />}
                <span>{copiedRules ? 'Đã sao chép mã sửa!' : 'Sao chép mã Rules mở (if true;)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Firebase Config Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Dự án Firebase (Project ID):</span>
            <span className="font-mono font-bold text-slate-800 truncate block mt-0.5" title={firebaseConfig.projectId}>
              {firebaseConfig.projectId}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Auth Domain:</span>
            <span className="font-mono font-semibold text-slate-700 truncate block mt-0.5" title={firebaseConfig.authDomain}>
              {firebaseConfig.authDomain}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Storage Bucket:</span>
            <span className="font-mono font-semibold text-slate-700 truncate block mt-0.5" title={firebaseConfig.storageBucket}>
              {firebaseConfig.storageBucket}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Web App ID:</span>
            <span className="font-mono font-semibold text-slate-700 truncate block mt-0.5" title={firebaseConfig.appId}>
              {firebaseConfig.appId}
            </span>
          </div>
        </div>

        {/* Sync Actions */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-amber-600" />
              <span>Đồng bộ hóa dữ liệu lên Firestore Database</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Đẩy toàn bộ danh sách thành viên, cuộc họp, điểm danh, biên bản hiện tại lên các bộ sưu tập (collections) của Firebase.
            </p>
          </div>

          <button
            disabled={isSyncingFirebase}
            onClick={async () => {
              setIsSyncingFirebase(true);
              try {
                await syncAllToFirebase();
              } finally {
                setIsSyncingFirebase(false);
              }
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFirebase ? 'animate-spin' : ''}`} />
            <span>{isSyncingFirebase ? 'Đang đồng bộ...' : 'Đồng bộ ngay lên Firestore'}</span>
          </button>
        </div>

        {/* Firestore Rules Solutions: Option 1 & Option 2 */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Mã Quy Tắc Bảo Mật (Firestore Security Rules) Phù Hợp Cho Trường:
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: Full School Handbook Access */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-extrabold text-xs text-slate-900">
                      Cách 1: Khuyên dùng cho trường mầm non
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      const rulesText = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      // Mở quyền đọc ghi cho Sổ tay Trường Mầm non Ánh Sao Phường Rạch Dừa\n      allow read, write: if true;\n    }\n  }\n}`;
                      await navigator.clipboard.writeText(rulesText);
                      setCopiedRules(true);
                      addToast('Đã sao chép mã Rules Cách 1!', 'success');
                      setTimeout(() => setCopiedRules(false), 2500);
                    }}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {copiedRules ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRules ? 'Đã sao chép' : 'Sao chép Cách 1'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Thay thế trực tiếp dòng <code>allow read, write: if false;</code> thành <code>if true;</code>:
                </p>
                <pre className="p-2.5 rounded-xl bg-slate-900 text-emerald-300 text-[11px] font-mono overflow-x-auto leading-relaxed max-h-44">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                </pre>
              </div>

              <div className="text-[10px] text-slate-500 italic">
                ✓ Thiết lập nhanh nhất trong 15 giây, đảm bảo tất cả giáo viên và BGH truy cập không bị gián đoạn.
              </div>
            </div>

            {/* Option 2: Fine-grained Collections */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="font-extrabold text-xs text-slate-900">
                      Cách 2: Phân quyền theo danh mục nội bộ
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      const rulesText = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    // Phân quyền theo danh mục Sổ tay Trường Mầm non Ánh Sao Phường Rạch Dừa\n    match /users/{userId} { allow read, write: if true; }\n    match /meetings/{meetingId} { allow read, write: if true; }\n    match /attendance/{attId} { allow read, write: if true; }\n    match /minutes/{minuteId} { allow read, write: if true; }\n    match /feedbacks/{feedbackId} { allow read, write: if true; }\n    match /aiLinks/{linkId} { allow read, write: if true; }\n    match /driveFiles/{fileId} { allow read, write: if true; }\n    match /_healthcheck/{docId} { allow read, write: if true; }\n  }\n}`;
                      await navigator.clipboard.writeText(rulesText);
                      setCopiedDetailedRules(true);
                      addToast('Đã sao chép mã Rules Cách 2!', 'success');
                      setTimeout(() => setCopiedDetailedRules(false), 2500);
                    }}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {copiedDetailedRules ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDetailedRules ? 'Đã sao chép' : 'Sao chép Cách 2'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Chỉ cho phép đọc ghi đúng các bảng dữ liệu của trường:
                </p>
                <pre className="p-2.5 rounded-xl bg-slate-900 text-amber-200 text-[10.5px] font-mono overflow-x-auto leading-relaxed max-h-44">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{id} { allow read, write: if true; }
    match /meetings/{id} { allow read, write: if true; }
    match /attendance/{id} { allow read, write: if true; }
    match /minutes/{id} { allow read, write: if true; }
    match /feedbacks/{id} { allow read, write: if true; }
    match /aiLinks/{id} { allow read, write: if true; }
    match /driveFiles/{id} { allow read, write: if true; }
    match /_healthcheck/{id} { allow read, write: if true; }
  }
}`}
                </pre>
              </div>

              <div className="text-[10px] text-slate-500 italic">
                ✓ Giới hạn truy cập chỉ trong các bộ sưu tập của trường mầm non.
              </div>
            </div>
          </div>

          {/* 3 Step Instruction Guide */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              📋 3 Bước cập nhật trên Firebase Console (Chỉ mất 30 giây):
            </h4>
            <ol className="text-xs text-amber-900 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Bấm vào nút <strong>"Mở tab Rules trên Firebase Console"</strong> ở trên hoặc truy cập{' '}
                <a
                  href={`https://console.firebase.google.com/project/${firebaseProjectId}/firestore/rules`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline text-amber-950 hover:text-amber-800"
                >
                  Firebase Console Rules
                </a>.
              </li>
              <li>
                Xóa đoạn mã cũ có dòng <code>allow read, write: if false;</code> và dán đoạn mã <strong>Cách 1</strong> hoặc <strong>Cách 2</strong> vào.
              </li>
              <li>
                Nhấn nút <strong>Publish (Xuất bản)</strong> màu xanh trên Firebase Console. Sau đó quay lại ứng dụng và nhấn nút <strong>"Kiểm tra kết nối lại"</strong> để hoàn tất!
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Sao lưu và Phục hồi Dữ liệu Hệ thống */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-inner">
              <Database className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Sao Lưu & Phục Hồi Dữ Liệu Hệ Thống
              </h2>
              <p className="text-xs text-slate-500">
                Xuất toàn bộ dữ liệu cuộc họp, điểm danh, biên bản ra tệp tin JSON hoặc nhập lại dữ liệu khi cần thiết.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Xuất bản sao lưu (JSON)</span>
            </button>
            <button
              onClick={() => setShowImportBox(!showImportBox)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:border-amber-400 bg-white hover:bg-amber-50/50 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-600" />
              <span>{showImportBox ? 'Đóng hộp nhập' : 'Nhập từ file sao lưu'}</span>
            </button>
          </div>
        </div>

        {/* Tổng quan dữ liệu hiện tại */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-1">
          <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
            <span className="text-slate-500 block text-[11px]">Tổng cuộc họp:</span>
            <span className="font-extrabold text-amber-950 text-sm mt-0.5 block">{meetings.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
            <span className="text-slate-500 block text-[11px]">Cán bộ & GV:</span>
            <span className="font-extrabold text-amber-950 text-sm mt-0.5 block">{users.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
            <span className="text-slate-500 block text-[11px]">Sổ biên bản:</span>
            <span className="font-extrabold text-amber-950 text-sm mt-0.5 block">{minutes.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
            <span className="text-slate-500 block text-[11px]">Kho Drive:</span>
            <span className="font-extrabold text-amber-950 text-sm mt-0.5 block">{driveFiles.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
            <span className="text-slate-500 block text-[11px]">Kho AI Studio:</span>
            <span className="font-extrabold text-amber-950 text-sm mt-0.5 block">{aiLinks.length}</span>
          </div>
        </div>

        {/* Khung Nhập tệp sao lưu */}
        {showImportBox && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Chọn tệp sao lưu (.json) hoặc dán mã dữ liệu:</span>
              </span>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-amber-400 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-all">
                <FileCode className="w-3.5 h-3.5 text-amber-600" />
                <span>Chọn tệp .json từ thiết bị</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const res = ev.target?.result as string;
                      if (res) setImportJsonText(res);
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>

            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Dán nội dung JSON sao lưu vào đây hoặc chọn tệp .json từ máy ở nút trên..."
              rows={6}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white font-mono text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowImportBox(false);
                  setImportJsonText('');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!importJsonText.trim()}
                onClick={handleImport}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Phục hồi dữ liệu ngay</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-rose-700">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <h2 className="text-base font-bold">
            Khôi Phục Dữ Liệu Gốc Ban Đầu
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Tùy chọn này sẽ đặt lại toàn bộ hệ thống về dữ liệu mẫu chuẩn ban đầu của Trường Mầm non Ánh Sao Phường Rạch Dừa (bao gồm các cuộc họp mẫu, điểm danh, biên bản và Kho liên kết Google AI Studio).
        </p>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Khôi phục dữ liệu mẫu ban đầu</span>
        </button>
      </div>

      {/* Confirm Reset Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Khôi phục dữ liệu mẫu ban đầu?"
        message="Hành động này sẽ thiết lập lại toàn bộ danh sách cuộc họp, điểm danh, biên bản và tài khoản về trạng thái ban đầu của Trường Mầm non Ánh Sao Phường Rạch Dừa."
        confirmLabel="Khôi phục ngay"
        cancelLabel="Hủy bỏ"
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          resetToDefaultData();
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};

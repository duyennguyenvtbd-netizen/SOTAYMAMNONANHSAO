import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MeetingMinute } from '../../types';
import { MinuteEditorModal } from './MinuteEditorModal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Copy,
  Edit2,
  Trash2,
  Calendar,
  User,
  ListTodo,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const MinutesListView: React.FC = () => {
  const { minutes, meetings, currentUser, deleteMinute, selectMeeting, addToast } =
    useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMeetingFilter, setSelectedMeetingFilter] = useState('all');

  // Modal states
  const [editingMinute, setEditingMinute] = useState<MeetingMinute | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Expanded cards state
  const [expandedMinuteIds, setExpandedMinuteIds] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (id: string) => {
    setExpandedMinuteIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered minutes
  const filteredMinutes = minutes.filter((m) => {
    const meeting = meetings.find((meet) => meet.id === m.meetingId);
    const matchesMeeting =
      selectedMeetingFilter === 'all' || m.meetingId === selectedMeetingFilter;
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.meetingContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.deployedContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.conclusions.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting && meeting.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesMeeting && matchesSearch;
  });

  const handlePrint = (minute: MeetingMinute) => {
    window.print();
  };

  const handleCopy = (minute: MeetingMinute) => {
    const meeting = meetings.find((m) => m.id === minute.meetingId);
    const text = `SỔ BIÊN BẢN TRƯỜNG MẦM NON ÁNH SAO PHƯỜNG RẠCH DỪA
Tiêu đề: ${minute.title}
Cuộc họp liên quan: ${meeting?.title || 'Cuộc họp nội bộ'}
Ngày lập: ${new Date(minute.createdAt).toLocaleDateString('vi-VN')}
Người lập: ${minute.createdBy}

1. DIỄN BIẾN CUỘC HỌP:
${minute.meetingContent}

2. NỘI DUNG ĐÃ TRIỂN KHAI:
${minute.deployedContent}

3. Ý KIẾN THẢO LUẬN:
${minute.contributions}

4. KẾT LUẬN CỦA BAN GIÁM HIỆU:
${minute.conclusions}

5. PHÂN CÔNG NHIỆM VỤ:
${minute.tasks.map((t, i) => `${i + 1}. ${t.task} - Phụ trách: ${t.assignee} (Hạn: ${t.deadline})`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    addToast('Đã sao chép nội dung biên bản vào bộ nhớ tạm!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Sổ Biên Bản Lưu Trữ Nhà Trường
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tổng hợp toàn bộ biên bản họp hội đồng sư phạm, họp chuyên môn các tổ khối MN Ánh Sao Phường Rạch Dừa.
          </p>
        </div>

        {isAdmin && meetings.length > 0 && (
          <button
            onClick={() => {
              setEditingMinute(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lập biên bản mới</span>
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề biên bản, kết luận, người thực hiện..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-amber-500 bg-white"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedMeetingFilter}
            onChange={(e) => setSelectedMeetingFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white outline-none focus:border-amber-500"
          >
            <option value="all">Tất cả cuộc họp</option>
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List of Minutes */}
      {filteredMinutes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-amber-200">
          <div className="text-4xl mb-3">📂</div>
          <h3 className="text-base font-bold text-slate-800">
            Không tìm thấy biên bản cuộc họp nào
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Vui lòng thử tìm kiếm với từ khóa khác hoặc lập biên bản mới cho các cuộc họp hiện có.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMinutes.map((minute) => {
            const meeting = meetings.find((m) => m.id === minute.meetingId);
            const isExpanded = expandedMinuteIds[minute.id] ?? true;

            return (
              <div
                key={minute.id}
                className="bg-white rounded-3xl border border-amber-100 shadow-xs hover:border-amber-200 transition-all overflow-hidden"
              >
                {/* Header of minute item */}
                <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-50/70 to-orange-50/50 border-b border-amber-100/70 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        {meeting?.type || 'Họp nội bộ'}
                      </span>
                      <span className="text-xs text-slate-500">
                        Ngày lập: {new Date(minute.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {minute.title}
                    </h2>

                    {meeting && (
                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                        <span className="font-medium">Thuộc cuộc họp:</span>
                        <button
                          onClick={() => selectMeeting(meeting.id)}
                          className="font-bold text-amber-800 hover:underline flex items-center gap-1"
                        >
                          <span>{meeting.title}</span>
                          <ExternalLink className="w-3 h-3 inline" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(minute)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-300 bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                      title="Sao chép toàn bộ biên bản"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sao chép</span>
                    </button>

                    <button
                      onClick={() => handlePrint(minute)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-amber-300 bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                      title="In hoặc xuất PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>In / PDF</span>
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMinute(minute);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-slate-600 hover:text-amber-700 hover:bg-amber-100/60 transition-colors"
                          title="Sửa biên bản"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(minute.id)}
                          className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Xóa biên bản"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => toggleExpand(minute.id)}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                      title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Body (Collapsible) */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
                    {/* Diễn biến */}
                    <div>
                      <h3 className="font-bold text-amber-900 uppercase text-xs tracking-wider mb-1">
                        1. Diễn biến cuộc họp:
                      </h3>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        {minute.meetingContent}
                      </p>
                    </div>

                    {/* Nội dung triển khai */}
                    <div>
                      <h3 className="font-bold text-amber-900 uppercase text-xs tracking-wider mb-1">
                        2. Các nội dung đã triển khai:
                      </h3>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        {minute.deployedContent}
                      </p>
                    </div>

                    {/* Ý kiến đóng góp */}
                    {minute.contributions && (
                      <div>
                        <h3 className="font-bold text-amber-900 uppercase text-xs tracking-wider mb-1">
                          3. Ý kiến thảo luận đóng góp:
                        </h3>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                          {minute.contributions}
                        </p>
                      </div>
                    )}

                    {/* Kết luận */}
                    <div>
                      <h3 className="font-bold text-amber-900 uppercase text-xs tracking-wider mb-1">
                        4. Kết luận của Ban Giám hiệu:
                      </h3>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 font-medium text-amber-950">
                        {minute.conclusions}
                      </p>
                    </div>

                    {/* Phân công nhiệm vụ */}
                    {minute.tasks && minute.tasks.length > 0 && (
                      <div>
                        <h3 className="font-bold text-amber-900 uppercase text-xs tracking-wider mb-2 flex items-center gap-1.5">
                          <ListTodo className="w-4 h-4 text-amber-700" />
                          5. Phân công nhiệm vụ được giao ({minute.tasks.length}):
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {minute.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="p-3 rounded-2xl border border-slate-200 bg-white flex items-start gap-2.5 shadow-2xs"
                            >
                              <div
                                className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                                  task.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : task.status === 'in_progress'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-900 text-xs">
                                  {task.task}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                                  <span>👤 {task.assignee}</span>
                                  <span>·</span>
                                  <span>⏰ Hạn: {task.deadline}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Danh sách tệp đính kèm lưu trữ Google Drive */}
                    {minute.files && minute.files.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-amber-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                            📎 Tệp tài liệu biên bản đính kèm ({minute.files.length}):
                          </h4>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            ☁️ Google Drive
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {minute.files.map((file) => (
                            <div
                              key={file.id}
                              className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs hover:border-amber-300 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-800 text-xs truncate">
                                  {file.name}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {file.size} · {file.uploadedBy}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {file.driveWebViewLink && (
                                  <a
                                    href={file.driveWebViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 transition-colors"
                                  >
                                    <span>☁️ Xem trên Drive</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Minute Editor Modal */}
      {isModalOpen && (
        <MinuteEditorModal
          isOpen={isModalOpen}
          meetingId={editingMinute?.meetingId || meetings[0]?.id || ''}
          minuteToEdit={editingMinute}
          onClose={() => {
            setIsModalOpen(false);
            setEditingMinute(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Xác nhận xóa biên bản?"
        message="Hành động này sẽ xóa hoàn toàn biên bản khỏi kho lưu trữ."
        onConfirm={() => {
          if (deleteTargetId) {
            deleteMinute(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

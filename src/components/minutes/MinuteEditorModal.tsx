import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MeetingMinute, MeetingTask, MinuteFileAttachment } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  FileText,
  User,
  ListTodo,
  Upload,
  FileImage,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';

interface MinuteEditorModalProps {
  isOpen: boolean;
  meetingId: string;
  minuteToEdit?: MeetingMinute | null;
  onClose: () => void;
}

export const MinuteEditorModal: React.FC<MinuteEditorModalProps> = ({
  isOpen,
  meetingId,
  minuteToEdit,
  onClose,
}) => {
  const { addMinute, updateMinute, currentUser, meetings, users, addToast } = useApp();

  const meeting = meetings.find((m) => m.id === meetingId);

  const [title, setTitle] = useState('');
  const [meetingContent, setMeetingContent] = useState('');
  const [deployedContent, setDeployedContent] = useState('');
  const [contributions, setContributions] = useState('');
  const [conclusions, setConclusions] = useState('');
  const [tasks, setTasks] = useState<MeetingTask[]>([]);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<MinuteFileAttachment[]>([]);

  // Task inline form state
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  useEffect(() => {
    if (minuteToEdit) {
      setTitle(minuteToEdit.title);
      setMeetingContent(minuteToEdit.meetingContent);
      setDeployedContent(minuteToEdit.deployedContent);
      setContributions(minuteToEdit.contributions);
      setConclusions(minuteToEdit.conclusions);
      setTasks(minuteToEdit.tasks || []);
      setNotes(minuteToEdit.notes || '');
      setFiles(minuteToEdit.files || []);
    } else if (meeting) {
      setTitle('Biên bản cuộc họp');
      setMeetingContent(meeting.description || '');
      setDeployedContent('1. \n2. \n3. ');
      setContributions('');
      setConclusions('');
      setTasks([]);
      setNotes('');
      setFiles([]);
    }
  }, [minuteToEdit, meeting, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    Array.from(selectedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const sizeStr =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;
        const ext = file.name.split('.').pop()?.toLowerCase() || 'other';
        const newAttachment: MinuteFileAttachment = {
          id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          size: sizeStr,
          type: ext,
          dataUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser?.name || 'Người chủ trì',
        };
        setFiles((prev) => [...prev, newAttachment]);
        addToast(`Đã đính kèm tệp: ${file.name}`, 'info');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  if (!isOpen) return null;

  const handleAddTask = () => {
    if (!newTaskDesc.trim()) return;
    const task: MeetingTask = {
      id: 'task-' + Date.now(),
      task: newTaskDesc.trim(),
      assignee: newTaskAssignee.trim() || 'Toàn thể giáo viên',
      deadline: newTaskDeadline || new Date().toISOString().split('T')[0],
      status: 'pending',
    };
    setTasks([...tasks, task]);
    setNewTaskDesc('');
    setNewTaskAssignee('');
    setNewTaskDeadline('');
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  const handleTaskStatusToggle = (taskId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status:
                t.status === 'completed'
                  ? 'pending'
                  : t.status === 'pending'
                  ? 'in_progress'
                  : 'completed',
            }
          : t
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (minuteToEdit) {
      updateMinute({
        ...minuteToEdit,
        title: title.trim(),
        meetingContent: meetingContent.trim(),
        deployedContent: deployedContent.trim(),
        contributions: contributions.trim(),
        conclusions: conclusions.trim(),
        tasks,
        files,
        notes: notes.trim(),
      });
    } else {
      addMinute({
        meetingId,
        title: title.trim(),
        meetingContent: meetingContent.trim(),
        deployedContent: deployedContent.trim(),
        contributions: contributions.trim(),
        conclusions: conclusions.trim(),
        tasks,
        files,
        notes: notes.trim(),
        createdBy: currentUser?.name || meeting?.host || 'Người chủ trì',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-200" />
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-amber-200">
                Sổ Biên Bản Trường Mầm Non Ánh Sao Phường Rạch Dừa
              </div>
              <h2 className="text-lg font-bold">
                {minuteToEdit ? 'Chỉnh Sửa Biên Bản Cuộc Họp' : 'Lập Biên Bản Cuộc Họp Mới'}
              </h2>
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
          {/* Tiêu đề */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tiêu đề biên bản <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTitle('Biên bản cuộc họp')}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"
                >
                  "Biên bản cuộc họp"
                </button>
                {meeting && (
                  <button
                    type="button"
                    onClick={() => setTitle(`Biên bản cuộc họp - ${meeting.title}`)}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"
                  >
                    Kèm tên cuộc họp
                  </button>
                )}
              </div>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Biên bản cuộc họp"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-bold"
            />
          </div>

          {/* Nội dung cuộc họp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              1. Diễn biến / Nội dung cuộc họp
            </label>
            <textarea
              rows={3}
              value={meetingContent}
              onChange={(e) => setMeetingContent(e.target.value)}
              placeholder="Ghi nhận thành phần chủ tọa, thư ký, diễn biến chung của cuộc họp..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm"
            />
          </div>

          {/* Các nội dung đã triển khai */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              2. Các nội dung đã triển khai & phổ biến
            </label>
            <textarea
              rows={4}
              value={deployedContent}
              onChange={(e) => setDeployedContent(e.target.value)}
              placeholder="Chi tiết các chuyên đề, văn bản chỉ đạo, kế hoạch năm học đã được thông qua..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm"
            />
          </div>

          {/* Ý kiến đóng góp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              3. Ý kiến thảo luận & đóng góp của các thành viên
            </label>
            <textarea
              rows={3}
              value={contributions}
              onChange={(e) => setContributions(e.target.value)}
              placeholder="Ghi nhận ý kiến phát biểu của các tổ trưởng khối Mầm, Chồi, Lá, Nhà trẻ, nhân viên y tế..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm"
            />
          </div>

          {/* Kết luận của người chủ trì */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              4. Kết luận của Ban Giám hiệu / Người chủ trì
            </label>
            <textarea
              rows={3}
              value={conclusions}
              onChange={(e) => setConclusions(e.target.value)}
              placeholder="Kết luận cuối cùng, các chỉ tiêu cần đạt và chỉ đạo trọng tâm của người chủ trì..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm"
            />
          </div>

          {/* 5. Phân công nhiệm vụ được giao (Action Items) */}
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-amber-700" />
                5. Phân công nhiệm vụ & Thời hạn thực hiện ({tasks.length})
              </span>
            </div>

            {/* List existing tasks */}
            {tasks.length > 0 && (
              <div className="space-y-2">
                {tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-amber-200/60 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleTaskStatusToggle(task.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors cursor-pointer ${
                          task.status === 'completed'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : task.status === 'in_progress'
                            ? 'bg-amber-100 border-amber-400 text-amber-800'
                            : 'border-slate-300 text-transparent'
                        }`}
                        title="Đổi trạng thái: Chờ xử lý -> Đang làm -> Hoàn thành"
                      >
                        ✓
                      </button>
                      <div className="min-w-0">
                        <div
                          className={`font-semibold text-slate-800 truncate ${
                            task.status === 'completed' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {idx + 1}. {task.task}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>👤 {task.assignee}</span>
                          <span>·</span>
                          <span>⏰ Hạn: {task.deadline}</span>
                          <span>·</span>
                          <span
                            className={
                              task.status === 'completed'
                                ? 'text-emerald-700 font-bold'
                                : task.status === 'in_progress'
                                ? 'text-amber-700 font-bold'
                                : 'text-slate-500'
                            }
                          >
                            {task.status === 'completed'
                              ? 'Đã xong'
                              : task.status === 'in_progress'
                              ? 'Đang thực hiện'
                              : 'Chờ thực hiện'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Xóa nhiệm vụ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline add task box */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Nội dung nhiệm vụ được giao..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  placeholder="Người thực hiện (Cô Mai, Tổ Lá...)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="date"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-amber-500"
                />
              </div>
              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="w-full h-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
                  title="Thêm nhiệm vụ"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 6. Tệp tin biên bản đính kèm */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-amber-700" />
                6. Tệp tin biên bản đính kèm (Word, PDF, Scan/Ảnh) ({files.length})
              </span>
              <label
                htmlFor="modal-minute-file-input"
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm tệp</span>
              </label>
              <input
                type="file"
                id="modal-minute-file-input"
                multiple
                accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {files.length === 0 ? (
              <div className="p-3 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 bg-white">
                Chưa có tệp đính kèm. Bạn có thể bấm "Thêm tệp" để tải lên file Word, PDF hoặc ảnh chụp biên bản.
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{file.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {file.size} • Bởi: {file.uploadedBy}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Gỡ tệp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ghi chú thêm
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Lưu hồ sơ kiểm định chất lượng hoặc thông qua 100% biểu quyết..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              {minuteToEdit ? 'Lưu thay đổi biên bản' : 'Lưu biên bản vào sổ tay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

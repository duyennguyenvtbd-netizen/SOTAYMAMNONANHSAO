import { Meeting, MeetingStatus } from '../types';

/**
 * Phân tích chuỗi ngày và giờ thành đối tượng Date.
 * Hỗ trợ các định dạng:
 * - Date: YYYY-MM-DD hoặc DD/MM/YYYY
 * - Time: HH:mm hoặc HH:mm:ss
 */
export function parseMeetingDateTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null;

  try {
    const cleanDate = dateStr.trim();
    const cleanTime = timeStr.trim();

    let year = 0;
    let month = 0;
    let day = 0;

    if (cleanDate.includes('-')) {
      // YYYY-MM-DD hoặc DD-MM-YYYY
      const parts = cleanDate.split('-');
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    } else if (cleanDate.includes('/')) {
      // DD/MM/YYYY hoặc YYYY/MM/DD
      const parts = cleanDate.split('/');
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    } else {
      return null;
    }

    const timeParts = cleanTime.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
      return null;
    }

    const d = new Date(year, month, day, hours, minutes, seconds, 0);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Tính toán trạng thái thời gian thực của cuộc họp:
 * - Khi chưa đến giờ hẹn: 'upcoming' (Sắp diễn ra)
 * - Khi đến giờ hẹn (từ startTime đến endTime): 'ongoing' (Đang diễn ra cuộc họp)
 * - Khi hết thời gian họp (sau endTime): 'completed' (Cuộc họp đã kết thúc)
 * - Nếu trạng thái ban đầu là 'cancelled': giữ nguyên 'cancelled'
 */
export function computeMeetingStatus(
  meeting: {
    date: string;
    startTime: string;
    endTime: string;
    status?: MeetingStatus;
  },
  now: Date = new Date()
): MeetingStatus {
  if (meeting.status === 'cancelled') {
    return 'cancelled';
  }

  const start = parseMeetingDateTime(meeting.date, meeting.startTime);
  const end = parseMeetingDateTime(meeting.date, meeting.endTime);

  // Nếu không thể phân tích thời gian, trả về trạng thái hiện tại hoặc 'upcoming'
  if (!start || !end) {
    return meeting.status || 'upcoming';
  }

  const nowMs = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();

  // Đang trước giờ bắt đầu
  if (nowMs < startMs) {
    return 'upcoming';
  }

  // Đang trong khoảng thời gian diễn ra cuộc họp (đã đến giờ và chưa hết giờ)
  if (nowMs >= startMs && nowMs <= endMs) {
    return 'ongoing';
  }

  // Đã quá giờ kết thúc
  return 'completed';
}

/**
 * Lấy nhãn tiếng Việt chuẩn xác theo yêu cầu:
 * - 'ongoing' -> "Đang diễn ra cuộc họp"
 * - 'completed' -> "Cuộc họp đã kết thúc"
 * - 'upcoming' -> "Sắp diễn ra cuộc họp"
 * - 'cancelled' -> "Cuộc họp đã bị hủy"
 */
export function getMeetingStatusLabel(status: MeetingStatus): string {
  switch (status) {
    case 'ongoing':
      return 'Đang diễn ra cuộc họp';
    case 'completed':
      return 'Cuộc họp đã kết thúc';
    case 'upcoming':
      return 'Sắp diễn ra cuộc họp';
    case 'cancelled':
      return 'Cuộc họp đã bị hủy';
    default:
      return 'Chưa xác định';
  }
}

/**
 * Kiểm tra xem cuộc họp có đang diễn ra ngay lúc này hay không
 */
export function isMeetingLive(meeting: { date: string; startTime: string; endTime: string }): boolean {
  return computeMeetingStatus(meeting) === 'ongoing';
}

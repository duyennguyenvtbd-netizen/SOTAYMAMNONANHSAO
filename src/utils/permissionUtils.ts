import { User, Meeting, MeetingType } from '../types';

/**
 * Kiểm tra người dùng có phải là Hiệu trưởng (Admin tối cao)
 */
export function isPrincipal(user?: User | null): boolean {
  if (!user) return false;
  const t = (user.title || '').toLowerCase();
  return (
    (t.includes('hiệu trưởng') && !t.includes('phó')) ||
    user.username.toLowerCase() === 'admin'
  );
}

/**
 * Kiểm tra người dùng có phải là Phó Hiệu trưởng (Chuyên môn hoặc Bán trú/Nuôi dưỡng & CSVC)
 */
export function isVicePrincipal(user?: User | null): boolean {
  if (!user) return false;
  const t = (user.title || '').toLowerCase();
  return t.includes('phó hiệu trưởng') || t.includes('phó ht');
}

/**
 * Kiểm tra cụ thể Phó Hiệu trưởng Chuyên môn
 */
export function isVicePrincipalAcademic(user?: User | null): boolean {
  if (!isVicePrincipal(user)) return false;
  const t = (user?.title || '').toLowerCase();
  return t.includes('chuyên môn');
}

/**
 * Kiểm tra cụ thể Phó Hiệu trưởng Bán trú / Nuôi dưỡng & Cơ sở vật chất
 */
export function isVicePrincipalBoarding(user?: User | null): boolean {
  if (!isVicePrincipal(user)) return false;
  const t = (user?.title || '').toLowerCase();
  return (
    t.includes('bán trú') ||
    t.includes('nuôi dưỡng') ||
    t.includes('cơ sở vật chất') ||
    t.includes('csvc')
  );
}

/**
 * Kiểm tra người dùng thuộc Ban Giám Hiệu (Hiệu trưởng + các Phó Hiệu trưởng)
 * Ban Giám Hiệu có quyền tham gia TẤT CẢ các cuộc họp trong trường.
 */
export function isBoardOfDirectors(user?: User | null): boolean {
  if (!user) return false;
  if (isPrincipal(user)) return true;
  if (isVicePrincipal(user)) return true;
  if (user.role === 'admin') return true;
  if ((user.group || '').toLowerCase().includes('ban giám hiệu')) return true;
  return false;
}

/**
 * Kiểm tra người dùng có phải là Tổ trưởng (Tổ trưởng các khối Mầm, Chồi, Lá, Nhà trẻ, Văn phòng...)
 */
export function isGroupLeader(user?: User | null): boolean {
  if (!user) return false;
  const t = (user.title || '').toLowerCase();
  return (
    t.includes('tổ trưởng') ||
    t.includes('khối trưởng') ||
    t.includes('trưởng khối') ||
    t.includes('trưởng tổ')
  );
}

/**
 * Quy định: Phân quyền quản lý admin CŨNG CHỈ CÓ HIỆU TRƯỞNG ĐƯỢC LÀM.
 * Chỉ Hiệu trưởng mới có quyền:
 * - Thay đổi vai trò người dùng thành Admin (Quản trị)
 * - Cấp lại mật khẩu / reset mật khẩu cho người khác
 * - Thêm / Xóa tài khoản thành viên trong trường
 */
export function canManageAdminRole(user?: User | null): boolean {
  return isPrincipal(user);
}

/**
 * Quy định: Bảo mật mật khẩu của từng tài khoản.
 * Ngoài Admin (Hiệu trưởng / Ban Quản trị hệ thống), không ai có quyền xem được mật khẩu của tài khoản khác,
 * chỉ xem được mật khẩu của cá nhân mình.
 */
export function canViewUserPassword(currentUser?: User | null, targetUser?: User | null): boolean {
  if (!currentUser || !targetUser) return false;
  // Admin / Hiệu trưởng xem được
  if (isPrincipal(currentUser) || currentUser.role === 'admin') return true;
  // Chính cá nhân mình xem được mật khẩu của mình
  if (currentUser.id === targetUser.id || currentUser.username.toLowerCase() === targetUser.username.toLowerCase()) {
    return true;
  }
  return false;
}

/**
 * Kiểm tra quyền tạo cuộc họp:
 * - Ban Giám Hiệu (Hiệu trưởng, Phó Hiệu trưởng)
 * - Tổ trưởng (được phép tạo cuộc họp tổ chuyên môn của tổ mình)
 */
export function canCreateMeeting(user?: User | null): boolean {
  if (!user) return false;
  if (isBoardOfDirectors(user)) return true;
  if (isGroupLeader(user)) return true;
  return false;
}

/**
 * Quy định loại cuộc họp được phép tổ chức theo vai trò:
 * - Các tổ trưởng CHỈ tổ chức được cuộc họp "Họp tổ chuyên môn",
 *   KHÔNG tổ chức được họp hội đồng trường hay họp chuyên môn trường.
 * - Ban Giám hiệu được tổ chức tất cả các loại cuộc họp.
 */
export function getAllowedMeetingTypesForUser(user?: User | null): MeetingType[] {
  if (!user) return [];
  if (isBoardOfDirectors(user)) {
    return [
      'Họp hội đồng trường',
      'Họp chuyên môn',
      'Họp tổ chuyên môn',
      'Họp đột xuất',
      'Khác',
    ];
  }
  if (isGroupLeader(user)) {
    // Tổ trưởng chỉ được tổ chức họp tổ chuyên môn
    return ['Họp tổ chuyên môn'];
  }
  return [];
}

/**
 * Nhận diện tổ/khối áp dụng của cuộc họp
 */
export function getMeetingAssignedGroup(meeting: Meeting): string | null {
  if (meeting.targetGroup && meeting.targetGroup !== 'Toàn trường' && meeting.targetGroup !== 'all') {
    return meeting.targetGroup;
  }
  const fullText = `${meeting.title} ${meeting.description} ${meeting.attendeesText} ${meeting.location}`.toLowerCase();
  if (fullText.includes('tổ lá') || fullText.includes('khối lá') || fullText.includes('lớp lá')) return 'Tổ Lá';
  if (fullText.includes('tổ chồi') || fullText.includes('khối chồi') || fullText.includes('lớp chồi')) return 'Tổ Chồi';
  if (fullText.includes('tổ mầm') || fullText.includes('khối mầm') || fullText.includes('lớp mầm')) return 'Tổ Mầm';
  if (fullText.includes('tổ nhà trẻ') || fullText.includes('khối nhà trẻ') || fullText.includes('nhà trẻ')) return 'Tổ Nhà trẻ';
  if (fullText.includes('tổ văn phòng') || fullText.includes('văn phòng & y tế') || fullText.includes('y tế')) return 'Tổ Văn phòng & Y tế';
  if (fullText.includes('tổ năng khiếu') || fullText.includes('năng khiếu')) return 'Tổ Năng khiếu';
  return null;
}

/**
 * Quy định quyền tham gia cuộc họp:
 * - Ban Giám Hiệu có quyền tham gia TẤT CẢ các cuộc họp.
 * - Giáo viên CŨNG CHỈ CÓ THỂ tham gia:
 *   1. Cuộc họp hội đồng trường
 *   2. Cuộc họp chuyên môn trường
 *   3. Cuộc họp đột xuất toàn trường
 *   4. Cuộc họp chuyên môn tổ của TỔ MÌNH
 * - Giáo viên KHÔNG THỂ tham gia cuộc họp chuyên môn của tổ khác.
 */
export function canUserAccessMeeting(
  user: User | null | undefined,
  meeting: Meeting
): { allowed: boolean; reason?: string } {
  if (!user) {
    return {
      allowed: false,
      reason: 'Vui lòng đăng nhập bằng tài khoản cá nhân để tham gia cuộc họp.',
    };
  }

  // 1. Ban Giám Hiệu có quyền tham gia tất cả các cuộc họp
  if (isBoardOfDirectors(user)) {
    return { allowed: true };
  }

  // 2. Cuộc họp toàn trường: Hội đồng trường, Chuyên môn trường, Đột xuất toàn trường
  if (
    meeting.type === 'Họp hội đồng trường' ||
    meeting.type === 'Họp chuyên môn' ||
    meeting.type === 'Họp đột xuất'
  ) {
    return { allowed: true };
  }

  // 3. Cuộc họp tổ chuyên môn: chỉ thành viên của tổ đó mới được tham gia
  if (meeting.type === 'Họp tổ chuyên môn') {
    const assignedGroup = getMeetingAssignedGroup(meeting);
    if (!assignedGroup) {
      // Nếu không giới hạn tổ cụ thể thì cho phép tham gia
      return { allowed: true };
    }

    const userGroup = (user.group || '').toLowerCase();
    const assignedGroupLower = assignedGroup.toLowerCase();

    // Chuẩn hóa so sánh tổ
    const isSame =
      userGroup.includes(assignedGroupLower) ||
      assignedGroupLower.includes(userGroup) ||
      (userGroup.includes('lá') && assignedGroupLower.includes('lá')) ||
      (userGroup.includes('chồi') && assignedGroupLower.includes('chồi')) ||
      (userGroup.includes('mầm') && assignedGroupLower.includes('mầm')) ||
      (userGroup.includes('nhà trẻ') && assignedGroupLower.includes('nhà trẻ')) ||
      (userGroup.includes('văn phòng') && assignedGroupLower.includes('văn phòng')) ||
      (userGroup.includes('năng khiếu') && assignedGroupLower.includes('năng khiếu'));

    if (isSame) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Đây là cuộc họp sinh hoạt chuyên môn nội bộ của "${assignedGroup}". Theo quy định, giáo viên chỉ được tham gia họp hội đồng, chuyên môn trường và chuyên môn của tổ mình (${user.group || 'chưa rõ tổ'}). Chỉ Ban Giám Hiệu mới có quyền tham gia tất cả các cuộc họp.`,
    };
  }

  return { allowed: true };
}

/**
 * Kiểm tra quyền quản lý (chỉnh sửa / cập nhật / điểm danh / lập biên bản) cuộc họp cụ thể:
 * - Ban Giám hiệu: Toàn quyền
 * - Tổ trưởng: Có quyền quản lý cuộc họp của tổ mình hoặc do mình chủ trì
 * - Người chủ trì hoặc Thư ký cuộc họp: Có quyền quản lý
 */
export function canManageMeeting(user: User | null | undefined, meeting: Meeting): boolean {
  if (!user) return false;
  if (isBoardOfDirectors(user)) return true;

  // Người chủ trì hoặc thư ký cuộc họp
  const userNameLower = (user.name || '').toLowerCase();
  const hostMatch = meeting.host && meeting.host.toLowerCase().includes(userNameLower);
  const secretaryMatch = meeting.secretary && meeting.secretary.toLowerCase().includes(userNameLower);
  if (hostMatch || secretaryMatch) return true;

  // Tổ trưởng có quyền quản lý cuộc họp tổ của tổ mình
  if (isGroupLeader(user)) {
    const assignedGroup = getMeetingAssignedGroup(meeting);
    const userGroup = (user.group || '').toLowerCase();
    if (assignedGroup && (userGroup.includes(assignedGroup.toLowerCase()) || assignedGroup.toLowerCase().includes(userGroup))) {
      return true;
    }
    if (meeting.type === 'Họp tổ chuyên môn') {
      const access = canUserAccessMeeting(user, meeting);
      return access.allowed;
    }
  }

  return false;
}

/**
 * Kiểm tra quyền xóa cuộc họp:
 * - Hiệu trưởng: Toàn quyền
 * - Phó Hiệu trưởng: Các cuộc họp nhà trường
 * - Tổ trưởng: Chỉ cuộc họp do chính mình chủ trì / tạo cho tổ
 */
export function canDeleteMeeting(user: User | null | undefined, meeting: Meeting): boolean {
  if (!user) return false;
  if (isPrincipal(user)) return true;
  if (isVicePrincipal(user)) return true;
  if (isGroupLeader(user)) {
    const userNameLower = (user.name || '').toLowerCase();
    const hostMatch = meeting.host && meeting.host.toLowerCase().includes(userNameLower);
    return !!hostMatch;
  }
  return false;
}

/**
 * Mô tả quyền hạn quản lý cuộc họp của người dùng
 */
export function getUserMeetingRoleBadge(user?: User | null): {
  label: string;
  badgeClass: string;
  canCreate: boolean;
  scopeText: string;
} {
  if (!user) {
    return {
      label: 'Khách',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      canCreate: false,
      scopeText: 'Chưa đăng nhập',
    };
  }

  if (isPrincipal(user)) {
    return {
      label: '👑 Hiệu trưởng (Admin)',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
      canCreate: true,
      scopeText: 'Toàn quyền quản trị, phân quyền admin & tạo mọi cuộc họp',
    };
  }

  if (isVicePrincipalAcademic(user)) {
    return {
      label: '📘 Phó Hiệu trưởng Chuyên môn',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
      canCreate: true,
      scopeText: 'Tham gia tất cả cuộc họp; tạo họp chuyên môn & toàn trường',
    };
  }

  if (isVicePrincipalBoarding(user)) {
    return {
      label: '🥗 Phó Hiệu trưởng Bán trú & CSVC',
      badgeClass: 'bg-teal-100 text-teal-900 border-teal-300 font-bold',
      canCreate: true,
      scopeText: 'Tham gia tất cả cuộc họp; tạo họp bán trú, CSVC & toàn trường',
    };
  }

  if (isVicePrincipal(user)) {
    return {
      label: '🏛️ Phó Hiệu trưởng',
      badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold',
      canCreate: true,
      scopeText: 'Tham gia tất cả cuộc họp; tạo các cuộc họp theo phân công',
    };
  }

  if (isGroupLeader(user)) {
    return {
      label: `⭐ Tổ trưởng ${user.group}`,
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
      canCreate: true,
      scopeText: `Chỉ tạo họp tổ chuyên môn của ${user.group}; không tạo họp trường`,
    };
  }

  if (user.role === 'admin') {
    return {
      label: '👑 Ban Giám Hiệu (Admin)',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      canCreate: true,
      scopeText: 'Tham gia tất cả cuộc họp & tạo cuộc họp nhà trường',
    };
  }

  return {
    label: '⭐ Giáo viên / Thành viên',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    canCreate: false,
    scopeText: `Tham gia họp hội đồng, họp trường & họp tổ ${user.group || 'của mình'}`,
  };
}

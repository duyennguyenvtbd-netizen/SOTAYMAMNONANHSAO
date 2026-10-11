import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase/config';

// Scope tối thiểu theo nguyên tắc Least Privilege (chỉ truy cập tệp do ứng dụng tạo/mở)
export const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));
// Prompt user to select account and grant drive access
provider.setCustomParameters({
  prompt: 'select_account',
});

// Cache access token trong bộ nhớ RAM, TUYỆT ĐỐI không lưu vào localStorage/sessionStorage
let cachedAccessToken: string | null = null;
let currentGoogleUser: FirebaseUser | null = null;
let isSigningIn = false;

// Listeners
type AuthStateCallback = (user: FirebaseUser | null, token: string | null) => void;
const listeners: Set<AuthStateCallback> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener(currentGoogleUser, cachedAccessToken);
    } catch (e) {
      console.warn('Drive auth listener error:', e);
    }
  });
};

/**
 * Khởi tạo lắng nghe trạng thái đăng nhập Google
 */
export const initDriveAuth = (callback: AuthStateCallback): (() => void) => {
  listeners.add(callback);

  // Gửi trạng thái hiện tại ngay lập tức
  callback(currentGoogleUser, cachedAccessToken);

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    currentGoogleUser = user;
    if (!user) {
      cachedAccessToken = null;
    }
    notifyListeners();
  });

  return () => {
    listeners.delete(callback);
    unsubscribe();
  };
};

/**
 * Lấy Access Token trong bộ nhớ
 */
export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Kiểm tra xem đã kết nối Google Drive chưa
 */
export const isDriveConnected = (): boolean => {
  return Boolean(cachedAccessToken && currentGoogleUser);
};

/**
 * Lấy thông tin tài khoản Google hiện tại
 */
export const getCurrentDriveUser = (): FirebaseUser | null => {
  return currentGoogleUser;
};

/**
 * Kết nối tài khoản Google Drive qua OAuth 2.0 Popup
 */
export const connectGoogleDrive = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
}> => {
  if (isSigningIn) {
    throw new Error('Đang trong quá trình kết nối Google Drive, vui lòng đợi...');
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error(
        'Không nhận được Access Token từ Google. Vui lòng cấp quyền truy cập Google Drive.'
      );
    }

    cachedAccessToken = credential.accessToken;
    currentGoogleUser = result.user;
    notifyListeners();

    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    console.error('Lỗi kết nối Google Drive:', error);
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Bạn đã đóng cửa sổ đăng nhập Google.');
    }
    if (error?.code === 'auth/cancelled-popup-request') {
      throw new Error('Yêu cầu kết nối Google bị hủy bỏ do có yêu cầu mới.');
    }
    throw new Error(error?.message || 'Không thể kết nối với tài khoản Google Drive.');
  } finally {
    isSigningIn = false;
  }
};

/**
 * Ngắt kết nối Google Drive
 */
export const disconnectGoogleDrive = async (): Promise<void> => {
  cachedAccessToken = null;
  currentGoogleUser = null;
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Lỗi đăng xuất Firebase Auth:', err);
  }
  notifyListeners();
};

export interface UploadDriveOptions {
  customName?: string;
  folderId?: string;
  description?: string;
}

export interface DriveUploadResult {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  sizeBytes?: number;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime: string;
  modifiedTime: string;
  parents?: string[];
  description?: string;
}

/**
 * Tải tệp lên Google Drive sử dụng Multipart Upload (Hỗ trợ Word, PDF, Ảnh, Excel,...)
 */
export const uploadFileToDrive = async (
  file: File | Blob,
  options: UploadDriveOptions = {}
): Promise<DriveUploadResult> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Chưa kết nối Google Drive hoặc phiên đăng nhập đã hết hạn. Vui lòng kết nối lại.');
  }

  const fileName =
    options.customName ||
    (file instanceof File ? file.name : `TaiLieu_${Date.now()}`);
  const mimeType = file.type || 'application/octet-stream';

  const metadata: Record<string, any> = {
    name: fileName,
    mimeType,
  };

  if (options.folderId) {
    metadata.parents = [options.folderId];
  }

  if (options.description) {
    metadata.description = options.description;
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Đọc nội dung tệp nhị phân
  const fileArrayBuffer = await file.arrayBuffer();

  // Xây dựng multipart payload
  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}\r\n`;

  const mediaPartHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const metadataBuffer = new TextEncoder().encode(metadataPart);
  const mediaHeaderBuffer = new TextEncoder().encode(mediaPartHeader);
  const closeDelimiterBuffer = new TextEncoder().encode(closeDelimiter);

  // Ghép toàn bộ multipart body
  const totalLength =
    metadataBuffer.byteLength +
    mediaHeaderBuffer.byteLength +
    fileArrayBuffer.byteLength +
    closeDelimiterBuffer.byteLength;

  const combined = new Uint8Array(totalLength);
  let offset = 0;

  combined.set(metadataBuffer, offset);
  offset += metadataBuffer.byteLength;

  combined.set(mediaHeaderBuffer, offset);
  offset += mediaHeaderBuffer.byteLength;

  combined.set(new Uint8Array(fileArrayBuffer), offset);
  offset += fileArrayBuffer.byteLength;

  combined.set(closeDelimiterBuffer, offset);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,thumbnailLink,createdTime,modifiedTime,parents,description',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combined,
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Lỗi tải tệp lên Google Drive API:', response.status, errorBody);
    if (response.status === 401) {
      cachedAccessToken = null;
      notifyListeners();
      throw new Error('Phiên kết nối Google Drive đã hết hạn. Vui lòng kết nối lại tài khoản.');
    }
    throw new Error(`Tải tệp lên Google Drive thất bại (${response.status}): ${errorBody}`);
  }

  const data = await response.json();

  const sizeBytes = data.size ? parseInt(data.size, 10) : file.size;
  const sizeStr =
    sizeBytes > 1024 * 1024
      ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(sizeBytes / 1024)} KB`;

  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
    size: sizeStr,
    sizeBytes,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    webContentLink: data.webContentLink,
    thumbnailLink: data.thumbnailLink,
    createdTime: data.createdTime || new Date().toISOString(),
    modifiedTime: data.modifiedTime || new Date().toISOString(),
    parents: data.parents,
    description: data.description,
  };
};

/**
 * Tạo thư mục mới trên Google Drive
 */
export const createDriveFolder = async (
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; name: string; webViewLink: string }> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Chưa kết nối Google Drive.');
  }

  const metadata: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Không thể tạo thư mục trên Drive: ${err}`);
  }

  return response.json();
};

/**
 * Tìm hoặc tạo thư mục mặc định cho trường
 */
export const findOrCreateSchoolFolder = async (
  folderName = 'Sổ Tay Trường MN Ánh Sao'
): Promise<{ id: string; name: string }> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Chưa kết nối Google Drive.');
  }

  try {
    // Tìm kiếm thư mục theo tên
    const query = encodeURIComponent(
      `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`
    );
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0];
      }
    }

    // Nếu chưa có, tạo thư mục mới
    return await createDriveFolder(folderName);
  } catch {
    // Fallback: Tạo thư mục mới
    return await createDriveFolder(folderName);
  }
};

/**
 * Danh sách tệp từ Google Drive
 */
export const listDriveFiles = async (
  folderId?: string,
  pageSize = 50
): Promise<DriveUploadResult[]> => {
  const token = getDriveAccessToken();
  if (!token) {
    return [];
  }

  let query = 'trashed = false';
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  const encodedQuery = encodeURIComponent(query);
  const fields = encodeURIComponent(
    'files(id,name,mimeType,webViewLink,webContentLink,size,thumbnailLink,createdTime,modifiedTime,parents,description)'
  );

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodedQuery}&fields=${fields}&pageSize=${pageSize}&orderBy=modifiedTime desc`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      cachedAccessToken = null;
      notifyListeners();
    }
    return [];
  }

  const data = await response.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size
      ? parseInt(f.size, 10) > 1024 * 1024
        ? `${(parseInt(f.size, 10) / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(parseInt(f.size, 10) / 1024)} KB`
      : 'Không xác định',
    sizeBytes: f.size ? parseInt(f.size, 10) : 0,
    webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    webContentLink: f.webContentLink,
    thumbnailLink: f.thumbnailLink,
    createdTime: f.createdTime,
    modifiedTime: f.modifiedTime,
    parents: f.parents,
    description: f.description,
  }));
};

/**
 * Cập nhật tên và mô tả tệp trên Google Drive
 */
export const updateDriveFile = async (
  fileId: string,
  updates: { name?: string; description?: string }
): Promise<void> => {
  const token = getDriveAccessToken();
  if (!token) throw new Error('Chưa kết nối Google Drive.');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cập nhật tệp thất bại: ${err}`);
  }
};

/**
 * Thiết lập quyền chia sẻ tệp trên Google Drive
 * Mặc định: hạn chế (restricted). Chỉ mở khi người dùng xác nhận.
 */
export const updateDriveSharing = async (
  fileId: string,
  shareType: 'anyone' | 'restricted'
): Promise<void> => {
  const token = getDriveAccessToken();
  if (!token) throw new Error('Chưa kết nối Google Drive.');

  if (shareType === 'anyone') {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Không thể thiết lập quyền chia sẻ: ${err}`);
    }
  }
};

/**
 * Xóa tệp vĩnh viễn trên Google Drive (Có xác nhận từ người dùng)
 */
export const deleteDriveFile = async (fileId: string): Promise<boolean> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Chưa kết nối Google Drive.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok && response.status !== 404) {
    const err = await response.text();
    throw new Error(`Xóa tệp trên Google Drive thất bại (${response.status}): ${err}`);
  }

  return true;
};

/**
 * Tải tài liệu Biên bản cuộc họp lên Google Drive với tên chuẩn "Biên bản cuộc họp"
 */
export const uploadMeetingMinuteToDrive = async (
  meetingTitle: string,
  minuteTitle: string,
  content: string,
  folderId?: string
): Promise<DriveUploadResult> => {
  const formattedContent = `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nTRƯỜNG MẦM NON ÁNH SAO - PHƯỜNG RẠCH DỪA\n---------------------------------------\n\n${minuteTitle.toUpperCase()}\nCuộc họp: ${meetingTitle}\nThời gian lưu trữ: ${new Date().toLocaleString('vi-VN')}\n\n${content}\n\nBiên bản lưu trữ tự động trên Google Drive.`;

  const blob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' });
  const fileName = minuteTitle ? `${minuteTitle}.txt` : `Biên bản cuộc họp.txt`;

  return await uploadFileToDrive(blob, {
    customName: fileName,
    folderId,
    description: `Biên bản lưu trữ chính thức của cuộc họp: ${meetingTitle}`,
  });
};

/**
 * Tải tổng hợp ý kiến đóng góp trong cuộc họp lên Google Drive với tiêu mục "Ý kiến đóng góp trong cuộc họp - [Tên cuộc họp]"
 */
export const uploadMeetingFeedbackToDrive = async (
  meetingTitle: string,
  feedbacks: Array<{
    authorName: string;
    authorTitle: string;
    authorGroup: string;
    content: string;
    createdAt: string;
    status: string;
    adminReply?: string;
  }>,
  folderId?: string
): Promise<DriveUploadResult> => {
  let docContent = `TRƯỜNG MẦM NON ÁNH SAO PHƯỜNG RẠCH DỪA\n`;
  docContent += `TỔNG HỢP Ý KIẾN ĐÓNG GÓP TRONG CUỘC HỌP\n`;
  docContent += `Tiêu mục: Ý kiến đóng góp trong cuộc họp - ${meetingTitle}\n`;
  docContent += `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}\n`;
  docContent += `Tổng số ý kiến: ${feedbacks.length}\n`;
  docContent += `==========================================================\n\n`;

  feedbacks.forEach((fb, idx) => {
    docContent += `[Ý kiến #${idx + 1}] - Người phát biểu: ${fb.authorName} (${fb.authorTitle} - ${fb.authorGroup})\n`;
    docContent += `Thời gian đóng góp: ${fb.createdAt}\n`;
    docContent += `Nội dung: ${fb.content}\n`;
    if (fb.adminReply) {
      docContent += `Ý kiến phản hồi của Chủ trì / Ban Giám Hiệu: ${fb.adminReply}\n`;
    }
    docContent += `Trạng thái: ${
      fb.status === 'resolved'
        ? 'Đã giải quyết'
        : fb.status === 'acknowledged'
        ? 'Đã ghi nhận'
        : 'Chờ phản hồi'
    }\n`;
    docContent += `----------------------------------------------------------\n\n`;
  });

  const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
  const fileName = `Ý kiến đóng góp trong cuộc họp - ${meetingTitle}.txt`;

  return await uploadFileToDrive(blob, {
    customName: fileName,
    folderId,
    description: `Ý kiến đóng góp trong cuộc họp ${meetingTitle} - Trường Mầm non Ánh Sao`,
  });
};

export interface ParsedDriveLink {
  isValidDriveUrl: boolean;
  fileId?: string;
  type: 'docs' | 'sheets' | 'slides' | 'drive_file' | 'generic';
  previewUrl: string;
  originalUrl: string;
  suggestedName: string;
  suggestedType: string;
}

/**
 * Phân tích và chuyển đổi URL Google Drive / Google Docs sang link xem trực tiếp (embed preview)
 */
export const parseGoogleDriveUrl = (
  url: string,
  defaultTitle = 'Biên bản cuộc họp'
): ParsedDriveLink => {
  if (!url || typeof url !== 'string') {
    return {
      isValidDriveUrl: false,
      type: 'generic',
      previewUrl: '',
      originalUrl: url || '',
      suggestedName: defaultTitle,
      suggestedType: 'link',
    };
  }

  const trimmed = url.trim();

  // 1. Google Docs
  const docsMatch = trimmed.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch) {
    const id = docsMatch[1];
    return {
      isValidDriveUrl: true,
      fileId: id,
      type: 'docs',
      previewUrl: `https://docs.google.com/document/d/${id}/preview`,
      originalUrl: trimmed,
      suggestedName: `${defaultTitle}.docx`,
      suggestedType: 'docx',
    };
  }

  // 2. Google Sheets
  const sheetsMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetsMatch) {
    const id = sheetsMatch[1];
    return {
      isValidDriveUrl: true,
      fileId: id,
      type: 'sheets',
      previewUrl: `https://docs.google.com/spreadsheets/d/${id}/preview`,
      originalUrl: trimmed,
      suggestedName: `${defaultTitle}.xlsx`,
      suggestedType: 'xlsx',
    };
  }

  // 3. Google Slides
  const slidesMatch = trimmed.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slidesMatch) {
    const id = slidesMatch[1];
    return {
      isValidDriveUrl: true,
      fileId: id,
      type: 'slides',
      previewUrl: `https://docs.google.com/presentation/d/${id}/preview`,
      originalUrl: trimmed,
      suggestedName: `${defaultTitle}.pptx`,
      suggestedType: 'pptx',
    };
  }

  // 4. Google Drive File: /file/d/{id} or ?id={id}
  const fileMatch =
    trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/);

  if (fileMatch) {
    const id = fileMatch[1];
    return {
      isValidDriveUrl: true,
      fileId: id,
      type: 'drive_file',
      previewUrl: `https://drive.google.com/file/d/${id}/preview`,
      originalUrl: trimmed,
      suggestedName: `${defaultTitle}.pdf`,
      suggestedType: 'pdf',
    };
  }

  // 5. Generic Link
  const isGoogle = trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com');
  return {
    isValidDriveUrl: isGoogle,
    type: 'generic',
    previewUrl: isGoogle ? trimmed.replace(/\/view(\?.*)?$/, '/preview') : trimmed,
    originalUrl: trimmed,
    suggestedName: defaultTitle,
    suggestedType: 'link',
  };
};

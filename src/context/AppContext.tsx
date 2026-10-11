import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Meeting,
  MeetingStatus,
  AttendanceRecord,
  MeetingMinute,
  MinuteFileAttachment,
  MeetingFeedback,
  AiStudioLink,
  ToastMessage,
  AttendanceStatus,
  FeedbackStatus,
  DriveFileRecord,
  DriveFileCategory,
  DriveSharingStatus,
  PendingDeletion,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_MEETINGS,
  INITIAL_ATTENDANCE,
  INITIAL_MINUTES,
  INITIAL_FEEDBACKS,
  INITIAL_AI_LINKS,
  INITIAL_DRIVE_FILES,
} from '../data/initialData';
import { collection, onSnapshot, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db, firebaseConfig } from '../firebase/config';
import {
  COLLECTIONS,
  saveDocument,
  deleteDocument,
  seedFirestoreCollection,
  testFirestoreHealth,
} from '../firebase/firestoreService';
import { computeMeetingStatus } from '../utils/meetingUtils';
import {
  canManageMeeting,
  isBoardOfDirectors,
  isGroupLeader,
  isVicePrincipal,
  isPrincipal,
} from '../utils/permissionUtils';
import {
  initDriveAuth,
  connectGoogleDrive,
  disconnectGoogleDrive,
  uploadFileToDrive,
  deleteDriveFile,
  updateDriveFile,
  updateDriveSharing,
  findOrCreateSchoolFolder,
  isDriveConnected as checkDriveConnected,
  getCurrentDriveUser,
  uploadMeetingMinuteToDrive,
  uploadMeetingFeedbackToDrive,
} from '../services/googleDriveService';
import { User as FirebaseUser } from 'firebase/auth';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  meetings: Meeting[];
  attendance: AttendanceRecord[];
  minutes: MeetingMinute[];
  feedbacks: MeetingFeedback[];
  aiLinks: AiStudioLink[];
  activeTab: string;
  selectedMeetingId: string | null;
  toasts: ToastMessage[];

  // Firebase
  firebaseConnected: boolean | null;
  firebasePermissionDenied: boolean;
  firebaseProjectId: string;
  checkFirebaseConnection: () => Promise<boolean>;
  syncAllToFirebase: () => Promise<boolean>;

  // Navigation
  setActiveTab: (tab: string) => void;
  selectMeeting: (meetingId: string | null) => void;

  // Toast
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
  removeToast: (id: string) => void;

  // Auth
  login: (username: string, password?: string) => boolean;
  loginAsUser: (user: User) => void;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; message: string };
  adminResetPassword: (userId: string, newPassword: string) => void;

  // Meeting
  addMeeting: (
    meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>,
    initialMinute?: Omit<MeetingMinute, 'id' | 'meetingId' | 'createdAt' | 'updatedAt'>
  ) => string;
  updateMeeting: (meeting: Meeting) => void;
  deleteMeeting: (id: string) => void;
  getMeetingEffectiveStatus: (meeting: Meeting) => MeetingStatus;

  // Attendance
  updateAttendance: (meetingId: string, userId: string, status: AttendanceStatus, note?: string, checkedBy?: string) => void;
  selfCheckIn: (meetingId: string) => boolean;
  getMeetingAttendance: (meetingId: string) => AttendanceRecord[];

  // Minutes & Files
  addMinute: (minute: Omit<MeetingMinute, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMinute: (minute: MeetingMinute) => void;
  deleteMinute: (id: string) => void;
  getMeetingMinutes: (meetingId: string) => MeetingMinute[];
  addMinuteFile: (minuteId: string, file: Omit<MinuteFileAttachment, 'id' | 'uploadedAt'>) => boolean;
  replaceMinuteFile: (minuteId: string, fileId: string, newFile: Omit<MinuteFileAttachment, 'id' | 'uploadedAt'>) => boolean;
  deleteMinuteFile: (minuteId: string, fileId: string) => boolean;
  renameMinuteFile: (minuteId: string, fileId: string, newName: string) => boolean;

  // Feedback
  addFeedback: (meetingId: string, content: string, topicTitle?: string) => void;
  updateFeedbackStatus: (feedbackId: string, status: FeedbackStatus, adminReply?: string) => void;
  deleteFeedback: (feedbackId: string) => void;
  getMeetingFeedbacks: (meetingId: string) => MeetingFeedback[];

  // AI Studio Links
  addAiLink: (link: Omit<AiStudioLink, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAiLink: (link: AiStudioLink) => void;
  deleteAiLink: (id: string) => void;
  incrementLinkViews: (id: string) => void;

  // Google Drive & Files
  driveFiles: DriveFileRecord[];
  isDriveConnected: boolean;
  driveUser: FirebaseUser | null;
  connectDrive: () => Promise<void>;
  disconnectDrive: () => Promise<void>;
  addDriveFileRecord: (data: Omit<DriveFileRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DriveFileRecord>;
  updateDriveFileRecord: (id: string, updates: Partial<DriveFileRecord>) => Promise<void>;
  deleteDriveFileRecord: (id: string, alsoDeleteFromDrive?: boolean) => Promise<void>;
  uploadFileToGoogleDrive: (
    file: File | Blob,
    options: {
      customName?: string;
      category: DriveFileCategory;
      description?: string;
      tags?: string[];
      folderName?: string;
      folderId?: string;
      sharingStatus?: DriveSharingStatus;
      meetingId?: string;
      meetingTitle?: string;
    }
  ) => Promise<DriveFileRecord>;
  uploadMinuteDirectToDrive: (
    meeting: Meeting,
    minuteTitle: string,
    content: string,
    files?: MinuteFileAttachment[]
  ) => Promise<DriveFileRecord>;
  uploadFeedbackSummaryDirectToDrive: (
    meeting: Meeting,
    feedbacksList: MeetingFeedback[]
  ) => Promise<DriveFileRecord>;
  syncDriveWithFirestore: () => Promise<void>;

  // Utilities
  resetToDefaultData: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;

  // Pending Deletion Management (Safety Save & Revert)
  pendingDeletions: PendingDeletion[];
  commitPendingDeletion: (pendingId?: string) => void;
  revertPendingDeletion: (pendingId?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'mn_anhsao_rachdua_users_v2',
  MEETINGS: 'mn_anhsao_rachdua_meetings_v2',
  ATTENDANCE: 'mn_anhsao_rachdua_attendance_v2',
  MINUTES: 'mn_anhsao_rachdua_minutes_v2',
  FEEDBACKS: 'mn_anhsao_rachdua_feedbacks_v2',
  AI_LINKS: 'mn_anhsao_rachdua_ai_links_v2',
  DRIVE_FILES: 'mn_anhsao_rachdua_drive_files_v2',
  CURRENT_USER: 'mn_anhsao_rachdua_current_user_v2',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load from localStorage or defaults
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    const list: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    // Quy định: Mật khẩu của admin luôn là 123
    return list.map((u) =>
      u.role === 'admin' || u.username.toLowerCase() === 'admin'
        ? { ...u, password: '123' }
        : u
    );
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        const u: User = JSON.parse(saved);
        if (u.role === 'admin' || u.username.toLowerCase() === 'admin') {
          return { ...u, password: '123' };
        }
        return u;
      } catch {
        return null;
      }
    }
    return null; // Yêu cầu đăng nhập tài khoản và mật khẩu đã cấp trước khi vào sổ tay!
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEETINGS);
    return saved ? JSON.parse(saved) : INITIAL_MEETINGS;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [minutes, setMinutes] = useState<MeetingMinute[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MINUTES);
    return saved ? JSON.parse(saved) : INITIAL_MINUTES;
  });

  const [feedbacks, setFeedbacks] = useState<MeetingFeedback[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
    return saved ? JSON.parse(saved) : INITIAL_FEEDBACKS;
  });

  const [aiLinks, setAiLinks] = useState<AiStudioLink[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AI_LINKS);
    return saved ? JSON.parse(saved) : INITIAL_AI_LINKS;
  });

  // Google Drive Files State
  const [driveFiles, setDriveFiles] = useState<DriveFileRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DRIVE_FILES);
    return saved ? JSON.parse(saved) : INITIAL_DRIVE_FILES;
  });
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(() => checkDriveConnected());
  const [driveUser, setDriveUser] = useState<FirebaseUser | null>(() => getCurrentDriveUser());

  // Listen to Google Drive auth state
  useEffect(() => {
    const unsub = initDriveAuth((user, token) => {
      setDriveUser(user);
      setIsDriveConnected(Boolean(user && token));
    });
    return unsub;
  }, []);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pendingDeletions, setPendingDeletions] = useState<PendingDeletion[]>([]);

  // Firebase integration status
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null);
  const [firebasePermissionDenied, setFirebasePermissionDenied] = useState<boolean>(false);
  const firebaseProjectId = firebaseConfig.projectId || 'sotaymamnonanhsao';

  // Sync state to localStorage for offline cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MINUTES, JSON.stringify(minutes));
  }, [minutes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(feedbacks));
  }, [feedbacks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AI_LINKS, JSON.stringify(aiLinks));
  }, [aiLinks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DRIVE_FILES, JSON.stringify(driveFiles));
  }, [driveFiles]);

  // Toast helper
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Tự động kiểm tra giờ hẹn cuộc họp theo thời gian thực:
  // - Khi đến giờ hẹn: tự động chuyển sang 'ongoing' ("Đang diễn ra cuộc họp")
  // - Khi hết giờ họp: tự động chuyển sang 'completed' ("Cuộc họp đã kết thúc")
  useEffect(() => {
    const checkAndUpdateMeetingStatuses = () => {
      const now = new Date();
      setMeetings((prevMeetings) => {
        let hasChanges = false;
        const updatedList = prevMeetings.map((m) => {
          if (m.status === 'cancelled') return m;
          const calculated = computeMeetingStatus(m, now);
          if (calculated !== m.status) {
            hasChanges = true;
            const updatedMeeting: Meeting = {
              ...m,
              status: calculated,
              updatedAt: new Date().toISOString(),
            };
            saveDocument(COLLECTIONS.MEETINGS, updatedMeeting).catch((err) =>
              console.warn('Auto update meeting status Firestore err:', err)
            );
            return updatedMeeting;
          }
          return m;
        });

        return hasChanges ? updatedList : prevMeetings;
      });
    };

    checkAndUpdateMeetingStatuses();
    const interval = setInterval(checkAndUpdateMeetingStatuses, 10000);
    return () => clearInterval(interval);
  }, []);

  // Realtime Firestore synchronization
  useEffect(() => {
    let unsubUsers: (() => void) | undefined;
    let unsubMeetings: (() => void) | undefined;
    let unsubAttendance: (() => void) | undefined;
    let unsubMinutes: (() => void) | undefined;
    let unsubFeedbacks: (() => void) | undefined;
    let unsubAiLinks: (() => void) | undefined;
    let unsubDriveFiles: (() => void) | undefined;

    const setupFirestore = async () => {
      try {
        // Seed Firestore if brand new collections
        await seedFirestoreCollection(COLLECTIONS.USERS, INITIAL_USERS);
        await seedFirestoreCollection(COLLECTIONS.MEETINGS, INITIAL_MEETINGS);
        await seedFirestoreCollection(COLLECTIONS.ATTENDANCE, INITIAL_ATTENDANCE);
        await seedFirestoreCollection(COLLECTIONS.MINUTES, INITIAL_MINUTES);
        await seedFirestoreCollection(COLLECTIONS.FEEDBACKS, INITIAL_FEEDBACKS);
        await seedFirestoreCollection(COLLECTIONS.AI_LINKS, INITIAL_AI_LINKS);
        await seedFirestoreCollection(COLLECTIONS.DRIVE_FILES, INITIAL_DRIVE_FILES);

        const handleSnapSuccess = () => {
          setFirebaseConnected(true);
          setFirebasePermissionDenied(false);
        };

        const handleSnapError = (colName: string, err: any) => {
          console.warn(`Firestore ${colName} sync notice:`, err?.message || err);
          setFirebaseConnected(false);
          if (
            err?.code === 'permission-denied' ||
            err?.message?.includes('insufficient permissions') ||
            err?.message?.includes('permission')
          ) {
            setFirebasePermissionDenied(true);
          }
        };

        // Listen to Users in Firestore
        unsubUsers = onSnapshot(
          collection(db, COLLECTIONS.USERS),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => d.data() as User);
              // Quy định: Mật khẩu của Admin luôn là 123
              const sanitized = list.map((u) =>
                u.role === 'admin' || u.username.toLowerCase() === 'admin'
                  ? { ...u, password: '123' }
                  : u
              );
              // Filter out any user pending deletion
              setPendingDeletions((currentPending) => {
                const pendingUserIds = new Set(
                  currentPending.filter((p) => p.type === 'user').map((p) => p.targetId)
                );
                const finalUsers = sanitized.filter((u) => !pendingUserIds.has(u.id));
                setUsers(finalUsers);
                return currentPending;
              });
            }
            handleSnapSuccess();
          },
          (err) => handleSnapError('users', err)
        );

        // Listen to Meetings in Firestore
        unsubMeetings = onSnapshot(
          collection(db, COLLECTIONS.MEETINGS),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => d.data() as Meeting);
              setMeetings(list);
            }
            handleSnapSuccess();
          },
          (err) => handleSnapError('meetings', err)
        );

        // Listen to Attendance in Firestore
        unsubAttendance = onSnapshot(
          collection(db, COLLECTIONS.ATTENDANCE),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => d.data() as AttendanceRecord);
              setAttendance(list);
            }
            handleSnapSuccess();
          },
          (err) => handleSnapError('attendance', err)
        );

        // Listen to Minutes in Firestore
        unsubMinutes = onSnapshot(
          collection(db, COLLECTIONS.MINUTES),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => d.data() as MeetingMinute);
              setMinutes(list);
            }
            handleSnapSuccess();
          },
          (err) => handleSnapError('minutes', err)
        );

        // Listen to Feedbacks in Firestore
        unsubFeedbacks = onSnapshot(
          collection(db, COLLECTIONS.FEEDBACKS),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => d.data() as MeetingFeedback);
              setFeedbacks(list);
            }
            handleSnapSuccess();
          },
          (err) => handleSnapError('feedbacks', err)
        );

        // Listen to AI Links in Firestore
        unsubAiLinks = onSnapshot(
          collection(db, COLLECTIONS.AI_LINKS),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => d.data() as AiStudioLink);
              setAiLinks(list);
            }
            handleSnapSuccess();
          },
          (err) => handleSnapError('aiLinks', err)
        );

        // Listen to Google Drive Files in Firestore
        unsubDriveFiles = onSnapshot(
          collection(db, COLLECTIONS.DRIVE_FILES),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map((d) => d.data() as DriveFileRecord);
              setDriveFiles(list);
            }
            handleSnapSuccess();
          },
          (err) => handleSnapError('driveFiles', err)
        );
      } catch (err: any) {
        console.warn('Firebase init error:', err);
        setFirebaseConnected(false);
        if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
          setFirebasePermissionDenied(true);
        }
      }
    };

    setupFirestore();

    return () => {
      unsubUsers?.();
      unsubMeetings?.();
      unsubAttendance?.();
      unsubMinutes?.();
      unsubFeedbacks?.();
      unsubAiLinks?.();
      unsubDriveFiles?.();
    };
  }, []);

  // Check connection & rules on demand
  const checkFirebaseConnection = async (): Promise<boolean> => {
    const res = await testFirestoreHealth();
    if (res.allowed) {
      setFirebaseConnected(true);
      setFirebasePermissionDenied(false);
      addToast(
        `Đã kết nối thành công với Firestore (${firebaseProjectId})! Rules đã mở.`,
        'success',
        'Kết nối Firebase'
      );
      return true;
    } else {
      setFirebaseConnected(false);
      if (res.permissionDenied) {
        setFirebasePermissionDenied(true);
        addToast(
          'Rules trên Firebase Console vẫn đang để "allow read, write: if false;". Vui lòng sửa thành "if true;".',
          'warning',
          'Rules đang bị khóa'
        );
      } else {
        addToast(res.message, 'error', 'Lỗi kết nối Firebase');
      }
      return false;
    }
  };

  // Sync all current data to Firestore
  const syncAllToFirebase = async (): Promise<boolean> => {
    try {
      const batch = writeBatch(db);

      users.forEach((u) => batch.set(doc(db, COLLECTIONS.USERS, u.id), u));
      meetings.forEach((m) => batch.set(doc(db, COLLECTIONS.MEETINGS, m.id), m));
      attendance.forEach((a) => batch.set(doc(db, COLLECTIONS.ATTENDANCE, a.id), a));
      minutes.forEach((min) => batch.set(doc(db, COLLECTIONS.MINUTES, min.id), min));
      feedbacks.forEach((f) => batch.set(doc(db, COLLECTIONS.FEEDBACKS, f.id), f));
      aiLinks.forEach((l) => batch.set(doc(db, COLLECTIONS.AI_LINKS, l.id), l));
      driveFiles.forEach((df) => batch.set(doc(db, COLLECTIONS.DRIVE_FILES, df.id), df));

      await batch.commit();
      setFirebaseConnected(true);
      setFirebasePermissionDenied(false);
      addToast(
        `Đã đồng bộ toàn bộ dữ liệu lên Firebase Firestore (${firebaseProjectId}) thành công!`,
        'success',
        'Đồng bộ Firebase'
      );
      return true;
    } catch (error: any) {
      console.error('Lỗi đồng bộ Firebase:', error);
      const isDenied =
        error?.code === 'permission-denied' ||
        error?.message?.includes('insufficient permissions');
      if (isDenied) {
        setFirebasePermissionDenied(true);
        setFirebaseConnected(false);
        addToast(
          'Rules đang chặn quyền ghi ("allow read, write: if false;"). Vui lòng mở Rules trên Firebase Console!',
          'error',
          'Rules đang khóa'
        );
      } else {
        addToast(
          'Không thể đồng bộ lên Firebase. Vui lòng kiểm tra kết nối mạng hoặc Firestore Rules!',
          'error',
          'Lỗi đồng bộ'
        );
      }
      return false;
    }
  };

  // Auth handlers
  const login = (username: string, password?: string) => {
    if (!username.trim()) {
      addToast('Vui lòng nhập tên tài khoản đăng nhập.', 'warning');
      return false;
    }
    const found = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!found) {
      addToast('Tài khoản không tồn tại trong hệ thống Trường MN Ánh Sao Phường Rạch Dừa.', 'error', 'Đăng nhập thất bại');
      return false;
    }

    const isAdmin = found.role === 'admin' || found.username.toLowerCase() === 'admin';
    const expectedPassword = found.password || '123';

    if (!password || password !== expectedPassword) {
      addToast(
        isAdmin
          ? 'Mật khẩu tài khoản Quản trị viên (Admin) không chính xác! Mật khẩu này được bảo mật riêng, chỉ người quản trị mới biết.'
          : 'Mật khẩu không chính xác! Chỉ ai có đúng tài khoản và mật khẩu của riêng cá nhân mới có thể đăng nhập. Nếu quên mật khẩu, vui lòng liên hệ Ban Giám Hiệu (Admin) để được cấp lại mật khẩu.',
        'error',
        'Sai mật khẩu'
      );
      return false;
    }

    setCurrentUser(found);
    addToast(
      `Đăng nhập thành công! Xin chào ${found.name} [${isAdmin ? 'Quản trị viên' : 'Thành viên'}]`,
      'success',
      'Chào mừng bạn'
    );
    return true;
  };

  const changePassword = (
    oldPassword: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Chưa đăng nhập' };

    const currentPass = currentUser.password || '123';
    if (oldPassword !== currentPass) {
      addToast('Mật khẩu hiện tại không chính xác! Vui lòng nhập đúng mật khẩu cũ.', 'error');
      return { success: false, message: 'Mật khẩu hiện tại không đúng' };
    }
    if (!newPassword || newPassword.trim().length < 3) {
      addToast('Mật khẩu mới phải có ít nhất 3 ký tự.', 'warning');
      return { success: false, message: 'Mật khẩu mới quá ngắn' };
    }
    if (newPassword.trim() === oldPassword) {
      addToast('Mật khẩu mới không được trùng với mật khẩu hiện tại.', 'warning');
      return { success: false, message: 'Mật khẩu mới trùng mật khẩu cũ' };
    }

    const updatedUser: User = { ...currentUser, password: newPassword.trim() };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    // Save to Firestore
    saveDocument(COLLECTIONS.USERS, updatedUser).catch((e) => console.warn('Firestore save user err:', e));

    addToast(
      'Bạn đã đổi mật khẩu thành công! Mật khẩu mới được bảo mật an toàn, hãy ghi nhớ cho các lần đăng nhập tiếp theo.',
      'success',
      'Đổi mật khẩu thành công'
    );
    return { success: true, message: 'Đổi mật khẩu thành công' };
  };

  const adminResetPassword = (userId: string, newPassword: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const finalPassword = newPassword.trim() || '123';
    const updated: User = { ...targetUser, password: finalPassword };
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    if (currentUser?.id === userId) {
      setCurrentUser(updated);
    }

    // Save to Firestore
    saveDocument(COLLECTIONS.USERS, updated).catch((e) => console.warn('Firestore reset user err:', e));

    addToast(
      `Đã cấp lại mật khẩu cho ${targetUser.name}: "${finalPassword}"`,
      'success',
      'Cấp lại mật khẩu thành công'
    );
  };

  const loginAsUser = (user: User) => {
    const isAdmin = user.role === 'admin' || user.username.toLowerCase() === 'admin';
    setCurrentUser(user);
    addToast(`Đã chuyển sang tài khoản: ${user.name} [${isAdmin ? 'Quản trị viên' : 'Thành viên'}]`, 'success');
  };

  const logout = () => {
    setCurrentUser(null);
    addToast('Đã đăng xuất khỏi hệ thống', 'info');
  };

  const addUser = (userData: Omit<User, 'id'>) => {
    const isAdmin = userData.role === 'admin' || userData.username.toLowerCase() === 'admin';
    const newUser: User = {
      ...userData,
      id: 'user-' + Date.now(),
      password: userData.password?.trim() || '123',
      avatar: userData.avatar || (isAdmin ? '👩‍💼' : '👩‍🏫'),
    };
    setUsers((prev) => [...prev, newUser]);
    saveDocument(COLLECTIONS.USERS, newUser).catch((e) => console.warn('Firestore add user err:', e));
    addToast(`Đã thêm thành viên: ${newUser.name}`, 'success');
  };

  const updateUser = (updated: User) => {
    const userToSave: User = {
      ...updated,
      password: updated.password?.trim() || '123',
    };
    setUsers((prev) => prev.map((u) => (u.id === userToSave.id ? userToSave : u)));
    if (currentUser?.id === userToSave.id) {
      setCurrentUser(userToSave);
    }
    saveDocument(COLLECTIONS.USERS, userToSave).catch((e) => console.warn('Firestore update user err:', e));
    addToast('Đã cập nhật thông tin thành viên', 'success');
  };

  const deleteUser = (id: string) => {
    if (currentUser?.id === id) {
      addToast('Không thể xóa tài khoản bạn đang đăng nhập', 'error');
      return;
    }
    const target = users.find((u) => u.id === id);
    if (!target) return;

    // Temporary remove from current state
    setUsers((prev) => prev.filter((u) => u.id !== id));

    // Register pending deletion
    const pendingItem: PendingDeletion = {
      id: 'pending-' + Date.now(),
      type: 'user',
      targetId: id,
      title: target.name,
      subtitle: `${target.title} · ${target.group}`,
      originalData: target,
      timestamp: Date.now(),
    };
    setPendingDeletions((prev) => [...prev, pendingItem]);

    addToast(
      `Đã xóa thành viên "${target.name}". Hãy bấm nút [LƯU LẠI] trên thanh thông báo để hoàn tất, hoặc [HỦY / PHỤC HỒI] để quay về ban đầu.`,
      'warning',
      'Đang chờ lưu thay đổi'
    );
  };

  // Commit (Lưu lại chính thức)
  const commitPendingDeletion = (pendingId?: string) => {
    const itemsToCommit = pendingId
      ? pendingDeletions.filter((p) => p.id === pendingId)
      : [...pendingDeletions];

    if (itemsToCommit.length === 0) return;

    itemsToCommit.forEach((item) => {
      if (item.type === 'user') {
        deleteDocument(COLLECTIONS.USERS, item.targetId).catch((e) =>
          console.warn('Firestore delete user err:', e)
        );
      } else if (item.type === 'meeting') {
        deleteDocument(COLLECTIONS.MEETINGS, item.targetId).catch((e) =>
          console.warn('Firestore delete meeting err:', e)
        );
      } else if (item.type === 'minute') {
        deleteDocument(COLLECTIONS.MINUTES, item.targetId).catch((e) =>
          console.warn('Firestore delete minute err:', e)
        );
      } else if (item.type === 'feedback') {
        deleteDocument(COLLECTIONS.FEEDBACKS, item.targetId).catch((e) =>
          console.warn('Firestore delete feedback err:', e)
        );
      } else if (item.type === 'aiLink') {
        deleteDocument(COLLECTIONS.AI_LINKS, item.targetId).catch((e) =>
          console.warn('Firestore delete aiLink err:', e)
        );
      }
    });

    setPendingDeletions((prev) =>
      pendingId ? prev.filter((p) => p.id !== pendingId) : []
    );

    addToast(
      `Đã lưu thay đổi thành công! Dữ liệu đã được lưu trữ vĩnh viễn vào hệ thống.`,
      'success',
      'Đã lưu thành công'
    );
  };

  // Revert (Hủy thao tác - quay về ban đầu trước khi thay đổi)
  const revertPendingDeletion = (pendingId?: string) => {
    const itemsToRevert = pendingId
      ? pendingDeletions.filter((p) => p.id === pendingId)
      : [...pendingDeletions];

    if (itemsToRevert.length === 0) return;

    itemsToRevert.forEach((item) => {
      if (item.type === 'user') {
        const originalUser = item.originalData as User;
        setUsers((prev) => {
          if (prev.some((u) => u.id === originalUser.id)) return prev;
          return [...prev, originalUser];
        });
      } else if (item.type === 'meeting') {
        const { meeting, attendanceList } = item.originalData;
        if (meeting) {
          setMeetings((prev) => {
            if (prev.some((m) => m.id === meeting.id)) return prev;
            return [...prev, meeting];
          });
        }
        if (attendanceList && Array.isArray(attendanceList)) {
          setAttendance((prev) => [
            ...prev.filter((a) => a.meetingId !== meeting.id),
            ...attendanceList,
          ]);
        }
      } else if (item.type === 'minute') {
        const originalMinute = item.originalData as MeetingMinute;
        setMinutes((prev) => {
          if (prev.some((m) => m.id === originalMinute.id)) return prev;
          return [...prev, originalMinute];
        });
      } else if (item.type === 'feedback') {
        const originalFeedback = item.originalData as MeetingFeedback;
        setFeedbacks((prev) => {
          if (prev.some((f) => f.id === originalFeedback.id)) return prev;
          return [...prev, originalFeedback];
        });
      } else if (item.type === 'aiLink') {
        const originalLink = item.originalData as AiStudioLink;
        setAiLinks((prev: AiStudioLink[]) => {
          if (prev.some((l: AiStudioLink) => l.id === originalLink.id)) return prev;
          return [...prev, originalLink];
        });
      }
    });

    setPendingDeletions((prev) =>
      pendingId ? prev.filter((p) => p.id !== pendingId) : []
    );

    addToast(
      `Đã khôi phục dữ liệu quay về ban đầu trước khi thay đổi!`,
      'info',
      'Đã hoàn tác'
    );
  };

  // Navigation
  const selectMeeting = (meetingId: string | null) => {
    setSelectedMeetingId(meetingId);
    if (meetingId) {
      setActiveTab('meeting-detail');
    }
  };

  // Meeting CRUD
  const getMeetingEffectiveStatus = (meeting: Meeting): MeetingStatus => {
    return computeMeetingStatus(meeting);
  };

  const addMeeting = (
    data: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>,
    initialMinute?: Omit<MeetingMinute, 'id' | 'meetingId' | 'createdAt' | 'updatedAt'>
  ) => {
    const id = 'meet-' + Date.now();
    const calculatedStatus = computeMeetingStatus({
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status,
    });
    const newMeeting: Meeting = {
      ...data,
      status: calculatedStatus,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMeetings((prev) => [newMeeting, ...prev]);

    // Save meeting to Firestore
    saveDocument(COLLECTIONS.MEETINGS, newMeeting).catch((e) => console.warn('Firestore add meeting err:', e));

    // If an initial minute was provided (e.g. minute file uploaded during creation)
    if (initialMinute) {
      const minId = 'min-' + Date.now();
      const newMin: MeetingMinute = {
        ...initialMinute,
        id: minId,
        meetingId: id,
        files: initialMinute.files || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMinutes((prev) => [newMin, ...prev]);
      saveDocument(COLLECTIONS.MINUTES, newMin).catch((e) =>
        console.warn('Firestore add initial minute err:', e)
      );
    }

    // Pre-populate initial attendance for this meeting with school staff
    const staffAttendance: AttendanceRecord[] = users.map((u) => ({
      id: `att-${id}-${u.id}`,
      meetingId: id,
      userId: u.id,
      userName: u.name,
      userTitle: u.title,
      userGroup: u.group,
      status: 'unexcused',
    }));
    setAttendance((prev) => [...prev, ...staffAttendance]);

    // Save attendance batch to Firestore
    staffAttendance.forEach((att) => {
      saveDocument(COLLECTIONS.ATTENDANCE, att).catch((e) => console.warn('Firestore add att err:', e));
    });

    addToast(`Đã tạo cuộc họp: "${newMeeting.title}"`, 'success');
    return id;
  };

  const updateMeeting = (updated: Meeting) => {
    const timestamp = new Date().toISOString();
    const calculatedStatus =
      updated.status === 'cancelled' ? 'cancelled' : computeMeetingStatus(updated);
    const meetingWithTs = { ...updated, status: calculatedStatus, updatedAt: timestamp };
    setMeetings((prev) =>
      prev.map((m) => (m.id === updated.id ? meetingWithTs : m))
    );
    saveDocument(COLLECTIONS.MEETINGS, meetingWithTs).catch((e) => console.warn('Firestore update meeting err:', e));
    addToast('Đã cập nhật thông tin cuộc họp', 'success');
  };

  const deleteMeeting = (id: string) => {
    const target = meetings.find((m) => m.id === id);
    if (!target) return;
    const meetingAttendance = attendance.filter((a) => a.meetingId === id);

    setMeetings((prev) => prev.filter((m) => m.id !== id));
    setAttendance((prev) => prev.filter((a) => a.meetingId !== id));
    setMinutes((prev) => prev.filter((m) => m.meetingId !== id));
    setFeedbacks((prev) => prev.filter((f) => f.meetingId !== id));

    const pendingItem: PendingDeletion = {
      id: 'pending-' + Date.now(),
      type: 'meeting',
      targetId: id,
      title: target.title,
      subtitle: `Cuộc họp ngày ${target.date}`,
      originalData: { meeting: target, attendanceList: meetingAttendance },
      timestamp: Date.now(),
    };
    setPendingDeletions((prev) => [...prev, pendingItem]);

    if (selectedMeetingId === id) {
      setSelectedMeetingId(null);
      setActiveTab('meetings');
    }
    addToast(
      `Đã xóa cuộc họp "${target.title}". Hãy bấm [LƯU LẠI] trên thanh thông báo để hoàn tất, hoặc [QUAY VỀ BAN ĐẦU] để khôi phục.`,
      'warning',
      'Đang chờ lưu thay đổi'
    );
  };

  // Attendance
  const updateAttendance = (
    meetingId: string,
    userId: string,
    status: AttendanceStatus,
    note?: string,
    checkedBy?: string
  ) => {
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
      ' ' + new Date().toLocaleDateString('vi-VN');

    setAttendance((prev) => {
      const existing = prev.find((a) => a.meetingId === meetingId && a.userId === userId);
      if (existing) {
        const updated = {
          ...existing,
          status,
          checkInTime: status === 'present' ? nowStr : undefined,
          checkedBy: checkedBy || (currentUser?.name || 'Hệ thống'),
          note: note !== undefined ? note : existing.note,
        };
        saveDocument(COLLECTIONS.ATTENDANCE, updated).catch((e) => console.warn('Firestore update att err:', e));
        return prev.map((a) => (a.id === existing.id ? updated : a));
      } else {
        const user = users.find((u) => u.id === userId);
        const newRecord: AttendanceRecord = {
          id: `att-${meetingId}-${userId}-${Date.now()}`,
          meetingId,
          userId,
          userName: user?.name || 'Thành viên',
          userTitle: user?.title || 'Giáo viên',
          userGroup: user?.group || 'Trường',
          status,
          checkInTime: status === 'present' ? nowStr : undefined,
          checkedBy: checkedBy || currentUser?.name || 'Hệ thống',
          note,
        };
        saveDocument(COLLECTIONS.ATTENDANCE, newRecord).catch((e) => console.warn('Firestore add att err:', e));
        return [...prev, newRecord];
      }
    });

    addToast('Đã cập nhật trạng thái điểm danh', 'success');
  };

  const selfCheckIn = (meetingId: string) => {
    if (!currentUser) {
      addToast('Vui lòng đăng nhập để thực hiện điểm danh', 'error');
      return false;
    }
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
      ' ' + new Date().toLocaleDateString('vi-VN');

    setAttendance((prev) => {
      const existing = prev.find((a) => a.meetingId === meetingId && a.userId === currentUser.id);
      if (existing) {
        const updated = {
          ...existing,
          status: 'present' as AttendanceStatus,
          checkInTime: nowStr,
          checkedBy: 'Tự điểm danh (' + currentUser.name + ')',
        };
        saveDocument(COLLECTIONS.ATTENDANCE, updated).catch((e) => console.warn('Firestore update att err:', e));
        return prev.map((a) => (a.id === existing.id ? updated : a));
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-${meetingId}-${currentUser.id}-${Date.now()}`,
          meetingId,
          userId: currentUser.id,
          userName: currentUser.name,
          userTitle: currentUser.title,
          userGroup: currentUser.group,
          status: 'present',
          checkInTime: nowStr,
          checkedBy: 'Tự điểm danh (' + currentUser.name + ')',
        };
        saveDocument(COLLECTIONS.ATTENDANCE, newRecord).catch((e) => console.warn('Firestore add att err:', e));
        return [...prev, newRecord];
      }
    });

    addToast(`Bạn đã điểm danh thành công lúc ${nowStr}!`, 'success', 'Điểm danh hoàn tất');
    return true;
  };

  const getMeetingAttendance = (meetingId: string) => {
    const meetingRecords = attendance.filter((a) => a.meetingId === meetingId);
    const recordedUserIds = new Set(meetingRecords.map((r) => r.userId));

    const missingUsers: AttendanceRecord[] = users
      .filter((u) => !recordedUserIds.has(u.id))
      .map((u) => ({
        id: `att-virtual-${meetingId}-${u.id}`,
        meetingId,
        userId: u.id,
        userName: u.name,
        userTitle: u.title,
        userGroup: u.group,
        status: 'unexcused',
      }));

    return [...meetingRecords, ...missingUsers];
  };

  // Helper to check if current user can manage a specific meeting (Host, Secretary, Group Leader, or BGH)
  const canUserManageMeetingAction = (meetingId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || isBoardOfDirectors(currentUser)) return true;
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) {
      return isGroupLeader(currentUser) || isVicePrincipal(currentUser) || isPrincipal(currentUser);
    }
    return canManageMeeting(currentUser, meeting);
  };

  // Minutes & Files
  const addMinute = (data: Omit<MeetingMinute, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!canUserManageMeetingAction(data.meetingId)) {
      addToast('Chỉ Người chủ trì, Thư ký hoặc Ban Giám Hiệu mới có quyền tạo biên bản cuộc họp!', 'error', 'Từ chối quyền');
      return;
    }
    const id = 'min-' + Date.now();
    const newMinute: MeetingMinute = {
      ...data,
      id,
      files: data.files || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMinutes((prev) => [newMinute, ...prev]);
    saveDocument(COLLECTIONS.MINUTES, newMinute).catch((e) => console.warn('Firestore add minute err:', e));
    addToast('Đã lưu biên bản cuộc họp thành công', 'success');
  };

  const updateMinute = (updated: MeetingMinute) => {
    if (!canUserManageMeetingAction(updated.meetingId)) {
      addToast('Chỉ Người chủ trì, Thư ký hoặc Ban Giám Hiệu mới có quyền chỉnh sửa biên bản!', 'error', 'Từ chối quyền');
      return;
    }
    const updatedMinute = { ...updated, updatedAt: new Date().toISOString() };
    setMinutes((prev) =>
      prev.map((m) => (m.id === updated.id ? updatedMinute : m))
    );
    saveDocument(COLLECTIONS.MINUTES, updatedMinute).catch((e) => console.warn('Firestore update minute err:', e));
    addToast('Đã cập nhật biên bản cuộc họp thành công', 'success');
  };

  const deleteMinute = (id: string) => {
    const targetMinute = minutes.find((m) => m.id === id);
    if (!targetMinute || !canUserManageMeetingAction(targetMinute.meetingId)) {
      addToast('Chỉ Người chủ trì hoặc Ban Giám Hiệu mới có quyền xóa biên bản cuộc họp!', 'error', 'Từ chối quyền');
      return;
    }
    setMinutes((prev) => prev.filter((m) => m.id !== id));

    const pendingItem: PendingDeletion = {
      id: 'pending-' + Date.now(),
      type: 'minute',
      targetId: id,
      title: targetMinute.title,
      subtitle: `Biên bản lưu trữ`,
      originalData: targetMinute,
      timestamp: Date.now(),
    };
    setPendingDeletions((prev) => [...prev, pendingItem]);

    addToast(
      `Đã xóa biên bản "${targetMinute.title}". Bấm [LƯU LẠI] trên thanh thông báo để hoàn tất, hoặc [QUAY VỀ BAN ĐẦU] để khôi phục.`,
      'warning',
      'Đang chờ lưu thay đổi'
    );
  };

  const getMeetingMinutes = (meetingId: string) => {
    return minutes.filter((m) => m.meetingId === meetingId);
  };

  // Quản lý file lưu trữ biên bản: Người chủ trì, thư ký hoặc BGH có quyền thêm, xóa, thay thế file
  const addMinuteFile = (
    minuteId: string,
    fileData: Omit<MinuteFileAttachment, 'id' | 'uploadedAt'>
  ): boolean => {
    const minute = minutes.find((m) => m.id === minuteId);
    if (!minute) return false;
    if (!canUserManageMeetingAction(minute.meetingId)) {
      addToast('Chỉ Người chủ trì, Thư ký hoặc Ban Giám Hiệu mới có quyền tải lên tệp tin biên bản!', 'error', 'Từ chối quyền');
      return false;
    }

    const newFile: MinuteFileAttachment = {
      ...fileData,
      id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser?.name || 'Cán bộ',
    };

    const updatedMinute: MeetingMinute = {
      ...minute,
      files: [...(minute.files || []), newFile],
      updatedAt: new Date().toISOString(),
    };

    setMinutes((prev) => prev.map((m) => (m.id === minuteId ? updatedMinute : m)));
    saveDocument(COLLECTIONS.MINUTES, updatedMinute).catch((e) => console.warn('Firestore add file err:', e));
    addToast(`Đã lưu tệp tin "${newFile.name}" vào sổ biên bản lưu trữ!`, 'success', 'Thêm file thành công');
    return true;
  };

  const replaceMinuteFile = (
    minuteId: string,
    fileId: string,
    newFileData: Omit<MinuteFileAttachment, 'id' | 'uploadedAt'>
  ): boolean => {
    const minute = minutes.find((m) => m.id === minuteId);
    if (!minute) return false;
    if (!canUserManageMeetingAction(minute.meetingId)) {
      addToast('Chỉ Người chủ trì, Thư ký hoặc Ban Giám Hiệu mới có quyền thay thế tệp tin lưu trữ!', 'error', 'Từ chối quyền');
      return false;
    }

    const existingFiles = minute.files || [];
    const targetFile = existingFiles.find((f) => f.id === fileId);
    const oldName = targetFile?.name || 'tệp tin cũ';

    const replacedFile: MinuteFileAttachment = {
      ...newFileData,
      id: fileId,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser?.name || 'Cán bộ',
    };

    const updatedFiles = existingFiles.map((f) => (f.id === fileId ? replacedFile : f));
    const updatedMinute: MeetingMinute = {
      ...minute,
      files: updatedFiles,
      updatedAt: new Date().toISOString(),
    };

    setMinutes((prev) => prev.map((m) => (m.id === minuteId ? updatedMinute : m)));
    saveDocument(COLLECTIONS.MINUTES, updatedMinute).catch((e) => console.warn('Firestore replace file err:', e));
    addToast(`Đã thay thế "${oldName}" bằng "${replacedFile.name}" thành công!`, 'success', 'Thay thế file hoàn tất');
    return true;
  };

  const deleteMinuteFile = (minuteId: string, fileId: string): boolean => {
    const minute = minutes.find((m) => m.id === minuteId);
    if (!minute) return false;
    if (!canUserManageMeetingAction(minute.meetingId)) {
      addToast('Chỉ Người chủ trì, Thư ký hoặc Ban Giám Hiệu mới có quyền xóa tệp tin biên bản!', 'error', 'Từ chối quyền');
      return false;
    }

    const targetFile = (minute.files || []).find((f) => f.id === fileId);
    const updatedFiles = (minute.files || []).filter((f) => f.id !== fileId);
    const updatedMinute: MeetingMinute = {
      ...minute,
      files: updatedFiles,
      updatedAt: new Date().toISOString(),
    };

    setMinutes((prev) => prev.map((m) => (m.id === minuteId ? updatedMinute : m)));
    saveDocument(COLLECTIONS.MINUTES, updatedMinute).catch((e) => console.warn('Firestore delete file err:', e));
    addToast(`Đã xóa tệp tin "${targetFile?.name || 'lưu trữ'}" khỏi biên bản!`, 'info', 'Đã xóa file');
    return true;
  };

  const renameMinuteFile = (minuteId: string, fileId: string, newName: string): boolean => {
    const minute = minutes.find((m) => m.id === minuteId);
    if (!minute) return false;
    if (!canUserManageMeetingAction(minute.meetingId)) {
      addToast('Chỉ Người chủ trì, Thư ký hoặc Ban Giám Hiệu mới có quyền chỉnh sửa tên file!', 'error', 'Từ chối quyền');
      return false;
    }
    if (!newName.trim()) return false;

    const updatedFiles = (minute.files || []).map((f) =>
      f.id === fileId ? { ...f, name: newName.trim() } : f
    );
    const updatedMinute: MeetingMinute = {
      ...minute,
      files: updatedFiles,
      updatedAt: new Date().toISOString(),
    };

    setMinutes((prev) => prev.map((m) => (m.id === minuteId ? updatedMinute : m)));
    saveDocument(COLLECTIONS.MINUTES, updatedMinute).catch((e) => console.warn('Firestore rename file err:', e));
    addToast(`Đã chỉnh sửa tên tệp tin thành "${newName.trim()}"!`, 'success', 'Đổi tên thành công');
    return true;
  };

  // Feedback
  const addFeedback = (meetingId: string, content: string, topicTitle?: string) => {
    if (!currentUser) return;
    const meeting = meetings.find((m) => m.id === meetingId);
    const meetingTitle = meeting?.title || 'Cuộc họp';
    const finalTopic = topicTitle || `Ý kiến đóng góp trong cuộc họp: ${meetingTitle}`;

    const newFeedback: MeetingFeedback = {
      id: 'fb-' + Date.now(),
      meetingId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorTitle: currentUser.title,
      authorGroup: currentUser.group,
      content,
      topicTitle: finalTopic,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setFeedbacks((prev) => [newFeedback, ...prev]);
    saveDocument(COLLECTIONS.FEEDBACKS, newFeedback).catch((e) => console.warn('Firestore add fb err:', e));
    addToast(
      `Đã lưu trữ ý kiến với tiêu mục: ${finalTopic}`,
      'success',
      'Đã lưu trữ ý kiến'
    );
  };

  const updateFeedbackStatus = (feedbackId: string, status: FeedbackStatus, adminReply?: string) => {
    setFeedbacks((prev) =>
      prev.map((f) => {
        if (f.id === feedbackId) {
          const updated = {
            ...f,
            status,
            adminReply: adminReply !== undefined ? adminReply : f.adminReply,
            updatedAt: new Date().toISOString(),
          };
          saveDocument(COLLECTIONS.FEEDBACKS, updated).catch((e) => console.warn('Firestore update fb err:', e));
          return updated;
        }
        return f;
      })
    );
    addToast('Đã cập nhật trạng thái ý kiến đóng góp', 'success');
  };

  const deleteFeedback = (feedbackId: string) => {
    setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));
    deleteDocument(COLLECTIONS.FEEDBACKS, feedbackId).catch((e) => console.warn('Firestore delete fb err:', e));
    addToast('Đã xóa ý kiến đóng góp', 'info');
  };

  const getMeetingFeedbacks = (meetingId: string) => {
    return feedbacks.filter((f) => f.meetingId === meetingId);
  };

  // AI Studio Links
  const addAiLink = (data: Omit<AiStudioLink, 'id' | 'createdAt' | 'updatedAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newLink: AiStudioLink = {
      ...data,
      id: 'link-' + Date.now(),
      createdAt: today,
      updatedAt: today,
      viewsCount: 0,
    };
    setAiLinks((prev) => [newLink, ...prev]);
    saveDocument(COLLECTIONS.AI_LINKS, newLink).catch((e) => console.warn('Firestore add link err:', e));
    addToast(`Đã thêm liên kết: "${newLink.name}" vào kho Google AI Studio`, 'success');
  };

  const updateAiLink = (updated: AiStudioLink) => {
    const today = new Date().toISOString().split('T')[0];
    const updatedLink = { ...updated, updatedAt: today };
    setAiLinks((prev) =>
      prev.map((l) => (l.id === updated.id ? updatedLink : l))
    );
    saveDocument(COLLECTIONS.AI_LINKS, updatedLink).catch((e) => console.warn('Firestore update link err:', e));
    addToast('Đã cập nhật thông tin liên kết Google AI Studio', 'success');
  };

  const deleteAiLink = (id: string) => {
    setAiLinks((prev) => prev.filter((l) => l.id !== id));
    deleteDocument(COLLECTIONS.AI_LINKS, id).catch((e) => console.warn('Firestore delete link err:', e));
    addToast('Đã xóa liên kết khỏi kho Google AI Studio', 'info');
  };

  const incrementLinkViews = (id: string) => {
    setAiLinks((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const updated = { ...l, viewsCount: (l.viewsCount || 0) + 1 };
          saveDocument(COLLECTIONS.AI_LINKS, updated).catch((e) => console.warn('Firestore update link views err:', e));
          return updated;
        }
        return l;
      })
    );
  };

  // Google Drive & Files Operations
  const connectDrive = async () => {
    try {
      const res = await connectGoogleDrive();
      setIsDriveConnected(true);
      setDriveUser(res.user);
      addToast(
        `Đã kết nối tài khoản Google Drive: ${res.user.email || res.user.displayName || 'Tài khoản Google'}!`,
        'success',
        'Google Drive'
      );
    } catch (err: any) {
      console.error('Lỗi kết nối Drive:', err);
      addToast(err?.message || 'Không thể kết nối Google Drive', 'error', 'Lỗi Google Drive');
      throw err;
    }
  };

  const disconnectDrive = async () => {
    try {
      await disconnectGoogleDrive();
      setIsDriveConnected(false);
      setDriveUser(null);
      addToast('Đã ngắt kết nối Google Drive', 'info');
    } catch (err: any) {
      console.warn('Lỗi ngắt kết nối:', err);
    }
  };

  const addDriveFileRecord = async (
    data: Omit<DriveFileRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DriveFileRecord> => {
    const now = new Date().toISOString();
    const newRecord: DriveFileRecord = {
      ...data,
      id: 'drive-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: now,
      updatedAt: now,
    };
    setDriveFiles((prev) => [newRecord, ...prev]);
    saveDocument(COLLECTIONS.DRIVE_FILES, newRecord).catch((e) =>
      console.warn('Firestore save driveFile err:', e)
    );
    return newRecord;
  };

  const updateDriveFileRecord = async (id: string, updates: Partial<DriveFileRecord>) => {
    const now = new Date().toISOString();
    let updatedItem: DriveFileRecord | null = null;
    setDriveFiles((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          updatedItem = { ...f, ...updates, updatedAt: now };
          return updatedItem;
        }
        return f;
      })
    );
    if (updatedItem) {
      saveDocument(COLLECTIONS.DRIVE_FILES, updatedItem).catch((e) =>
        console.warn('Firestore update driveFile err:', e)
      );
      if (updates.name || updates.description) {
        try {
          await updateDriveFile((updatedItem as DriveFileRecord).driveFileId, {
            name: updates.name,
            description: updates.description,
          });
        } catch (e) {
          console.warn('Lỗi cập nhật Drive API:', e);
        }
      }
    }
    addToast('Đã cập nhật thông tin tài liệu thành công', 'success');
  };

  const deleteDriveFileRecord = async (id: string, alsoDeleteFromDrive = false) => {
    const target = driveFiles.find((f) => f.id === id);
    if (!target) return;

    if (alsoDeleteFromDrive) {
      try {
        await deleteDriveFile(target.driveFileId);
      } catch (e: any) {
        console.warn('Không thể xóa tệp trên Google Drive (có thể tệp đã bị xóa từ trước):', e);
      }
    }

    setDriveFiles((prev) => prev.filter((f) => f.id !== id));
    deleteDocument(COLLECTIONS.DRIVE_FILES, id).catch((e) =>
      console.warn('Firestore delete driveFile err:', e)
    );

    addToast(
      alsoDeleteFromDrive
        ? `Đã xóa vĩnh viễn tệp "${target.name}" trên Google Drive và hệ thống!`
        : `Đã xóa bản ghi "${target.name}" khỏi hệ thống sổ tay!`,
      'info'
    );
  };

  const uploadFileToGoogleDrive = async (
    file: File | Blob,
    options: {
      customName?: string;
      category: DriveFileCategory;
      description?: string;
      tags?: string[];
      folderName?: string;
      folderId?: string;
      sharingStatus?: DriveSharingStatus;
      meetingId?: string;
      meetingTitle?: string;
    }
  ): Promise<DriveFileRecord> => {
    if (!checkDriveConnected()) {
      addToast('Vui lòng cấp quyền kết nối Google Drive trước khi tải tệp!', 'warning');
      await connectDrive();
    }

    const targetFolderName = options.folderName || 'Sổ Tay Trường MN Ánh Sao';
    let targetFolderId = options.folderId;

    if (!targetFolderId) {
      try {
        const folder = await findOrCreateSchoolFolder(targetFolderName);
        targetFolderId = folder.id;
      } catch (e) {
        console.warn('Không thể tạo thư mục trường, tải lên thư mục gốc:', e);
      }
    }

    const uploadRes = await uploadFileToDrive(file, {
      customName: options.customName,
      folderId: targetFolderId,
      description: options.description,
    });

    if (options.sharingStatus === 'anyone') {
      try {
        await updateDriveSharing(uploadRes.id, 'anyone');
      } catch (e) {
        console.warn('Lỗi cập nhật quyền chia sẻ Drive:', e);
      }
    }

    const now = new Date().toISOString();
    const newRecord: DriveFileRecord = {
      id: 'drive-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      driveFileId: uploadRes.id,
      name: uploadRes.name,
      mimeType: uploadRes.mimeType,
      size: uploadRes.size || '1.0 MB',
      sizeBytes: uploadRes.sizeBytes,
      folderId: targetFolderId,
      folderName: targetFolderName,
      webViewLink: uploadRes.webViewLink,
      webContentLink: uploadRes.webContentLink,
      thumbnailLink: uploadRes.thumbnailLink,
      uploadedBy: currentUser?.name || 'Cán bộ Ánh Sao',
      uploaderEmail: driveUser?.email || currentUser?.email,
      createdAt: now,
      updatedAt: now,
      category: options.category,
      description: options.description || '',
      tags: options.tags || [],
      sharingStatus: options.sharingStatus || 'restricted',
      syncStatus: 'synced',
      meetingId: options.meetingId,
      meetingTitle: options.meetingTitle,
    };

    setDriveFiles((prev) => [newRecord, ...prev]);
    saveDocument(COLLECTIONS.DRIVE_FILES, newRecord).catch((e) =>
      console.warn('Firestore save driveFile err:', e)
    );

    addToast(
      `Đã tải lên tệp "${newRecord.name}" vào Google Drive (${targetFolderName}) thành công!`,
      'success',
      'Tải lên Drive hoàn tất'
    );
    return newRecord;
  };

  const uploadMinuteDirectToDrive = async (
    meeting: Meeting,
    minuteTitle: string,
    content: string,
    _files?: MinuteFileAttachment[]
  ): Promise<DriveFileRecord> => {
    if (!checkDriveConnected()) {
      await connectDrive();
    }

    const schoolFolder = await findOrCreateSchoolFolder('Sổ Tay Trường MN Ánh Sao');
    const uploadRes = await uploadMeetingMinuteToDrive(
      meeting.title,
      minuteTitle || 'Biên bản cuộc họp',
      content,
      schoolFolder.id
    );

    const now = new Date().toISOString();
    const newRecord: DriveFileRecord = {
      id: 'drive-min-' + Date.now(),
      driveFileId: uploadRes.id,
      name: uploadRes.name,
      mimeType: uploadRes.mimeType,
      size: uploadRes.size || '150 KB',
      sizeBytes: uploadRes.sizeBytes,
      folderId: schoolFolder.id,
      folderName: 'Sổ Tay Trường MN Ánh Sao',
      webViewLink: uploadRes.webViewLink,
      webContentLink: uploadRes.webContentLink,
      thumbnailLink: uploadRes.thumbnailLink,
      uploadedBy: currentUser?.name || meeting.host || 'Người chủ trì',
      uploaderEmail: driveUser?.email || currentUser?.email,
      createdAt: now,
      updatedAt: now,
      category: 'Biên bản cuộc họp',
      description: `Biên bản lưu trữ tự động của cuộc họp: ${meeting.title}`,
      tags: ['Biên bản cuộc họp', meeting.type, meeting.targetGroup || 'Toàn trường'],
      sharingStatus: 'restricted',
      syncStatus: 'synced',
      meetingId: meeting.id,
      meetingTitle: meeting.title,
    };

    setDriveFiles((prev) => [newRecord, ...prev]);
    saveDocument(COLLECTIONS.DRIVE_FILES, newRecord).catch((e) =>
      console.warn('Firestore save driveFile err:', e)
    );

    addToast(
      `Đã tự động lưu trữ biên bản cuộc họp vào Google Drive với tên "${uploadRes.name}"!`,
      'success',
      'Lưu trữ Google Drive'
    );
    return newRecord;
  };

  const uploadFeedbackSummaryDirectToDrive = async (
    meeting: Meeting,
    feedbacksList: MeetingFeedback[]
  ): Promise<DriveFileRecord> => {
    if (!checkDriveConnected()) {
      await connectDrive();
    }

    const schoolFolder = await findOrCreateSchoolFolder('Sổ Tay Trường MN Ánh Sao');
    const uploadRes = await uploadMeetingFeedbackToDrive(
      meeting.title,
      feedbacksList,
      schoolFolder.id
    );

    const now = new Date().toISOString();
    const newRecord: DriveFileRecord = {
      id: 'drive-fb-' + Date.now(),
      driveFileId: uploadRes.id,
      name: uploadRes.name,
      mimeType: uploadRes.mimeType,
      size: uploadRes.size || '90 KB',
      sizeBytes: uploadRes.sizeBytes,
      folderId: schoolFolder.id,
      folderName: 'Sổ Tay Trường MN Ánh Sao',
      webViewLink: uploadRes.webViewLink,
      webContentLink: uploadRes.webContentLink,
      thumbnailLink: uploadRes.thumbnailLink,
      uploadedBy: currentUser?.name || 'Ban Giám Hiệu',
      uploaderEmail: driveUser?.email || currentUser?.email,
      createdAt: now,
      updatedAt: now,
      category: 'Ý kiến đóng góp',
      description: `Tổng hợp ${feedbacksList.length} ý kiến đóng góp trong cuộc họp ${meeting.title}`,
      tags: ['Ý kiến đóng góp', meeting.title],
      sharingStatus: 'restricted',
      syncStatus: 'synced',
      meetingId: meeting.id,
      meetingTitle: meeting.title,
    };

    setDriveFiles((prev) => [newRecord, ...prev]);
    saveDocument(COLLECTIONS.DRIVE_FILES, newRecord).catch((e) =>
      console.warn('Firestore save driveFile err:', e)
    );

    addToast(
      `Đã tự động lưu trữ ý kiến đóng góp vào Google Drive với tiêu mục "${uploadRes.name}"!`,
      'success',
      'Lưu trữ Google Drive'
    );
    return newRecord;
  };

  const syncDriveWithFirestore = async () => {
    try {
      const batch = writeBatch(db);
      driveFiles.forEach((f) => batch.set(doc(db, COLLECTIONS.DRIVE_FILES, f.id), f));
      await batch.commit();
      addToast('Đã đồng bộ kho tài liệu Google Drive với Firestore thành công!', 'success');
    } catch (err: any) {
      console.warn('Lỗi đồng bộ Drive với Firestore:', err);
      addToast(err?.message || 'Lỗi đồng bộ', 'error');
    }
  };

  // Utilities
  const resetToDefaultData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(null);
    setMeetings(INITIAL_MEETINGS);
    setAttendance(INITIAL_ATTENDANCE);
    setMinutes(INITIAL_MINUTES);
    setFeedbacks(INITIAL_FEEDBACKS);
    setAiLinks(INITIAL_AI_LINKS);
    setDriveFiles(INITIAL_DRIVE_FILES);
    localStorage.clear();

    // Re-seed to Firestore
    syncAllToFirebase().catch((e) => console.warn('Firestore sync default err:', e));

    addToast('Đã khôi phục toàn bộ dữ liệu mẫu ban đầu của Trường Mầm non Ánh Sao Phường Rạch Dừa', 'info');
  };

  const exportDataJson = () => {
    const exportObject = {
      exportedAt: new Date().toISOString(),
      school: 'Trường Mầm Non Ánh Sao Phường Rạch Dừa',
      firebaseProjectId,
      users,
      meetings,
      attendance,
      minutes,
      feedbacks,
      aiLinks,
      driveFiles,
    };
    return JSON.stringify(exportObject, null, 2);
  };

  const importDataJson = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.meetings && Array.isArray(data.meetings)) {
        if (data.users) setUsers(data.users);
        if (data.meetings) setMeetings(data.meetings);
        if (data.attendance) setAttendance(data.attendance);
        if (data.minutes) setMinutes(data.minutes);
        if (data.feedbacks) setFeedbacks(data.feedbacks);
        if (data.aiLinks) setAiLinks(data.aiLinks);
        if (data.driveFiles) setDriveFiles(data.driveFiles);

        syncAllToFirebase().catch((e) => console.warn('Sync imported to Firestore err:', e));

        addToast('Đã khôi phục dữ liệu từ tệp JSON thành công và đồng bộ Firebase!', 'success');
        return true;
      }
      throw new Error('Định dạng tệp không tương thích');
    } catch {
      addToast('Tệp JSON không hợp lệ hoặc sai cấu trúc', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        meetings,
        attendance,
        minutes,
        feedbacks,
        aiLinks,
        driveFiles,
        isDriveConnected,
        driveUser,
        connectDrive,
        disconnectDrive,
        addDriveFileRecord,
        updateDriveFileRecord,
        deleteDriveFileRecord,
        uploadFileToGoogleDrive,
        uploadMinuteDirectToDrive,
        uploadFeedbackSummaryDirectToDrive,
        syncDriveWithFirestore,
        activeTab,
        selectedMeetingId,
        toasts,
        firebaseConnected,
        firebasePermissionDenied,
        firebaseProjectId,
        checkFirebaseConnection,
        syncAllToFirebase,
        setActiveTab,
        selectMeeting,
        addToast,
        removeToast,
        login,
        loginAsUser,
        logout,
        addUser,
        updateUser,
        deleteUser,
        changePassword,
        adminResetPassword,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        getMeetingEffectiveStatus,
        updateAttendance,
        selfCheckIn,
        getMeetingAttendance,
        addMinute,
        updateMinute,
        deleteMinute,
        getMeetingMinutes,
        addMinuteFile,
        replaceMinuteFile,
        deleteMinuteFile,
        renameMinuteFile,
        addFeedback,
        updateFeedbackStatus,
        deleteFeedback,
        getMeetingFeedbacks,
        addAiLink,
        updateAiLink,
        deleteAiLink,
        incrementLinkViews,
        resetToDefaultData,
        exportDataJson,
        importDataJson,
        pendingDeletions,
        commitPendingDeletion,
        revertPendingDeletion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

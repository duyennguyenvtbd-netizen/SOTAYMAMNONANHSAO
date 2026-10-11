import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db } from './config';

export const COLLECTIONS = {
  USERS: 'users',
  MEETINGS: 'meetings',
  ATTENDANCE: 'attendance',
  MINUTES: 'minutes',
  FEEDBACKS: 'feedbacks',
  AI_LINKS: 'aiLinks',
  DRIVE_FILES: 'driveFiles',
  HEALTHCHECK: '_healthcheck',
};

// Generic save document with safe error handling
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  data: T
): Promise<{ success: boolean; error?: string; permissionDenied?: boolean }> {
  try {
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, data, { merge: true });
    return { success: true };
  } catch (error: any) {
    const isPermission =
      error?.code === 'permission-denied' ||
      error?.message?.includes('insufficient permissions');
    console.warn(`Firestore saveDocument error [${collectionName}/${data.id}]:`, error?.message || error);
    return {
      success: false,
      error: error?.message || 'Lỗi lưu Firestore',
      permissionDenied: isPermission,
    };
  }
}

// Generic delete document with safe error handling
export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<{ success: boolean; error?: string; permissionDenied?: boolean }> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error: any) {
    const isPermission =
      error?.code === 'permission-denied' ||
      error?.message?.includes('insufficient permissions');
    console.warn(`Firestore deleteDocument error [${collectionName}/${id}]:`, error?.message || error);
    return {
      success: false,
      error: error?.message || 'Lỗi xóa Firestore',
      permissionDenied: isPermission,
    };
  }
}

// Batch upload seed data if Firestore collection is empty
export async function seedFirestoreCollection<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<boolean> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty && items.length > 0) {
      const batch = writeBatch(db);
      for (const item of items) {
        const itemRef = doc(db, collectionName, item.id);
        batch.set(itemRef, item);
      }
      await batch.commit();
      return true;
    }
    return false;
  } catch (error: any) {
    console.warn(`Could not seed ${collectionName} in Firestore (Rules might be locked):`, error?.message || error);
    return false;
  }
}

// Test whether Firestore read/write is allowed by the security rules
export async function testFirestoreHealth(): Promise<{
  allowed: boolean;
  permissionDenied: boolean;
  message: string;
}> {
  try {
    // Try to read users collection or healthcheck doc
    const colRef = collection(db, COLLECTIONS.USERS);
    await getDocs(colRef);
    return {
      allowed: true,
      permissionDenied: false,
      message: 'Kết nối Firestore thành công! Rules đang mở cho phép đọc ghi.',
    };
  } catch (error: any) {
    const isDenied =
      error?.code === 'permission-denied' ||
      error?.message?.includes('insufficient permissions') ||
      error?.message?.includes('permission');
    return {
      allowed: false,
      permissionDenied: isDenied,
      message: isDenied
        ? 'Bị chặn bởi Firestore Rules (đang để "allow read, write: if false;"). Vui lòng đổi thành "allow read, write: if true;".'
        : error?.message || 'Không thể kết nối đến Firestore.',
    };
  }
}

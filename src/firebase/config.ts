import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import appletConfig from '../../firebase-applet-config.json';

// Web app Firebase configuration configured for project: sotaymamnonanhsao
export const firebaseConfig = {
  apiKey: appletConfig.apiKey || "AIzaSyCR1bRwMLebHPylfwbbtaBEcP8PvFRxQkE",
  authDomain: appletConfig.authDomain || "sotaymamnonanhsao.firebaseapp.com",
  projectId: appletConfig.projectId || "sotaymamnonanhsao",
  storageBucket: appletConfig.storageBucket || "sotaymamnonanhsao.firebasestorage.app",
  messagingSenderId: appletConfig.messagingSenderId || "532086016342",
  appId: appletConfig.appId || "1:532086016342:web:f4816b75d66614cf6e2ef7",
};

// Initialize Firebase safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCqPc-buNdXyP0soREc9EpHrZcDKGg2Bio",
  authDomain: "hangul-quiz-978f5.firebaseapp.com",
  projectId: "hangul-quiz-978f5",
  storageBucket: "hangul-quiz-978f5.firebasestorage.app",
  messagingSenderId: "735858651757",
  appId: "1:735858651757:web:0fd413fa358c3c887b0564"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBLnqyLJRptS3eoHdqMWSvFc5E6e85Sf5E",
  authDomain: "kaksha-app-8e98d.firebaseapp.com",
  projectId: "kaksha-app-8e98d",
  storageBucket: "kaksha-app-8e98d.firebasestorage.app",
  messagingSenderId: "923958604405",
  appId: "1:923958604405:web:dd30fbbfbfcb211768be3c",
  measurementId: "G-FTLKK03T8F"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

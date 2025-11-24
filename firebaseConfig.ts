// Import the functions you need from the SDKs you need

import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBtZxLWdCyWjIU7lfmUdKQzaTvuOdOUvFw",
  authDomain: "provaeulaliane.firebaseapp.com",
  projectId: "provaeulaliane",
  storageBucket: "provaeulaliane.firebasestorage.app",
  messagingSenderId: "204516735318",
  appId: "1:204516735318:web:5b2ddf3ae9475f386cfef7",
  measurementId: "G-Z04RD8263G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

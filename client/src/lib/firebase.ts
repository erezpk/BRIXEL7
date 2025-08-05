import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDGoJLBzYEsWm3tqDZHXKYvuuDZqJgVEXg",
  authDomain: "brixel7-ed00e.firebaseapp.com",
  projectId: "brixel7-ed00e",
  storageBucket: "brixel7-ed00e.firebasestorage.app",
  messagingSenderId: "483318017359",
  appId: "1:483318017359:web:3a28590b65f9aeaa8d293a",
  measurementId: "G-10K9Y627RN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
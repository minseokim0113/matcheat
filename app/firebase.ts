import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBNly1H7BlG6M8vRqnSp4aHpaSrw8UpEa8",
  authDomain: "matcheat-507ee.firebaseapp.com",
  projectId: "matcheat-507ee",
  storageBucket: "matcheat-507ee.firebasestorage.app",
  messagingSenderId: "479776540391",
  appId: "1:479776540391:web:1d1da3d31d5edf303bc442",
  measurementId: "G-J0NVDHWTTX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
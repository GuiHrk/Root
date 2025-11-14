import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA4DLUelQ6Hoq03fRDBa28TavfAZHSJO7o",
    authDomain: "rootchat-4a986.firebaseapp.com",
    databaseURL: "https://rootchat-4a986-default-rtdb.firebaseio.com",
    projectId: "rootchat-4a986",
    storageBucket: "rootchat-4a986.firebasestorage.app",
    messagingSenderId: "1031518400671",
    appId: "1:1031518400671:web:679807eafaf3e1dfc4b2aa",
    measurementId: "G-SN06QQGJXV"
  };
  
  export const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const db = getDatabase(app);
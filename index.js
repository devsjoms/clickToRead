

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDl2hhMSxuUkHwbY010JrIW_lBkxt9LtrM",
  authDomain: "cliq2read.firebaseapp.com",
  projectId: "cliq2read",
  storageBucket: "cliq2read.firebasestorage.app",
  messagingSenderId: "733605042772",
  appId: "1:733605042772:web:53ebad2ad2e03a90bc6bc1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const input = document.getElementById("fw-input");
const btnPost = document.getElementById("fw-post");
const btnView = document.getElementById("fw-view");
const btnSetName = document.getElementById("fw-username");
const popup = document.getElementById("fw-popup");
const closeBtn = document.querySelector(".fw-close");
const list = document.getElementById("fw-list");
const clearLocalBtn = document.getElementById("fw-clear-local");

function getUsername() {
  return localStorage.getItem("fw_username") || null;
}
function setUsername(name) {
  if (name && name.trim() !== "") {
    localStorage.setItem("fw_username", name.trim());
    return true;
  }
  return false;
}
function promptForName() {
  const n = prompt("Enter display name (will be saved locally):", getUsername() || "Anonymous");
  if (n !== null) {
    if (setUsername(n)) alert("Name saved.");
    else alert("Name not saved. Use a non-empty name.");
  }
}

if (!getUsername()) {
}

/* Post message */
btnPost.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) {
    alert("Please write a message before posting!");
    return;
  }

  const user = getUsername() || (prompt("Enter a display name (saved locally):") || "Anonymous");
  if (!getUsername()) setUsername(user);

  try {
    await addDoc(collection(db, "messages"), {
      user: user,
      text: text,
      createdAt: serverTimestamp()
    });
    input.value = "";
  } catch (err) {
    console.error("Error posting message:", err);
    alert("Failed to post message. Check console for details.");
  }
});

btnView.addEventListener("click", () => {
  popup.style.display = "block";
  popup.setAttribute("aria-hidden", "false");
});

closeBtn.addEventListener("click", () => {
  popup.style.display = "none";
  popup.setAttribute("aria-hidden", "true");
});

window.addEventListener("click", (e) => {
  if (e.target === popup) {
    popup.style.display = "none";
    popup.setAttribute("aria-hidden", "true");
  }
});

/* Set username button */
btnSetName.addEventListener("click", promptForName);

/* Clear saved local name */
clearLocalBtn.addEventListener("click", () => {
  localStorage.removeItem("fw_username");
  alert("Local name cleared. You will be asked next time you post.");
});

/* Real-time messages feed (ordered by createdAt ascending) */
const q = query(collection(db, "messages"), orderBy("createdAt"));

onSnapshot(q, (snapshot) => {
  list.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;

    // format time
    let timeText = "";
    if (data.createdAt && data.createdAt.toDate) {
      timeText = new Date(data.createdAt.toDate()).toLocaleString();
    } else {
      timeText = "—";
    }

    const li = document.createElement("li");

    li.innerHTML = `
      <div class="fw-meta">
        <strong>${escapeHtml(data.user || "Anonymous")}</strong>
        <time datetime="${timeText}">${timeText}</time>
      </div>
      <div class="fw-text">${escapeHtml(data.text || "")}</div>
      <button class="delete-btn" data-id="${id}">Delete</button>
    `;

    // delete handler
    li.querySelector(".delete-btn").addEventListener("click", async (evt) => {
      const id = evt.currentTarget.getAttribute("data-id");
      if (!confirm("Delete this message?")) return;
      try {
        await deleteDoc(doc(db, "messages", id));
      } catch (err) {
        console.error("Delete failed", err);
        alert("Could not delete message. Check console.");
      }
    });

    list.appendChild(li);
  });
});

/* Small helper to prevent HTML injection */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

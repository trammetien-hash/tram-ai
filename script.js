// =======================
// 💬 CHAT SYSTEM
// =======================

const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const userName = document.getElementById("userName");
const botName = document.getElementById("botName");
const bio = document.getElementById("bio");

let chatHistory = [];
let currentChatId = null; // 🔥 THÊM DÒNG NÀY

/* 🔽 SCROLL */
function scrollToBottom() {
  if (!chatArea) return;
  chatArea.scrollTo({
    top: chatArea.scrollHeight,
    behavior: "smooth"
  });
}

/* 💬 ADD MESSAGE */
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  const p = document.createElement("p");
  p.textContent = text;

  msg.appendChild(p);
  chatArea.appendChild(msg);

  scrollToBottom();
}

/* ⌨️ TYPE EFFECT */
function typeMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  const p = document.createElement("p");
  msg.appendChild(p);
  chatArea.appendChild(msg);

  let i = 0;

  function typeWriter() {
    if (i < text.length) {
      p.textContent += text.charAt(i);
      i++;

      if (i % 4 === 0) scrollToBottom();

      const speed = text.length > 120
  ? Math.random() * 10 + 15
  : Math.random() * 25 + 35;
      setTimeout(typeWriter, speed);
    } else {
      scrollToBottom();
    }
  }

  typeWriter();
}

/* 🤖 TYPING */
function showTyping() {
  const typing = document.createElement("div");
  typing.classList.add("message", "bot");
  typing.id = "typingMsg";

  typing.innerHTML = `
    <div class="typing-bubble">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  chatArea.appendChild(typing);
  scrollToBottom();
}

function hideTyping() {
  const typing = document.getElementById("typingMsg");
  if (typing) typing.remove();
}

/* 🌐 CHECK VI */
function containsVietnamese(text) {
  return /[ăâđêôơưĂÂĐÊÔƠƯ]/.test(text);
}

// =======================
// 🤖 API (NEW - CLEAN)
// =======================

import { getAIReply } from "./lib/api.js";
import { addMessage, getHistory } from "./lib/history.js";
import { addMemory, getMemory } from "./lib/memory.js";

/* 🚀 SEND */
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);

  userInput.value = "";
  userInput.focus();
  showTyping();

  try {
    let aiReply = await getAIReply({
  message:
    "User info:\n" +
    getMemory().join("\n") +
    "\n\nMessage:\n" +
    text +
    "\nReply in same language as user.",
    
  history: getHistory(),
  chatId: currentChatId
});

    hideTyping();

    chatHistory.push({ role: "assistant", content: aiReply });
    if (chatHistory.length > 12) chatHistory = chatHistory.slice(-12);

    if (aiReply.length < 200) {
  typeMessage(aiReply, "bot");
} else {
  addMessage(aiReply, "bot");
    }

  } catch (err) {
    hideTyping();
    addMessage("Something went wrong. Try again.", "bot");
  }
}

/* 🎯 EVENTS */
if (sendBtn) sendBtn.addEventListener("click", sendMessage);

if (userInput) {
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

userInput.focus();

// =======================
// 📱 NAVIGATION
// =======================

const pages = document.querySelectorAll(".page");

function showPage(pageId) {
  const pages = document.querySelectorAll(".page"); // move vào đây
  pages.forEach(p => p.classList.remove("active"));

  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");
}

// =======================
// 🎴 CHARACTER SYSTEM (UPGRADE)
// =======================

let characters = JSON.parse(localStorage.getItem("characters"));

if (!characters || characters.length === 0) {
  characters = [
    {
      id: "gentle-giant",
      name: "Gentle Giant",
      desc: "A constant presence that never fully lets go...",
      img: "assets/bot_idle.png"
    }
  ];

  localStorage.setItem("characters", JSON.stringify(characters));
    }

function saveCharacters() {
  localStorage.setItem("characters", JSON.stringify(characters));
}

/* 🎨 RENDER */
function renderCharacters(list = characters) {
  const box = document.getElementById("characterList");
  if (!box) return;

  box.innerHTML = "";

  list.forEach(c => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <img src="${c.img || 'assets/bot_idle.png'}">
      <h3>${c.name}</h3>
      <p>${c.desc}</p>
    `;

    div.onclick = () => {
  localStorage.setItem("currentCharacter", JSON.stringify(c));

  currentChatId = null;
  chatHistory = [];
  chatArea.innerHTML = "";

  const nameEl = document.getElementById("botDisplay");
  if (nameEl) nameEl.innerText = c.name;

  showPage("home");
};

box.appendChild(div);
  });
}

renderCharacters();

/* 🔍 SEARCH */
const searchInput = document.getElementById("searchInput");

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const v = e.target.value.toLowerCase();

    const filtered = characters.filter(c =>
      c.name.toLowerCase().includes(v)
    );

    renderCharacters(filtered);
  });
}

/* ➕ CREATE */
const createBtn = document.getElementById("createBtn");

if (createBtn) {
  createBtn.addEventListener("click", () => {
    const name = document.getElementById("createName").value;
    const desc = document.getElementById("createDesc").value;
    const img = document.getElementById("createImg").value;

    if (!name) return;

    const id = name.toLowerCase().replace(/\s+/g, "-");

    characters.push({ name, desc, img, id });
    saveCharacters();
    renderCharacters();

    document.getElementById("createName").value = "";
    document.getElementById("createDesc").value = "";
    document.getElementById("createImg").value = "";

    showPage("discover");

  });
}

/* 🧠 LOAD CURRENT */
const savedChar = localStorage.getItem("currentCharacter");

if (savedChar) {
  const char = JSON.parse(savedChar);
  const nameEl = document.getElementById("botDisplay");
if (nameEl) nameEl.innerText = char.name;
}

function openProfile() {
  document.getElementById("profileModal").classList.add("active");
  document.body.classList.add("modal-open");
}

function saveProfile() {
  const profile = {
    userName: userName.value,
    botName: botName.value,
    bio: bio.value
  };

  localStorage.setItem("tram_profile", JSON.stringify(profile));

  document.getElementById("profileModal").classList.remove("active");
  document.body.classList.remove("modal-open");
}

function loadProfile() {
  const saved = localStorage.getItem("tram_profile");
  if (!saved) return;

  const profile = JSON.parse(saved);

  if (profile.botName) {
    const nameEl = document.getElementById("botDisplay");
    if (nameEl) nameEl.innerText = profile.botName;
  }
}

loadProfile();

function togglePanel() {
  document.getElementById("panel").classList.toggle("show");
}

const nameEl = document.getElementById("botDisplay");
if (nameEl && botName.value) {
  nameEl.innerText = botName.value;
}

document.addEventListener("click", (e) => {
  const panel = document.getElementById("panel");
  const bar = document.querySelector(".char-bar");

  if (!panel.contains(e.target) && !bar.contains(e.target)) {
    panel.classList.remove("show");
  }
});

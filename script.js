const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// lưu lịch sử chat
let chatHistory = [];

/* 🔥 SCROLL */
function scrollToBottom() {
  chatArea.scrollTo({
    top: chatArea.scrollHeight,
    behavior: "smooth"
  });
}

/* 🔥 ADD MESSAGE */
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  const p = document.createElement("p");
  p.textContent = text;

  msg.appendChild(p);
  chatArea.appendChild(msg);

  scrollToBottom();
}

/* 🔥 TYPE EFFECT */
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

      if (i % 6 === 0) scrollToBottom();

      const speed = Math.random() * 25 + 35;
      setTimeout(typeWriter, speed);
    } else {
      scrollToBottom();
    }
  }

  typeWriter();
}

/* 🔥 TYPING BUBBLE */
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

/* 🔥 detect tiếng Việt */
function containsVietnamese(text) {
  return /[ăâđêôơưĂÂĐÊÔƠƯ]/.test(text);
}

/* 🔥 API CALL */
async function getAIReply(message) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message + "\n(Reply in English only. Do not use Vietnamese.)",
      history: chatHistory,
    }),
  });

  const data = await res.json();
  return data.reply;
}

/* 🔥 SEND MESSAGE */
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");

  chatHistory.push({ role: "user", content: text });
  if (chatHistory.length > 12) chatHistory = chatHistory.slice(-12);

  userInput.value = "";
  showTyping();

  try {
    let aiReply = await getAIReply(text);

    // nếu bị tiếng Việt → ép lại
    if (containsVietnamese(aiReply)) {
      aiReply = await getAIReply(
        text + "\nRewrite your previous answer in English only."
      );
    }

    hideTyping();

    chatHistory.push({ role: "assistant", content: aiReply });
    if (chatHistory.length > 12) chatHistory = chatHistory.slice(-12);

    if (aiReply.length > 180) {
      addMessage(aiReply, "bot");
    } else {
      typeMessage(aiReply, "bot");
    }

  } catch (err) {
    hideTyping();
    addMessage("Something went wrong. Try again.", "bot");
  }
}

/* 🔥 EVENTS */
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

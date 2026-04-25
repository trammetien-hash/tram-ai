const chatArea = document.getElementById("chatArea");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// lưu lịch sử chat ngắn hạn
let chatHistory = [];

function shouldAutoScroll() {
  const threshold = 100;
  return (
    chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight <
    threshold
  );
}

function scrollToBottom(force = false) {
  if (force || shouldAutoScroll()) {
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  const p = document.createElement("p");
  p.textContent = text;

  msg.appendChild(p);
  chatArea.appendChild(msg);

  scrollToBottom();
}

function typeMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  const p = document.createElement("p");
  msg.appendChild(p);
  chatArea.appendChild(msg);

  let i = 0;
  let counter = 0;

  function typeWriter() {
    if (i < text.length) {
      p.textContent += text.charAt(i);
      i++;
      counter++;

      if (counter % 8 === 0) {
        scrollToBottom();
      }

      const speed = Math.floor(Math.random() * 25) + 35;
      setTimeout(typeWriter, speed);
    } else {
      scrollToBottom();
    }
  }

  typeWriter();
}

function showTyping() {
  const typing = document.createElement("div");
  typing.classList.add("message", "bot");
  typing.setAttribute("id", "typingMsg");

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
  const typingMsg = document.getElementById("typingMsg");
  if (typingMsg) typingMsg.remove();
}

async function getAIReply(message) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history: chatHistory,
    }),
  });

  const data = await response.json();
  return data.reply;
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (text === "") return;

  addMessage(text, "user");

  // lưu tin nhắn user
  chatHistory.push({
    role: "user",
    content: text,
  });

  // chỉ giữ 12 tin gần nhất
  if (chatHistory.length > 12) {
    chatHistory = chatHistory.slice(-12);
  }

  userInput.value = "";
  showTyping();

  try {
    const aiReply = await getAIReply(text);

    hideTyping();

    // lưu phản hồi bot
    chatHistory.push({
      role: "assistant",
      content: aiReply,
    });

    if (chatHistory.length > 12) {
      chatHistory = chatHistory.slice(-12);
    }

    if (aiReply.length > 180) {
      addMessage(aiReply, "bot");
    } else {
      typeMessage(aiReply, "bot");
    }

  } catch (error) {
    hideTyping();
    addMessage("Đã xảy ra lỗi khi kết nối AI.", "bot");
  }
}

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});
